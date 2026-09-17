// =================================================================
// ZENIT - CRAWLER DE JUMBO & CARREFOUR (FITNESS, ORGÁNICOS & IMPORTADOS)
// Extrae productos premium con packshots de estudio HD y etiquetas nutricionales.
// Cuenta con deduplicación estricta para evitar repetir productos ya existentes.
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

function fetchVtexSearch(baseUrl, query, from = 0, to = 15) {
  return new Promise((resolve) => {
    const url = `${baseUrl}/api/catalog_system/pub/products/search?ft=${encodeURIComponent(query)}&_from=${from}&_to=${to}`;
    https.get(
      url,
      {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          'Accept': 'application/json',
        },
        timeout: 12000,
      },
      (res) => {
        if (res.statusCode !== 200 && res.statusCode !== 206) {
          res.resume();
          return resolve([]);
        }
        let data = '';
        res.on('data', (c) => (data += c));
        res.on('end', () => {
          try {
            resolve(JSON.parse(data));
          } catch (e) {
            resolve([]);
          }
        });
      }
    ).on('error', () => resolve([]));
  });
}

// Extraer volumen o peso del nombre
function parsePackageSize(name) {
  const match = name.match(/(\d+(?:[.,]\d+)?)\s*(ml|cc|gr|g|kg|kilo|lt|l|litro|un|u)/i);
  if (!match) return { grams: 100, label: '1 porción (100g)', isLiquid: false };

  let val = parseFloat(match[1].replace(',', '.'));
  const unit = match[2].toLowerCase();

  if (['kg', 'kilo', 'lt', 'l', 'litro'].includes(unit)) {
    val *= 1000;
  }

  val = Math.round(val);
  const isLiquid = ['ml', 'cc', 'lt', 'l', 'litro'].includes(unit);
  const unitSuffix = isLiquid ? 'ml' : 'g';

  return {
    grams: val,
    label: `1 envase (${val}${unitSuffix})`,
    isLiquid,
  };
}

// Resolver macros bromatológicos
function resolveMacros(name, brand, category) {
  const lower = `${brand} ${name}`.toLowerCase();

  // 1. Chocolates y Golosinas (Precedencia antes de frutas para evitar falsos positivos con Bananita Dolca)
  if (lower.includes('chocolate') || lower.includes('dolca') || lower.includes('lindt') || lower.includes('toblerone') || lower.includes('ferrero') || lower.includes('nutella')) {
    return { kcal: 545, prot: 7.0, carbs: 55.0, fat: 32.0, cat: 'Golosinas Premium' };
  }

  // 2. Suplementos & Proteínas
  if (lower.includes('whey') || lower.includes('proteina') || lower.includes('proteína') || lower.includes('ena sport')) {
    if (lower.includes('barra')) {
      return { kcal: 360, prot: 30.0, carbs: 32.0, fat: 10.0, cat: 'Suplementos' };
    }
    return { kcal: 385, prot: 78.0, carbs: 8.0, fat: 4.5, cat: 'Suplementos' };
  }
  if (lower.includes('creatina')) {
    return { kcal: 0, prot: 0.0, carbs: 0.0, fat: 0.0, cat: 'Suplementos' };
  }

  // 3. Leches Vegetales & Bebidas de Soja
  if (lower.includes('silk') || lower.includes('notmilk') || lower.includes('ades') || lower.includes('bebida vegetal') || lower.includes('almendra') || lower.includes('coco') || lower.includes('avena')) {
    if (lower.includes('sin azucar') || lower.includes('sin azúcar')) {
      return { kcal: 24, prot: 0.8, carbs: 1.0, fat: 1.8, cat: 'Bebidas Vegetales' };
    }
    return { kcal: 45, prot: 1.0, carbs: 5.5, fat: 2.0, cat: 'Bebidas Vegetales' };
  }

  // 4. Carnes, Huevos y Pescados
  if (lower.includes('huevo')) {
    return { kcal: 143, prot: 12.6, carbs: 0.8, fat: 9.5, cat: 'Huevos & Granja' };
  }
  if (lower.includes('pechuga') || lower.includes('pollo')) {
    return { kcal: 165, prot: 31.0, carbs: 0.0, fat: 3.6, cat: 'Carnes & Proteínas' };
  }
  if (lower.includes('bife') || lower.includes('lomo') || lower.includes('asado') || lower.includes('vacio') || lower.includes('vacuna') || lower.includes('carne')) {
    return { kcal: 220, prot: 26.0, carbs: 0.0, fat: 13.0, cat: 'Carnes & Proteínas' };
  }
  if (lower.includes('salmon') || lower.includes('salmón')) {
    return { kcal: 208, prot: 20.0, carbs: 0.0, fat: 13.0, cat: 'Pescados' };
  }
  if (lower.includes('merluza')) {
    return { kcal: 82, prot: 18.5, carbs: 0.0, fat: 0.8, cat: 'Pescados' };
  }

  // 5. Frutas & Verduras
  if (lower.includes('banana')) {
    return { kcal: 89, prot: 1.1, carbs: 22.8, fat: 0.3, cat: 'Frutas' };
  }
  if (lower.includes('manzana')) {
    return { kcal: 52, prot: 0.3, carbs: 14.0, fat: 0.2, cat: 'Frutas' };
  }
  if (lower.includes('palta')) {
    return { kcal: 160, prot: 2.0, carbs: 8.5, fat: 14.7, cat: 'Frutas' };
  }
  if (lower.includes('frutilla')) {
    return { kcal: 32, prot: 0.7, carbs: 7.7, fat: 0.3, cat: 'Frutas' };
  }
  if (lower.includes('arandano') || lower.includes('arándano')) {
    return { kcal: 57, prot: 0.7, carbs: 14.5, fat: 0.3, cat: 'Frutas' };
  }
  if (lower.includes('tomate')) {
    return { kcal: 18, prot: 0.9, carbs: 3.9, fat: 0.2, cat: 'Verduras' };
  }

  // 6. Pastas Barilla & Legumbres
  if (lower.includes('barilla') || lower.includes('de cecco') || lower.includes('pasta')) {
    return { kcal: 355, prot: 12.5, carbs: 71.0, fat: 1.5, cat: 'Pastas' };
  }

  // Genérico
  return { kcal: 220, prot: 6.0, carbs: 30.0, fat: 8.0, cat: category || 'Alimento' };
}

async function run() {
  console.log('🛒 Iniciando Cosecha de Jumbo & Carrefour (Fitness, Orgánicos, Frescos e Importados)...');

  // Cargar códigos ya existentes para DEDUPLICACIÓN estricta
  const seenBarcodes = new Set();
  const seenNames = new Set();

  // 1. Barcodes locales de argentineProducts.js
  try {
    const { POPULAR_ARGENTINE_PRODUCTS } = require('../src/data/argentineProducts.js');
    POPULAR_ARGENTINE_PRODUCTS.forEach((p) => {
      if (p.barcode) seenBarcodes.add(p.barcode);
      seenNames.add(`${p.brand} ${p.name}`.toLowerCase().trim());
    });
    console.log(`📌 Cargados ${seenBarcodes.size} códigos de barras locales para evitar duplicados.`);
  } catch (e) {}

  // 2. Barcodes ya existentes en supermarkets_argentina_seed.sql
  try {
    const existingSql = fs.readFileSync(path.resolve(__dirname, 'supermarkets_argentina_seed.sql'), 'utf8');
    const regex = /\('(\d+)'/g;
    let match;
    while ((match = regex.exec(existingSql)) !== null) {
      seenBarcodes.add(match[1]);
    }
    console.log(`📌 Total códigos registrados para deduplicación: ${seenBarcodes.size}.`);
  } catch (e) {}

  const SOURCES = [
    {
      name: 'Jumbo Argentina',
      baseUrl: 'https://www.jumbo.com.ar',
      queries: [
        'proteina', 'ena sport', 'whey protein', 'barra proteica',
        'notco', 'silk', 'leche vegetal', 'mantequilla de mani',
        'sin tacc', 'organico', 'banana', 'pechuga de pollo',
        'huevos', 'palta hass', 'manzana', 'arandanos', 'frutilla',
        'bife de chorizo', 'salmon', 'merluza', 'lindt', 'barilla'
      ],
    },
    {
      name: 'Carrefour Argentina',
      baseUrl: 'https://www.carrefour.com.ar',
      queries: [
        'carrefour bio', 'carrefour sin gluten', 'proteina',
        'yogur griego', 'quinoa', 'arroz integral', 'frutos secos'
      ],
    },
  ];

  const harvested = [];

  for (const source of SOURCES) {
    console.log(`\n📦 Explorando ${source.name}...`);

    for (const query of source.queries) {
      process.stdout.write(`  Buscando "${query}"... `);
      const items = await fetchVtexSearch(source.baseUrl, query, 0, 15);

      let addedFromQuery = 0;
      for (const item of items) {
        const ean = item.items?.[0]?.ean;
        const images = item.items?.[0]?.images || [];
        const rawName = (item.productName || '').trim();
        const brand = (item.brand || '').trim() || source.name;

        if (!ean || ean.length < 8 || seenBarcodes.has(ean) || !rawName || images.length === 0) {
          continue;
        }

        const nameKey = `${brand} ${rawName}`.toLowerCase().trim();
        if (seenNames.has(nameKey)) continue;

        seenBarcodes.add(ean);
        seenNames.add(nameKey);

        const frontImg = images[0]?.imageUrl?.split('?')[0];
        // Foto 2 opcional (rótulo / etiqueta nutricional del reverso)
        const labelImg = images.length > 1 ? images[1]?.imageUrl?.split('?')[0] : null;

        const pkg = parsePackageSize(rawName);
        const macro = resolveMacros(rawName, brand, item.categories?.[0]);

        let unitGrams = pkg.grams;
        let unitName = pkg.label;
        let defaultPortionType = 'unit';

        const lowerName = rawName.toLowerCase();
        if (macro.cat === 'Huevos & Granja' || lowerName.includes('huevo')) {
          unitGrams = 55;
          unitName = '1 huevo (55g)';
          defaultPortionType = 'unit';
        } else if (lowerName.includes('whey') || lowerName.includes('proteina') || lowerName.includes('proteína')) {
          if (!lowerName.includes('barra')) {
            unitGrams = 30;
            unitName = '1 scoop (30g)';
            defaultPortionType = 'unit';
          }
        } else if (lowerName.includes('creatina')) {
          unitGrams = 5;
          unitName = '1 scoop (5g)';
          defaultPortionType = 'unit';
        } else if (lowerName.includes('banana')) {
          unitGrams = 120;
          unitName = '1 banana mediana (120g)';
          defaultPortionType = 'unit';
        } else if (lowerName.includes('manzana')) {
          unitGrams = 150;
          unitName = '1 manzana (150g)';
          defaultPortionType = 'unit';
        } else if (lowerName.includes('palta')) {
          unitGrams = 70;
          unitName = '1/2 palta (70g)';
          defaultPortionType = 'unit';
        } else if (macro.cat === 'Carnes & Proteínas' || macro.cat === 'Pescados') {
          unitGrams = 150;
          unitName = '1 porción (150g)';
          defaultPortionType = 'grams';
        } else if (pkg.isLiquid && pkg.grams > 500) {
          unitGrams = 200;
          unitName = '1 vaso (200ml)';
          defaultPortionType = 'unit';
        } else if (!pkg.isLiquid && pkg.grams > 250) {
          unitGrams = 50;
          unitName = '1 porción (50g)';
          defaultPortionType = 'grams';
        }

        const ratio = unitGrams / 100;
        const unitKcal = Math.round(macro.kcal * ratio);
        const unitProt = Number((macro.prot * ratio).toFixed(1));
        const unitCarbs = Number((macro.carbs * ratio).toFixed(1));
        const unitFats = Number((macro.fat * ratio).toFixed(1));

        harvested.push({
          barcode: ean,
          name: rawName,
          brand,
          category: macro.cat,
          calories: macro.kcal,
          protein: macro.prot,
          carbs: macro.carbs,
          fats: macro.fat,
          defaultPortionType,
          servingSize: `${unitGrams}${pkg.isLiquid ? 'ml' : 'g'}`,
          unitName,
          unitGrams,
          unitCalories: unitKcal,
          unitProtein: unitProt,
          unitCarbs,
          unitFats,
          image: frontImg,
          nutritionImage: labelImg,
          packageGrams: pkg.grams,
          source: source.name,
        });

        addedFromQuery++;
      }

      console.log(`+${addedFromQuery} nuevos`);
      await sleep(300);
    }
  }

  console.log(`\n🎉 Cosecha finalizada: ${harvested.length} productos nuevos únicos (cero duplicados).`);

  if (harvested.length === 0) return;

  // Ordenar por marca y gramaje
  harvested.sort((a, b) => {
    if (a.brand !== b.brand) return a.brand.localeCompare(b.brand);
    return a.packageGrams - b.packageGrams;
  });

  const values = harvested
    .map((p) => {
      return `(${esc(p.barcode)}, ${esc(p.name)}, ${esc(p.brand)}, ${esc(p.category)}, ${p.calories}, ${p.protein}, ${p.carbs}, ${p.fats}, ${esc(p.defaultPortionType)}, ${esc(p.servingSize)}, ${esc(p.unitName)}, ${p.unitGrams}, ${p.unitCalories}, ${p.unitProtein}, ${p.unitCarbs}, ${p.unitFats}, ${esc(p.image)}, 'approved')`;
    })
    .join(',\n');

  const sql = `-- =================================================================
-- CATÁLOGO JUMBO & CARREFOUR (FITNESS, ORGÁNICOS, FRESCOS E IMPORTADOS)
-- Total nuevos productos únicos: ${harvested.length}
-- Cero duplicados contra catálogo local y Día Online
-- =================================================================

INSERT INTO public.foods (
  barcode, name, brand, category,
  calories, protein, carbs, fats,
  default_portion_type, serving_size, unit_name, unit_grams,
  unit_calories, unit_protein, unit_carbs, unit_fats,
  image, status
) VALUES
${values}
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

  const outPath = path.resolve(__dirname, 'jumbo_carrefour_seed.sql');
  fs.writeFileSync(outPath, sql, 'utf8');
  console.log(`💾 Catálogo guardado en: ${outPath} (${(fs.statSync(outPath).size / 1024).toFixed(1)} KB)`);
}

run().catch(console.error);
