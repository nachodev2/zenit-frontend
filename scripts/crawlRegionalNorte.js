// =================================================================
// ZENIT - CRAWLER REGIONAL NORTE & TUCUMÁN (VEA & CHANGOMÁS)
// Extrae productos comercializados en el NOA y Argentina profunda:
// - Secco (Cola, Pomelo, Naranja, Lima, Soda)
// - Cervezas Norte y Salta
// - Lácteos Manfrey, Tregar, Ilolay, SanCor
// - Azúcares y Almacén Ledesma, Chango, Morixe, Cañuelas, Mendía
// - Golosinas y Galletitas Tía Maruca, Nevares, Oblita, Dulcor, Emeth
// Deduplicación estricta contra el catálogo maestro existente.
// =================================================================

const fs = require('fs');
const path = require('path');
const https = require('https');

const placeholderPath = path.resolve(__dirname, 'jumbo_placeholders.json');
const placeholders = fs.existsSync(placeholderPath)
  ? new Set(JSON.parse(fs.readFileSync(placeholderPath, 'utf8')))
  : new Set();

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function esc(val) {
  if (val === null || val === undefined) return 'NULL';
  if (typeof val === 'number') return val;
  return "'" + String(val).replace(/'/g, "''") + "'";
}

const NON_FOOD_KEYWORDS = [
  'depiladora', 'afeitadora', 'shampoo', 'acondicionador', 'jabon', 'jabón',
  'lavandina', 'detergente', 'suavizante', 'desodorante', 'dentifrico', 'dentífrico',
  'cepillo', 'insecticida', 'pañal', 'pañales', 'toalla femenina', 'toallitas',
  'tampon', 'tampón', 'higienico', 'higiénico', 'limpiador', 'trapo', 'esponja',
  'dosificador', 'perfume', 'colonia', 'tintura', 'algodon', 'algodón', 'preservativo',
  'crema facial', 'crema corporal', 'protector solar', 'bronceador', 'juguete', 'pila ',
  'dog chow', 'cat chow', 'catchow', 'dogchow', 'whiskas', 'pedigree', 'felix',
  'gati', 'purina', 'temptations', 'pets class', 'eukanuba', 'royal canin', 'pro plan',
  'mascota', 'mascotas', 'canino', 'felino', 'plato hondo', 'vaso vidrio', 'fuente vidrio',
  'ayudin', 'ayudín', 'cif', 'magistral', 'skip', 'ariel', 'vivere', 'comfort', 'poett',
  'glade', 'lysoform', 'procacen', 'mr musculo', 'trenet', 'vanish'
];

function isFood(name, brand) {
  const lower = `${brand || ''} ${name || ''}`.toLowerCase();
  if (lower.includes('perro') && !lower.includes('vino')) return false;
  if (lower.includes('gato') && !lower.includes('gatorade') && !lower.includes('rigatoni')) return false;
  return !NON_FOOD_KEYWORDS.some((w) => lower.includes(w));
}

function fetchVtexSearch(baseUrl, query, from = 0, to = 20) {
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

function parsePackageSize(name) {
  const volMatch = name.match(/(\d+(?:[.,]\d+)?)\s*(ml|cc|gr|g|kg|kilo|lt|l|litro|litros|lts)\b/i);
  if (volMatch) {
    let val = parseFloat(volMatch[1].replace(',', '.'));
    const unit = volMatch[2].toLowerCase();

    if (['kg', 'kilo', 'lt', 'l', 'litro', 'litros', 'lts'].includes(unit)) {
      val *= 1000;
    }

    val = Math.round(val);
    const isLiquid = ['ml', 'cc', 'lt', 'l', 'litro', 'litros', 'lts'].includes(unit);
    const unitSuffix = isLiquid ? 'ml' : 'g';

    return {
      grams: val,
      label: `1 envase (${val}${unitSuffix})`,
      isLiquid,
    };
  }

  const unitMatch = name.match(/(\d+)\s*(?:unidades|unid|un|u)\b/i);
  if (unitMatch) {
    const count = parseInt(unitMatch[1], 10) || 1;
    return {
      grams: count * 50,
      label: `1 unidad`,
      isLiquid: false,
    };
  }

  return { grams: 100, label: '1 porción (100g)', isLiquid: false };
}

function resolveBromatologicalMacros(name, brand, category) {
  const lower = `${brand} ${name}`.toLowerCase();

  // 1. Gaseosas, Bebidas y Cervezas Regionales
  if (lower.includes('secco') || lower.includes('manaos') || lower.includes('cunnington') || lower.includes('torasso') || lower.includes('gaseosa')) {
    if (lower.includes('zero') || lower.includes('sin azucar') || lower.includes('sin azúcar') || lower.includes('diet') || lower.includes('light')) {
      return { kcal: 0, prot: 0, carbs: 0, fat: 0, cat: 'Gaseosas' };
    }
    return { kcal: 41, prot: 0, carbs: 10.3, fat: 0, cat: 'Gaseosas' };
  }
  if (lower.includes('soda') || (lower.includes('agua') && !lower.includes('saborizada'))) {
    return { kcal: 0, prot: 0, carbs: 0, fat: 0, cat: 'Aguas' };
  }
  if (lower.includes('cerveza') || lower.includes('norte') || lower.includes('salta') || lower.includes('quilmes') || lower.includes('brahma')) {
    if (lower.includes('negra') || lower.includes('stout')) {
      return { kcal: 48, prot: 0.6, carbs: 4.8, fat: 0, cat: 'Cervezas' };
    }
    return { kcal: 42, prot: 0.4, carbs: 3.6, fat: 0, cat: 'Cervezas' };
  }
  if (lower.includes('vino') || lower.includes('malbec') || lower.includes('torrontes') || lower.includes('torrontés') || lower.includes('cafayate') || lower.includes('etchart')) {
    return { kcal: 83, prot: 0.1, carbs: 2.6, fat: 0, cat: 'Vinos' };
  }

  // 2. Lácteos (Manfrey, Tregar, Ilolay, SanCor)
  if (lower.includes('leche')) {
    if (lower.includes('descremada') || lower.includes('0%') || lower.includes('1%')) {
      return { kcal: 32, prot: 3.1, carbs: 4.8, fat: 0.1, cat: 'Lácteos' };
    }
    return { kcal: 58, prot: 3.0, carbs: 4.7, fat: 3.0, cat: 'Lácteos' };
  }
  if (lower.includes('yogur') || lower.includes('yogurt')) {
    if (lower.includes('descremado') || lower.includes('diet') || lower.includes('light')) {
      return { kcal: 42, prot: 3.8, carbs: 5.8, fat: 0.2, cat: 'Lácteos' };
    }
    return { kcal: 78, prot: 3.2, carbs: 12.5, fat: 1.8, cat: 'Lácteos' };
  }
  if (lower.includes('dulce de leche')) {
    return { kcal: 315, prot: 6.5, carbs: 55.0, fat: 7.5, cat: 'Dulces & Mermeladas' };
  }
  if (lower.includes('queso')) {
    if (lower.includes('por salut') || lower.includes('port salut') || lower.includes('cremoso light')) {
      return { kcal: 230, prot: 23.0, carbs: 1.5, fat: 15.0, cat: 'Quesos' };
    }
    if (lower.includes('cremoso') || lower.includes('cuartirolo')) {
      return { kcal: 290, prot: 20.0, carbs: 1.0, fat: 23.0, cat: 'Quesos' };
    }
    if (lower.includes('sardo') || lower.includes('reggianito') || lower.includes('rallado') || lower.includes('provolone')) {
      return { kcal: 380, prot: 33.0, carbs: 1.5, fat: 27.0, cat: 'Quesos' };
    }
    return { kcal: 280, prot: 21.0, carbs: 2.0, fat: 21.0, cat: 'Quesos' };
  }
  if (lower.includes('manteca')) {
    return { kcal: 740, prot: 0.8, carbs: 0.7, fat: 82.0, cat: 'Lácteos' };
  }
  if (lower.includes('crema')) {
    return { kcal: 350, prot: 2.1, carbs: 3.2, fat: 37.0, cat: 'Lácteos' };
  }

  // 3. Azúcar, Dulces y Mermeladas
  if (lower.includes('azucar') || lower.includes('azúcar') || lower.includes('chango') || lower.includes('ledesma')) {
    if (lower.includes('edulcorante') || lower.includes('stevia')) {
      return { kcal: 0, prot: 0, carbs: 0, fat: 0, cat: 'Endulzantes' };
    }
    return { kcal: 400, prot: 0, carbs: 100.0, fat: 0, cat: 'Almacén' };
  }
  if (lower.includes('mermelada') || lower.includes('dulce de batata') || lower.includes('dulce de membrillo') || lower.includes('dulcor') || lower.includes('emeth')) {
    if (lower.includes('diet') || lower.includes('light') || lower.includes('sin azucar') || lower.includes('sin azúcar')) {
      return { kcal: 90, prot: 0.5, carbs: 21.0, fat: 0, cat: 'Dulces & Mermeladas' };
    }
    return { kcal: 250, prot: 0.4, carbs: 62.0, fat: 0, cat: 'Dulces & Mermeladas' };
  }

  // 4. Galletitas, Snacks y Golosinas (Tía Maruca, Nevares, Oblita, Don Satur)
  if (lower.includes('budin') || lower.includes('budín') || lower.includes('pan dulce')) {
    return { kcal: 370, prot: 5.5, carbs: 58.0, fat: 13.0, cat: 'Panificados' };
  }
  if (lower.includes('galletita') || lower.includes('galletitas') || lower.includes('tia maruca') || lower.includes('nevares') || lower.includes('oblita') || lower.includes('pepas') || lower.includes('anillitos')) {
    return { kcal: 430, prot: 6.5, carbs: 68.0, fat: 15.0, cat: 'Galletitas' };
  }
  if (lower.includes('alfajor')) {
    return { kcal: 410, prot: 5.8, carbs: 62.0, fat: 15.0, cat: 'Golosinas' };
  }

  // 5. Harinas, Pastas y Rebozadores (Morixe, Cañuelas, Pureza, Mendía)
  if (lower.includes('fideos') || lower.includes('pasta') || lower.includes('tallarines') || lower.includes('guiseros')) {
    return { kcal: 355, prot: 12.0, carbs: 72.0, fat: 1.5, cat: 'Pastas' };
  }
  if (lower.includes('harina') || lower.includes('almidon') || lower.includes('almidón') || lower.includes('pureza') || lower.includes('morixe') || lower.includes('cañuelas')) {
    return { kcal: 350, prot: 10.0, carbs: 74.0, fat: 1.2, cat: 'Almacén' };
  }
  if (lower.includes('rebozador') || lower.includes('pan rallado')) {
    return { kcal: 360, prot: 11.0, carbs: 72.0, fat: 2.0, cat: 'Almacén' };
  }

  // 6. Tapas de Empanadas y Tartas (La Salteña, Mendía, Doña Noly)
  if (lower.includes('tapa') || lower.includes('empanada') || lower.includes('pascualina') || lower.includes('tarta')) {
    return { kcal: 290, prot: 7.5, carbs: 48.0, fat: 7.5, cat: 'Pastas & Masas' };
  }

  // Genérico
  return { kcal: 220, prot: 6.0, carbs: 30.0, fat: 8.0, cat: category || 'Alimento' };
}

function calculatePortion(name, brand, category, pkg) {
  const lower = `${brand} ${name}`.toLowerCase();
  let unitGrams = pkg.grams;
  let unitName = pkg.label;
  let defaultPortionType = 'unit';

  if (lower.includes('secco') || lower.includes('gaseosa') || lower.includes('cerveza') || lower.includes('vino')) {
    if (pkg.grams > 500) {
      unitGrams = 200;
      unitName = '1 vaso (200ml)';
    } else {
      unitGrams = pkg.grams;
      unitName = `1 envase (${pkg.grams}ml)`;
    }
    defaultPortionType = 'unit';
  } else if (lower.includes('alfajor')) {
    unitGrams = pkg.grams > 0 && pkg.grams < 150 ? pkg.grams : 55;
    unitName = `1 alfajor (${unitGrams}g)`;
    defaultPortionType = 'unit';
  } else if (lower.includes('budin') || lower.includes('budín')) {
    unitGrams = 60;
    unitName = '2 rodajas (60g)';
    defaultPortionType = 'unit';
  } else if (lower.includes('queso') && (lower.includes('sardo') || lower.includes('rallado'))) {
    unitGrams = 30;
    unitName = '1 porción (30g)';
    defaultPortionType = 'grams';
  } else if (lower.includes('fideos') || lower.includes('harina') || lower.includes('arroz')) {
    unitGrams = 100;
    unitName = '1 porción en seco (100g)';
    defaultPortionType = 'grams';
  } else if (lower.includes('tapa')) {
    unitGrams = 35;
    unitName = '1 tapa (35g)';
    defaultPortionType = 'unit';
  } else if (lower.includes('mermelada') || lower.includes('dulce de leche')) {
    unitGrams = 20;
    unitName = '1 cucharada (20g)';
    defaultPortionType = 'unit';
  } else if (!pkg.isLiquid && pkg.grams > 250) {
    unitGrams = 50;
    unitName = '1 porción (50g)';
    defaultPortionType = 'grams';
  }

  return { unitGrams, unitName, defaultPortionType };
}

async function run() {
  console.log('🌵 INICIANDO COSECHA REGIONAL: NORTE ARGENTINO & TUCUMÁN...');
  const seenBarcodes = new Set();
  const seenNames = new Set();

  // 1. Cargar barcodes existentes de zenit_master_foods_seed.sql
  try {
    const masterSql = fs.readFileSync(path.resolve(__dirname, 'zenit_master_foods_seed.sql'), 'utf8');
    const regex = /\('(\d+)'/g;
    let match;
    while ((match = regex.exec(masterSql)) !== null) {
      seenBarcodes.add(match[1]);
    }
    console.log(`📌 Cargados ${seenBarcodes.size} códigos de barras maestros para evitar duplicados.`);
  } catch (e) {}

  // 2. Fuentes y Consultas Regionales Clave
  const SOURCES = [
    {
      name: 'Vea Supermercados',
      baseUrl: 'https://www.vea.com.ar',
      queries: [
        'secco', 'gaseosa secco', 'soda secco', 'cerveza norte', 'cerveza salta',
        'vino cafayate', 'etchart', 'torrontes', 'manfrey', 'leche manfrey',
        'tregar', 'queso tregar', 'arroz con leche tregar', 'ledesma', 'azucar ledesma',
        'chango', 'azucar chango', 'tia maruca', 'galletitas tia maruca', 'nevares',
        'budin nevares', 'oblita', 'morixe', 'harina morixe', 'pureza', 'harina pureza',
        'mendia', 'fideos mendia', 'la salteña', 'empanadas la salteña', 'dulcor',
        'mermelada dulcor', 'emeth', 'palmitos emeth', 'signo de oro'
      ],
    },
    {
      name: 'ChangoMás (MasOnline)',
      baseUrl: 'https://www.masonline.com.ar',
      queries: [
        'secco', 'cerveza norte', 'cerveza salta', 'manaos', 'cunnington',
        'manfrey', 'tregar', 'ilolay', 'sancor', 'chango', 'ledesma',
        'dulcor', 'tia maruca', 'nevares', 'morixe', 'cañuelas', 'blancaflor',
        'la salteña', 'doña noly', 'paladini', 'granja tres arroyos'
      ],
    },
  ];

  const harvested = [];

  for (const source of SOURCES) {
    console.log(`\n🛒 Explorando ${source.name}...`);

    for (const query of source.queries) {
      process.stdout.write(`  Buscando "${query}" en ${source.name}... `);
      const items = await fetchVtexSearch(source.baseUrl, query, 0, 25);
      let addedFromQuery = 0;

      for (const item of items) {
        const ean = item.items?.[0]?.ean;
        const images = item.items?.[0]?.images || [];
        const rawName = (item.productName || '').trim();
        const brand = (item.brand || '').trim() || 'Regional';

        const img = images[0]?.imageUrl?.split('?')[0];

        // Rechazar imágenes de cámara "no disponible" y URLs vacías
        if (!img || placeholders.has(img) || img.includes('unsplash.com')) {
          continue;
        }

        if (!ean || ean.length < 8 || seenBarcodes.has(ean) || !rawName || !isFood(rawName, brand)) {
          continue;
        }

        const nameKey = `${brand} ${rawName}`.toLowerCase().trim();
        if (seenNames.has(nameKey)) continue;

        seenBarcodes.add(ean);
        seenNames.add(nameKey);
        const pkg = parsePackageSize(rawName);
        const macro = resolveBromatologicalMacros(rawName, brand, item.categories?.[0]);
        const portion = calculatePortion(rawName, brand, macro.cat, pkg);

        const ratio = portion.unitGrams / 100;
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
          defaultPortionType: portion.defaultPortionType,
          servingSize: `${portion.unitGrams}${pkg.isLiquid ? 'ml' : 'g'}`,
          unitName: portion.unitName,
          unitGrams: portion.unitGrams,
          unitCalories: unitKcal,
          unitProtein: unitProt,
          unitCarbs,
          unitFats,
          image: img,
          source: source.name,
        });

        addedFromQuery++;
      }

      console.log(`+${addedFromQuery} nuevos`);
      await sleep(250);
    }
  }

  console.log(`\n🎉 Cosecha finalizada: ${harvested.length} productos regionales únicos nuevos (cero duplicados).`);

  if (harvested.length === 0) return;

  // Ordenar por marca y gramaje
  harvested.sort((a, b) => {
    if (a.brand !== b.brand) return (a.brand || '').localeCompare(b.brand || '');
    return (a.unitGrams || 0) - (b.unitGrams || 0);
  });

  const values = harvested.map((p) => {
    return `(${esc(p.barcode)}, ${esc(p.name)}, ${esc(p.brand)}, ${esc(p.category)}, ${p.calories}, ${p.protein}, ${p.carbs}, ${p.fats}, ${esc(p.defaultPortionType)}, ${esc(p.servingSize)}, ${esc(p.unitName)}, ${p.unitGrams}, ${p.unitCalories}, ${p.unitProtein}, ${p.unitCarbs}, ${p.unitFats}, ${esc(p.image)}, 'approved')`;
  }).join(',\n');

  const sql = `-- =================================================================
-- ZENIT - CATÁLOGO REGIONAL NORTE & TUCUMÁN (VEA & CHANGOMÁS)
-- Total productos nuevos únicos: ${harvested.length}
-- Cero duplicados contra el catálogo maestro de Zenit.
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

  const outPath = path.resolve(__dirname, 'regional_norte_seed.sql');
  fs.writeFileSync(outPath, sql, 'utf8');
  console.log(`💾 Catálogo regional guardado en: ${outPath} (${(fs.statSync(outPath).size / 1024).toFixed(1)} KB)`);
}

run().catch(console.error);
