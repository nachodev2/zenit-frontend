// Polyfill de WebSocket para Node.js < 22 al usar @supabase/supabase-js
if (typeof global.WebSocket === 'undefined') {
  global.WebSocket = class DummyWebSocket {};
}

const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

// 1. Cargar variables de entorno desde .env
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
// Usar la SERVICE ROLE KEY para poder hacer inserts en tablas con RLS
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Faltan las variables de Supabase en el .env');
  process.exit(1);
}

if (supabaseKey === process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY) {
  console.warn('⚠️ ATENCIÓN: Estás usando la ANON_KEY. Los inserts pueden fallar silenciosamente o ser bloqueados por RLS. Agregá SUPABASE_SERVICE_ROLE_KEY al .env si tenés problemas.');
}

const supabase = createClient(supabaseUrl, supabaseKey, {
    auth: {
        persistSession: false
    }
});

/**
 * Mapeo de Category Path (Reglas Duras)
 */
function mapCategoryPath(pathStr) {
  if (!pathStr) return { isFood: true, category: 'otros' };
  const lower = pathStr.toLowerCase();

  const noFoodKeywords = ['limpieza', 'perfumería', 'perfumeria', 'mascotas', 'hogar', 'bazar', 'electro', 'juguetería', 'farmacia', 'textil', 'librería', 'libreria'];
  for (const word of noFoodKeywords) {
    if (lower.includes(word)) return { isFood: false };
  }

  if (lower.includes('fruta') || lower.includes('verdura')) return { isFood: true, category: 'frutas_verduras' };
  if (lower.includes('carne') || lower.includes('pescado') || lower.includes('marisco') || lower.includes('pollo') || lower.includes('cerdo')) return { isFood: true, category: 'carnes_pescados' };
  if (lower.includes('lacteo') || lower.includes('lácteo') || lower.includes('queso') || lower.includes('yogur') || lower.includes('leche')) return { isFood: true, category: 'lacteos' };
  if (lower.includes('huevo')) return { isFood: true, category: 'huevos' };
  if (lower.includes('legumbre') || lower.includes('cereal') || lower.includes('arroz') || lower.includes('pasta')) return { isFood: true, category: 'cereales_legumbres' };
  if (lower.includes('panadería') || lower.includes('panaderia') || lower.includes('pan') || lower.includes('galletita') || lower.includes('bizcocho')) return { isFood: true, category: 'panificados' };
  if (lower.includes('conserva') || lower.includes('enlatado')) return { isFood: true, category: 'conservas' };
  if (lower.includes('bebida') || lower.includes('jugo') || lower.includes('agua') || lower.includes('cerveza') || lower.includes('vino')) return { isFood: true, category: 'bebidas' };
  if (lower.includes('snack') || lower.includes('golosina') || lower.includes('alfajor') || lower.includes('chocolate') || lower.includes('dulce')) return { isFood: true, category: 'snacks' };
  if (lower.includes('aderezo') || lower.includes('salsa') || lower.includes('condimento') || lower.includes('especia')) return { isFood: true, category: 'condimentos_salsas' };
  if (lower.includes('aceite') || lower.includes('manteca') || lower.includes('margarina')) return { isFood: true, category: 'aceites_grasas' };
  if (lower.includes('congelado')) return { isFood: true, category: 'congelados' };
  if (lower.includes('suplemento') || lower.includes('proteina') || lower.includes('nutricion deportiva')) return { isFood: true, category: 'suplementos' };

  return { isFood: true, category: 'otros' };
}

/**
 * Extracción de Tamaño y Limpieza de Nombre
 */
function parseProductData(rawName) {
  if (!rawName) return { cleanName: 'Desconocido', package_grams: null, selling_unit: 'unit' };
  
  let cleanName = rawName;
  let package_grams = null;
  let selling_unit = 'unit';

  const volMatch = rawName.match(/(\d+(?:[.,]\d+)?)\s*(ml|cc|gr|g|kg|kilo|lt|l|litro|litros|lts)\b/i);
  if (volMatch) {
    let val = parseFloat(volMatch[1].replace(',', '.'));
    const unit = volMatch[2].toLowerCase();

    if (['kg', 'kilo', 'lt', 'l', 'litro', 'litros', 'lts'].includes(unit)) {
      val *= 1000;
    }

    package_grams = Math.round(val);
    const isLiquid = ['ml', 'cc', 'lt', 'l', 'litro', 'litros', 'lts'].includes(unit);
    selling_unit = isLiquid ? 'ml' : 'g';

    cleanName = rawName.replace(volMatch[0], '');
  } else {
    const unitMatch = rawName.match(/(\d+)\s*(?:unidades|unid|un|u)\b/i);
    if (unitMatch) {
      selling_unit = 'unit';
      cleanName = rawName.replace(unitMatch[0], '');
    }
  }

  cleanName = cleanName
    .replace(/[-\s]+$/, '')
    .replace(/^[-\s]+/, '')
    .replace(/\s{2,}/g, ' ')
    .trim();

  if (!cleanName) cleanName = rawName;

  return { cleanName, package_grams, selling_unit };
}

async function run() {
  console.log('🚀 Iniciando Pipeline Determinístico: RAW -> CANONICAL -> PRODUCTS');

  const { data: rawItems, error: fetchError } = await supabase
    .from('raw_scrapes')
    .select('*')
    .eq('status', 'pending')
    .limit(500);

  if (fetchError) {
    console.error('❌ Error fatal obteniendo raw_scrapes:', fetchError.message);
    process.exit(1);
  }

  if (!rawItems || rawItems.length === 0) {
    console.log('✅ No hay items pendientes en raw_scrapes.');
    return;
  }

  console.log(`📦 Procesando ${rawItems.length} items pendientes...`);

  let processedCount = 0;
  let rejectedCount = 0;
  let errorCount = 0;

  for (const raw of rawItems) {
    try {
      const itemJson = raw.raw_json || {};
      const rawName = itemJson.productName || itemJson.name || 'Desconocido';
      const brand = itemJson.brand || null;
      const barcode = (itemJson.items && itemJson.items[0] && itemJson.items[0].ean) ? itemJson.items[0].ean : null;
      
      let imageUrl = null;
      if (itemJson.items && itemJson.items[0] && itemJson.items[0].images && itemJson.items[0].images.length > 0) {
        imageUrl = itemJson.items[0].images[0].imageUrl;
      }

      const mapResult = mapCategoryPath(raw.source_category_path);
      
      if (!mapResult.isFood) {
        const { error: rejectError } = await supabase.from('raw_scrapes').update({ status: 'error' }).eq('id', raw.id);
        if (rejectError) {
           console.error(`❌ Error actualizando status de rechazo para ${raw.id}:`, rejectError.message);
        }
        rejectedCount++;
        continue;
      }

      const { cleanName, package_grams, selling_unit } = parseProductData(rawName);

      // INSERT CANONICAL
      const { data: canonicalData, error: canonicalError } = await supabase
        .from('canonical_foods')
        .insert({
          canonical_name: cleanName,
          display_name: cleanName,
          category: mapResult.category,
          food_type: 'comercial',
          serving_mode: selling_unit === 'unit' ? 'unit' : 'packaged_volume',
          calories_100g: 0,
          protein_100g: 0,
          carbs_100g: 0,
          fats_100g: 0,
          macro_source: 'legacy_heuristic',
          classification_method: 'source_category_map',
          classification_reason: `Mapeado desde: ${raw.source_category_path}`
        })
        .select('id')
        .single();

      if (canonicalError) {
        throw new Error(`Fallo Insert Canonical: ${canonicalError.message}`);
      }

      if (!canonicalData || !canonicalData.id) {
         throw new Error(`Fallo Insert Canonical: No se retornó el ID.`);
      }

      // INSERT PRODUCT
      const { error: productError } = await supabase
        .from('products')
        .insert({
          canonical_food_id: canonicalData.id,
          barcode: barcode,
          brand: brand,
          source_name: rawName,
          package_grams: package_grams,
          selling_unit: selling_unit,
          image: imageUrl,
          source: raw.source,
          status: 'pending_review'
        });

      if (productError) {
        if (productError.code === '23505') { // Unique violation
          console.warn(`⚠️ Duplicado de barcode ignorado para: ${rawName} (${barcode})`);
          // Lo marcamos procesado igual porque ya existe
        } else {
          // Transaccionalidad manual (rollback lógico): si falló el producto, avisamos que el canónico quedó huérfano.
          console.warn(`⚠️ Warning: El canónico ${canonicalData.id} quedó huérfano porque falló la inserción del producto.`);
          throw new Error(`Fallo Insert Product: ${productError.message}`);
        }
      }

      // UPDATE STATUS
      const { error: updateError } = await supabase.from('raw_scrapes').update({ status: 'processed' }).eq('id', raw.id);
      if (updateError) {
          throw new Error(`Fallo Update raw_scrapes status: ${updateError.message}`);
      }

      processedCount++;

    } catch (err) {
      console.error(`❌ Error Crítico en raw_id ${raw.id}: ${err.message}`);
      
      // Intentamos marcar el registro con error, ignoramos si esta query misma falla por RLS.
      await supabase.from('raw_scrapes').update({ status: 'error' }).eq('id', raw.id).catch(() => {});
      
      errorCount++;
    }
  }

  console.log('----------------------------------------------------');
  console.log(`✅ Finalizado.`);
  console.log(`📊 Procesados correctamente: ${processedCount}`);
  console.log(`🚫 Rechazados (No comida): ${rejectedCount}`);
  console.log(`⚠️ Errores (Falla SQL/Duplicados): ${errorCount}`);
  console.log('----------------------------------------------------');
}

run().catch(err => {
    console.error('❌ Error global de ejecución:', err.message);
    process.exit(1);
});

