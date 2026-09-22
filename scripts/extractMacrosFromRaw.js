// =================================================================
// ZENIT - FASE 4: EXTRACCIÓN DE MACROS OFICIALES (RAW -> CANONICAL)
// Extrae 'Tabla Nutricional' de raw_scrapes y actualiza canonical_foods
// =================================================================

// Polyfill de WebSocket para Node.js < 22 al usar @supabase/supabase-js
if (typeof global.WebSocket === 'undefined') {
  global.WebSocket = class DummyWebSocket {};
}

const path = require('path');
const vm = require('vm');
const { createClient } = require('@supabase/supabase-js');

// 1. Cargar variables de entorno desde .env
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Faltan las variables de Supabase en el .env');
  process.exit(1);
}

if (supabaseKey === process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY) {
  console.warn('⚠️ ATENCIÓN: Estás usando la ANON_KEY. Los updates pueden ser bloqueados por RLS. Asegurate de tener SUPABASE_SERVICE_ROLE_KEY en el .env.');
}

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: { persistSession: false },
});

/**
 * Función robusta para parsear diccionarios de Python con comillas simples
 * y valores nulos/booleanos (None, True, False) a un objeto JavaScript.
 */
function safeParseNutritionTable(raw) {
  if (!raw) return null;
  if (typeof raw === 'object' && !Array.isArray(raw)) return raw;
  if (Array.isArray(raw)) return safeParseNutritionTable(raw[0]);
  if (typeof raw !== 'string') return null;

  const cleaned = raw.trim();
  if (!cleaned) return null;

  // 1. Intento primario: Evaluación segura en sandbox de VM emulando constantes Python
  try {
    const sandbox = {
      None: null,
      True: true,
      False: false,
      NaN: null,
      Infinity: null,
    };
    return vm.runInNewContext(`(${cleaned})`, sandbox, { timeout: 1000 });
  } catch (vmErr) {
    // 2. Intento secundario: Transformación controlada a formato JSON estándar
    try {
      const jsonStr = cleaned
        .replace(/\bNone\b/g, 'null')
        .replace(/\bTrue\b/g, 'true')
        .replace(/\bFalse\b/g, 'false')
        .replace(/'([^'\\]*(?:\\.[^'\\]*)*)'/g, '"$1"');
      return JSON.parse(jsonStr);
    } catch (jsonErr) {
      return null;
    }
  }
}

async function run() {
  console.log('🧪 Iniciando Fase 4: Extracción de Macros Oficiales desde raw_scrapes...');

  // -------------------------------------------------------------
  // PASO 1: Indexar en memoria raw_scrapes que tengan 'Tabla Nutricional'
  // -------------------------------------------------------------
  console.log('📥 Cargando e indexando registros de raw_scrapes con "Tabla Nutricional"...');
  const rawByBarcode = new Map();
  const rawByName = new Map();

  let rawOffset = 0;
  const RAW_PAGE_SIZE = 1000;

  while (true) {
    const { data: rawBatch, error: rawError } = await supabase
      .from('raw_scrapes')
      .select('id, raw_json')
      .not('raw_json->Tabla Nutricional', 'is', null)
      .range(rawOffset, rawOffset + RAW_PAGE_SIZE - 1);

    if (rawError) {
      console.error('❌ Error consultando raw_scrapes con Tabla Nutricional:', rawError.message);
      process.exit(1);
    }

    if (!rawBatch || rawBatch.length === 0) break;

    for (const r of rawBatch) {
      const rawJson = r.raw_json || {};
      const ean = rawJson.items?.[0]?.ean;
      const name = (rawJson.productName || rawJson.name || '').trim().toLowerCase();

      if (ean) {
        rawByBarcode.set(ean, rawJson);
      }
      if (name) {
        rawByName.set(name, rawJson);
      }
    }

    rawOffset += RAW_PAGE_SIZE;
  }

  console.log(`📦 Se indexaron ${rawByBarcode.size} códigos de barra y ${rawByName.size} nombres con información nutricional oficial.`);

  // -------------------------------------------------------------
  // PASO 2: Seleccionar canonical_foods donde calories sea 0 o NULL
  // con JOIN directo a products(id, barcode, source_name) para máxima velocidad
  // -------------------------------------------------------------
  console.log('\n🔍 Buscando canonical_foods pendientes de macros (calories = 0 o NULL)...');
  
  let canonOffset = 0;
  const CANON_PAGE_SIZE = 500;
  let totalProcessed = 0;
  let totalUpdated = 0;
  let withoutNutritionTable = 0;

  while (true) {
    const { data: canonicalList, error: canonError } = await supabase
      .from('canonical_foods')
      .select('id, canonical_name, display_name, calories_100g, products(id, barcode, source_name)')
      .or('calories_100g.eq.0,calories_100g.is.null')
      .range(canonOffset, canonOffset + CANON_PAGE_SIZE - 1);

    if (canonError) {
      console.error('❌ Error consultando canonical_foods:', canonError.message);
      process.exit(1);
    }

    if (!canonicalList || canonicalList.length === 0) break;

    for (const canonical of canonicalList) {
      totalProcessed++;

      // -----------------------------------------------------------
      // PASO 3: Cruce de datos con la tabla products
      // -----------------------------------------------------------
      const productList = canonical.products || [];
      if (productList.length === 0) {
        withoutNutritionTable++;
        continue;
      }

      // Buscar si alguno de los productos asociados tiene coincidencia
      let rawJson = null;

      for (const prod of productList) {
        const barcode = prod.barcode;
        const sourceName = (prod.source_name || '').trim().toLowerCase();

        if (barcode && rawByBarcode.has(barcode)) {
          rawJson = rawByBarcode.get(barcode);
          break;
        } else if (sourceName && rawByName.has(sourceName)) {
          rawJson = rawByName.get(sourceName);
          break;
        }
      }

      const rawTableArray = rawJson ? rawJson['Tabla Nutricional'] : null;
      if (!rawTableArray || !rawTableArray[0]) {
        withoutNutritionTable++;
        continue;
      }

      // -----------------------------------------------------------
      // PASO 4: Extracción y Parseo Robusto
      // -----------------------------------------------------------
      const parsedTable = safeParseNutritionTable(rawTableArray[0]);

      if (!parsedTable || (parsedTable.energy_value === undefined && parsedTable.energy_value_per_portion === undefined)) {
        withoutNutritionTable++;
        continue;
      }

      // -----------------------------------------------------------
      // PASO 5: Mapeo de Macros
      // calories = energy_value (redondeado a entero)
      // protein = protein_value (1 decimal)
      // carbs = carb_value (1 decimal)
      // fats = fat_total_value (1 decimal)
      // -----------------------------------------------------------
      const rawEnergy = parsedTable.energy_value !== undefined 
        ? parsedTable.energy_value 
        : parsedTable.energy_value_per_portion;
      
      const rawProtein = parsedTable.protein_value !== undefined 
        ? parsedTable.protein_value 
        : parsedTable.protein_value_per_portion;

      const rawCarb = parsedTable.carb_value !== undefined 
        ? parsedTable.carb_value 
        : parsedTable.carb_value_per_portion;

      const rawFat = parsedTable.fat_total_value !== undefined 
        ? parsedTable.fat_total_value 
        : (parsedTable.fat_total_value_per_portion !== undefined ? parsedTable.fat_total_value_per_portion : parsedTable.fat_sat_value);

      const calories = Math.round(Number(rawEnergy || 0));
      const protein = Number(Number(rawProtein || 0).toFixed(1));
      const carbs = Number(Number(rawCarb || 0).toFixed(1));
      const fats = Number(Number(rawFat || 0).toFixed(1));

      // Si las calorías parseadas no son válidas o son 0, omitir
      if (calories <= 0) {
        withoutNutritionTable++;
        continue;
      }

      // -----------------------------------------------------------
      // PASO 6: Actualización en canonical_foods
      // macro_source utiliza el valor válido del constraint: 'official_table'
      // -----------------------------------------------------------
      const { error: updateError } = await supabase
        .from('canonical_foods')
        .update({
          calories_100g: calories,
          protein_100g: protein,
          carbs_100g: carbs,
          fats_100g: fats,
          macro_source: 'official_table',
          updated_at: new Date().toISOString(),
        })
        .eq('id', canonical.id);

      if (updateError) {
        console.error(`❌ Error actualizando canónico ${canonical.id}:`, updateError.message);
        continue;
      }

      totalUpdated++;
      console.log(`✅ Macros de "${canonical.canonical_name}" actualizados (Kcal: ${calories}, P: ${protein}, C: ${carbs}, G: ${fats})`);
    }

    canonOffset += CANON_PAGE_SIZE;
  }

  console.log('\n----------------------------------------------------');
  console.log('🎉 Extracción y Actualización de Macros Finalizada.');
  console.log(`📊 Total canónicos evaluados: ${totalProcessed}`);
  console.log(`✅ Total actualizados con macros oficiales: ${totalUpdated}`);
  console.log(`ℹ️ Canónicos sin tabla nutricional en origen: ${withoutNutritionTable}`);
  console.log('----------------------------------------------------');
}

run().catch((err) => {
  console.error('❌ Error global de ejecución:', err.message);
  process.exit(1);
});
