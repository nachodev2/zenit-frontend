// =================================================================
// ZENIT - SCRIPT DE INGESTA MASIVA: OPEN FOOD FACTS ARGENTINA
// Extrae miles de alimentos argentinos, aplica filtro bromatológico
// estricto (fórmula Atwater) y genera archivo SQL listo para Supabase
// =================================================================

const fs = require('fs');
const path = require('path');
const https = require('https');

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function esc(val) {
  if (val === null || val === undefined) return 'NULL';
  if (typeof val === 'number') return val;
  return "'" + String(val).replace(/'/g, "''") + "'";
}

function fetchPage(page, pageSize = 50) {
  return new Promise((resolve, reject) => {
    const url = `https://world.openfoodfacts.org/api/v2/search?countries_tags_en=argentina&fields=code,product_name,brands,categories,nutriments,serving_size,serving_quantity,image_front_url&page_size=${pageSize}&page=${page}`;
    
    const req = https.get(
      url,
      {
        headers: {
          'User-Agent': 'ZenitApp - DataCrawler - Version 1.0 (contact@zenitapp.com)',
          'Accept': 'application/json',
        },
        timeout: 25000,
      },
      (res) => {
        if (res.statusCode !== 200) {
          res.resume();
          return resolve({ products: [], count: 0, status: res.statusCode });
        }

        let data = '';
        res.on('data', (chunk) => (data += chunk));
        res.on('end', () => {
          try {
            resolve(JSON.parse(data));
          } catch (e) {
            resolve({ products: [], count: 0, error: 'parse_error' });
          }
        });
      }
    );

    req.on('error', (err) => resolve({ products: [], error: err.message }));
    req.on('timeout', () => {
      req.destroy();
      resolve({ products: [], error: 'timeout' });
    });
  });
}

function validateAndFormat(p) {
  const code = (p.code || '').trim();
  const name = (p.product_name_es || p.product_name || '').trim();
  const brand = (p.brands || '').trim() || 'Nacional';
  const category = (p.categories || '').split(',')?.[0]?.trim() || 'Alimento';
  const img = p.image_front_url || null;

  // 1. Validaciones básicas de integridad
  if (!code || code.length < 8 || !/^\d+$/.test(code)) return null;
  if (!name || name.length < 3) return null;
  if (!img) return null; // Exigir foto de producto para mantener estética Zenit

  // 2. Extracción de macronutrientes
  const nutriments = p.nutriments || {};
  const kcal = Math.round(Number(nutriments['energy-kcal_100g'] || nutriments['energy-kcal'] || 0));
  const prot = Number((nutriments.proteins_100g || 0).toFixed(1));
  const carbs = Number((nutriments.carbohydrates_100g || 0).toFixed(1));
  const fat = Number((nutriments.fat_100g || 0).toFixed(1));

  // 3. Filtros bromatológicos (Valores imposibles descartados)
  if (kcal <= 0 || kcal > 900) return null; // 900 kcal es aceite puro de oliva / grasa
  if (prot < 0 || prot > 100 || carbs < 0 || carbs > 100 || fat < 0 || fat > 100) return null;

  // 4. Ecuación Atwater de consistencia energética: (4*P + 4*C + 9*G) ≈ Kcal
  const calcKcal = prot * 4 + carbs * 4 + fat * 9;
  const tolerance = kcal * 0.35 + 20; // 35% de tolerancia por fibra y polialcoholes
  if (Math.abs(calcKcal - kcal) > tolerance) return null;

  // 5. Normalización de porción
  let servingStr = (p.serving_size || '').trim();
  let servingGrams = Number(p.serving_quantity) || 0;
  if (!servingGrams && servingStr) {
    const match = servingStr.match(/(\d+(?:[.,]\d+)?)\s*(?:g|ml|gr|cl)/i);
    if (match) {
      servingGrams = parseFloat(match[1].replace(',', '.'));
      if (servingStr.toLowerCase().includes('cl')) servingGrams *= 10;
    }
  }
  if (!servingGrams || servingGrams <= 0) servingGrams = 100;

  const lowerName = name.toLowerCase();
  const isUnit =
    servingGrams !== 100 ||
    lowerName.includes('alfajor') ||
    lowerName.includes('lata') ||
    lowerName.includes('yogur') ||
    lowerName.includes('huevo') ||
    lowerName.includes('empanada') ||
    lowerName.includes('paty') ||
    lowerName.includes('snack') ||
    lowerName.includes('barra');

  const unitRatio = servingGrams / 100;
  const unitKcal = Math.round(kcal * unitRatio);
  const unitProt = Number((prot * unitRatio).toFixed(1));
  const unitCarbs = Number((carbs * unitRatio).toFixed(1));
  const unitFat = Number((fat * unitRatio).toFixed(1));

  let unitName = `1 porción (${Math.round(servingGrams)}g)`;
  if (lowerName.includes('alfajor')) unitName = `1 alfajor (${Math.round(servingGrams)}g)`;
  else if (lowerName.includes('lata')) unitName = `1 lata (${Math.round(servingGrams)}ml)`;
  else if (lowerName.includes('pote') || lowerName.includes('yogur')) unitName = `1 pote (${Math.round(servingGrams)}g)`;
  else if (lowerName.includes('huevo')) unitName = `1 huevo (${Math.round(servingGrams)}g)`;

  // Packshot HD en lugar de miniatura de 200px
  const hdImage = img.replace(/\.(200|100)\.jpg$/i, '.400.jpg');

  return {
    barcode: code,
    name: name.substring(0, 250),
    brand: brand.substring(0, 140),
    category: category.substring(0, 95),
    calories: kcal,
    protein: prot,
    carbs: carbs,
    fats: fat,
    defaultPortionType: isUnit ? 'unit' : 'grams',
    servingSize: servingStr || `${Math.round(servingGrams)}g`,
    unitName,
    unitGrams: Math.round(servingGrams),
    unitCalories: unitKcal,
    unitProtein: unitProt,
    unitCarbs: unitCarbs,
    unitFats: unitFat,
    image: hdImage,
    status: 'approved',
  };
}

async function run(maxPages = 20) {
  console.log('🚀 Iniciando ingesta masiva de Open Food Facts Argentina...');
  console.log(`🎯 Meta: procesar hasta ${maxPages} páginas (~1000 productos con filtro de calidad).`);

  const seenBarcodes = new Set();
  const approvedList = [];

  for (let page = 1; page <= maxPages; page++) {
    process.stdout.write(`⏳ Consultando página ${page}/${maxPages}... `);
    const data = await fetchPage(page, 50);

    if (!data.products || data.products.length === 0) {
      console.log('Sin más productos o respuesta vacía. Deteniendo.');
      break;
    }

    let pageApproved = 0;
    for (const raw of data.products) {
      const formatted = validateAndFormat(raw);
      if (formatted && !seenBarcodes.has(formatted.barcode)) {
        seenBarcodes.add(formatted.barcode);
        approvedList.push(formatted);
        pageApproved++;
      }
    }

    console.log(`✅ Aprobados: ${pageApproved}/${data.products.length} (Total acumulado: ${approvedList.length})`);
    // Pausa respetuosa para no saturar la API
    await sleep(750);
  }

  console.log(`\n🎉 Ingesta finalizada. Total de alimentos curados y validados: ${approvedList.length}`);

  if (approvedList.length === 0) {
    console.log('⚠️ No se encontraron productos nuevos.');
    return;
  }

  // Generar archivo SQL de inserción
  const sqlValues = approvedList.map((p) => {
    return `(${esc(p.barcode)}, ${esc(p.name)}, ${esc(p.brand)}, ${esc(p.category)}, ${p.calories}, ${p.protein}, ${p.carbs}, ${p.fats}, ${esc(p.defaultPortionType)}, ${esc(p.servingSize)}, ${esc(p.unitName)}, ${p.unitGrams}, ${p.unitCalories}, ${p.unitProtein}, ${p.unitCarbs}, ${p.unitFats}, ${esc(p.image)}, 'approved')`;
  }).join(',\n');

  const sqlContent = `-- =================================================================
-- VOLCADO MASIVO CURADO OPEN FOOD FACTS ARGENTINA (${approvedList.length} ALIMENTOS)
-- Creado automáticamente con filtro de calidad Atwater y códigos EAN reales
-- =================================================================

INSERT INTO public.foods (
  barcode, name, brand, category,
  calories, protein, carbs, fats,
  default_portion_type, serving_size, unit_name, unit_grams,
  unit_calories, unit_protein, unit_carbs, unit_fats,
  image, status
) VALUES
${sqlValues}
ON CONFLICT (barcode) DO UPDATE SET
  name = EXCLUDED.name,
  brand = EXCLUDED.brand,
  category = EXCLUDED.category,
  calories = EXCLUDED.calories,
  protein = EXCLUDED.protein,
  carbs = EXCLUDED.carbs,
  fats = EXCLUDED.fats,
  default_portion_type = EXCLUDED.default_portion_type,
  serving_size = EXCLUDED.serving_size,
  unit_name = EXCLUDED.unit_name,
  unit_grams = EXCLUDED.unit_grams,
  unit_calories = EXCLUDED.unit_calories,
  unit_protein = EXCLUDED.unit_protein,
  unit_carbs = EXCLUDED.unit_carbs,
  unit_fats = EXCLUDED.unit_fats,
  image = EXCLUDED.image,
  status = 'approved';
`;

  const outPath = path.resolve(__dirname, 'massive_openfoodfacts_argentina.sql');
  fs.writeFileSync(outPath, sqlContent, 'utf8');
  console.log(`💾 Archivo SQL generado con éxito: ${outPath}`);
}

run(10).catch((e) => console.error('Error fatal:', e));
