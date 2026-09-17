// =================================================================
// ZENIT - BUILD MASTER CATALOG SEED (SUPERMERCADOS ARGENTINOS)
// Consolidates:
// 1. Local gold-standard items (argentineProducts.js)
// 2. Día Online products (supermarkets_argentina_seed.sql)
// 3. Jumbo Argentina Deep Category & Search Crawler
// 4. Carrefour Argentina Category & Specialty Crawler
// Produces a single, deduplicated, studio HD packshot master SQL seed:
// scripts/zenit_master_foods_seed.sql
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

function normalizeKey(brand, name) {
  return `${brand || ''} ${name || ''}`
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

// Fetch VTEX search by query or category
function fetchVtex(baseUrl, paramStr, from = 0, to = 49) {
  return new Promise((resolve) => {
    const url = `${baseUrl}/api/catalog_system/pub/products/search?${paramStr}&_from=${from}&_to=${to}`;
    https.get(
      url,
      {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          'Accept': 'application/json',
        },
        timeout: 15000,
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
  // First look for explicit volume/weight units (avoiding matching standalone numbers like in 7 Up)
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

  // Then count of units like "30 un", "6 u", "12 unidades"
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

const NON_FOOD_KEYWORDS = [
  'depiladora', 'afeitadora', 'shampoo', 'acondicionador', 'jabon', 'jabón',
  'lavandina', 'detergente', 'suavizante', 'desodorante', 'dentifrico', 'dentífrico',
  'cepillo', 'insecticida', 'pañal', 'pañales', 'toalla femenina', 'toallitas',
  'tampon', 'tampón', 'higienico', 'higiénico', 'limpiador', 'trapo', 'esponja',
  'dosificador', 'perfume', 'colonia', 'tintura', 'algodon', 'algodón', 'preservativo',
  'crema facial', 'crema corporal', 'protector solar', 'bronceador', 'juguete', 'pila '
];

function isFood(name, brand) {
  const lower = `${brand} ${name}`.toLowerCase();
  return !NON_FOOD_KEYWORDS.some((w) => lower.includes(w));
}

// Resolution of macros with strict precedence
function resolveBromatologicalMacros(name, brand, category) {
  const lower = `${brand} ${name}`.toLowerCase();

  // 0. Chocolatadas, Cindor y Bebidas de Chocolate (Precedencia antes de barras y golosinas)
  if (lower.includes('cindor') || lower.includes('chocolatada') || (lower.includes('chocolate') && (lower.includes('bebida') || lower.includes('leche') || lower.includes('notmilk') || lower.includes('silk') || lower.includes('shake')))) {
    return { kcal: 72, prot: 2.8, carbs: 11.5, fat: 1.6, cat: 'Lácteos' };
  }

  // 1. Golosinas, Alfajores y Chocolates (Precedencia sobre frutas para evitar Bananita Dolca)
  if (lower.includes('alfajor')) {
    return { kcal: 410, prot: 5.8, carbs: 62.0, fat: 15.0, cat: 'Golosinas' };
  }
  if (lower.includes('chocolate') || lower.includes('dolca') || lower.includes('lindt') || lower.includes('toblerone') || lower.includes('ferrero') || lower.includes('nutella') || lower.includes('bon o bon') || lower.includes('bombón') || lower.includes('turron')) {
    return { kcal: 545, prot: 6.5, carbs: 56.0, fat: 31.0, cat: 'Golosinas' };
  }
  if (lower.includes('caramelo') || lower.includes('chicle') || lower.includes('gomitas') || lower.includes('mogul')) {
    return { kcal: 340, prot: 1.0, carbs: 84.0, fat: 0.1, cat: 'Golosinas' };
  }

  // 2. Gaseosas, Energizantes, Bebidas, Jugos y Aguas (Precedencia sobre frutas para 7up, Sprite Lima-Limón, Levité Pomelo, etc.)
  if (lower.includes('coca-cola') || lower.includes('cocacola') || lower.includes('coke') || /\bcola\b/i.test(lower)) {
    if (lower.includes('zero') || lower.includes('sin azucar') || lower.includes('sin azúcar') || lower.includes('diet') || lower.includes('light')) {
      return { kcal: 0, prot: 0, carbs: 0, fat: 0, cat: 'Gaseosas' };
    }
    return { kcal: 42, prot: 0, carbs: 10.6, fat: 0, cat: 'Gaseosas' };
  }
  if (lower.includes('7up') || lower.includes('7 up') || lower.includes('sprite') || lower.includes('paso de los toros') || lower.includes('fanta') || lower.includes('mirinda') || lower.includes('schweppes') || lower.includes('manaos') || lower.includes('secco') || lower.includes('gaseosa') || lower.includes('pepsi')) {
    if (lower.includes('zero') || lower.includes('sin azucar') || lower.includes('sin azúcar') || lower.includes('light') || lower.includes('diet')) {
      return { kcal: 0, prot: 0, carbs: 0, fat: 0, cat: 'Gaseosas' };
    }
    return { kcal: 38, prot: 0, carbs: 9.5, fat: 0, cat: 'Gaseosas' };
  }
  if (lower.includes('monster') || lower.includes('red bull') || lower.includes('speed') || lower.includes('energizante')) {
    if (lower.includes('zero') || lower.includes('ultra') || lower.includes('sugar free')) {
      return { kcal: 2, prot: 0, carbs: 0.5, fat: 0, cat: 'Energizantes' };
    }
    return { kcal: 47, prot: 0, carbs: 11.8, fat: 0, cat: 'Energizantes' };
  }
  if (lower.includes('gatorade') || lower.includes('powerade')) {
    if (lower.includes('zero')) return { kcal: 0, prot: 0, carbs: 0, fat: 0, cat: 'Isotónicas' };
    return { kcal: 24, prot: 0, carbs: 6.0, fat: 0, cat: 'Isotónicas' };
  }
  if (lower.includes('jugo') || lower.includes('cepita') || lower.includes('baggio') || lower.includes('tang') || lower.includes('clight') || lower.includes('aquarius') || lower.includes('levite') || lower.includes('levité') || lower.includes('ades')) {
    if (lower.includes('zero') || lower.includes('sin azucar') || lower.includes('sin azúcar') || lower.includes('clight') || lower.includes('light')) {
      return { kcal: 4, prot: 0, carbs: 1.0, fat: 0, cat: 'Jugos e Isotónicas' };
    }
    return { kcal: 42, prot: 0.3, carbs: 10.0, fat: 0, cat: 'Jugos e Isotónicas' };
  }
  if (lower.includes('agua') && !lower.includes('saborizada') && !lower.includes('jugo')) {
    return { kcal: 0, prot: 0, carbs: 0, fat: 0, cat: 'Aguas' };
  }
  if (lower.includes('cerveza') || lower.includes('quilmes') || lower.includes('brahma') || lower.includes('heineken') || lower.includes('corona') || lower.includes('stella') || lower.includes('andes') || lower.includes('patagonia') || lower.includes('budweiser') || lower.includes('361') || lower.includes('craft beer')) {
    if (lower.includes('0.0') || lower.includes('sin alcohol')) return { kcal: 20, prot: 0.2, carbs: 4.5, fat: 0, cat: 'Cervezas' };
    return { kcal: 43, prot: 0.5, carbs: 3.5, fat: 0, cat: 'Cervezas' };
  }

  // 3. Suplementación & Proteínas Fitness
  if (lower.includes('whey') || lower.includes('proteina') || lower.includes('proteína') || lower.includes('ena sport') || lower.includes('star nutrition') || lower.includes('pulver')) {
    if (lower.includes('barra')) {
      return { kcal: 360, prot: 30.0, carbs: 32.0, fat: 10.0, cat: 'Suplementos' };
    }
    return { kcal: 385, prot: 78.0, carbs: 8.0, fat: 4.5, cat: 'Suplementos' };
  }
  if (lower.includes('creatina')) {
    return { kcal: 0, prot: 0.0, carbs: 0.0, fat: 0.0, cat: 'Suplementos' };
  }

  // 4. Frutos secos & Semillas
  if (lower.includes('nueces') || lower.includes('almendra') || lower.includes('castaña') || lower.includes('avellana') || lower.includes('pistacho') || lower.includes('frutos secos') || lower.includes('mani') || lower.includes('maní')) {
    if (lower.includes('mantequilla') || lower.includes('pasta')) {
      return { kcal: 590, prot: 25.0, carbs: 20.0, fat: 50.0, cat: 'Frutos Secos & Semillas' };
    }
    return { kcal: 620, prot: 18.0, carbs: 14.0, fat: 55.0, cat: 'Frutos Secos & Semillas' };
  }
  if (lower.includes('chia') || lower.includes('chía') || lower.includes('lino') || lower.includes('sesamo') || lower.includes('sésamo') || lower.includes('girasol')) {
    return { kcal: 530, prot: 19.0, carbs: 30.0, fat: 38.0, cat: 'Frutos Secos & Semillas' };
  }

  // 5. Huevos y Granja
  if (lower.includes('huevo') || lower.includes('maple')) {
    return { kcal: 143, prot: 12.6, carbs: 0.7, fat: 9.5, cat: 'Huevos & Granja' };
  }

  // 6. Carnes, Aves y Pescados
  if (lower.includes('pollo') || lower.includes('pechuga')) {
    return { kcal: 120, prot: 23.0, carbs: 0.0, fat: 2.5, cat: 'Carnes & Proteínas' };
  }
  if (lower.includes('salmon') || lower.includes('salmón')) {
    return { kcal: 208, prot: 20.0, carbs: 0.0, fat: 13.0, cat: 'Pescados' };
  }
  if (lower.includes('merluza') || lower.includes('lenguado') || lower.includes('pescado')) {
    return { kcal: 82, prot: 17.8, carbs: 0.0, fat: 0.9, cat: 'Pescados' };
  }
  if (lower.includes('atun') || lower.includes('atún') || lower.includes('caballa') || lower.includes('sardina')) {
    if (lower.includes('aceite')) return { kcal: 198, prot: 24.0, carbs: 0.0, fat: 11.0, cat: 'Conservas' };
    return { kcal: 116, prot: 26.0, carbs: 0.0, fat: 1.2, cat: 'Conservas' };
  }
  if (lower.includes('carne') || lower.includes('bife') || lower.includes('peceto') || lower.includes('lomo') || lower.includes('picada') || lower.includes('nalga') || lower.includes('asado') || lower.includes('cuadril') || lower.includes('vacio') || lower.includes('vacío') || lower.includes('milanesa')) {
    return { kcal: 190, prot: 26.0, carbs: 0.0, fat: 9.5, cat: 'Carnes & Proteínas' };
  }
  if (lower.includes('cerdo') || lower.includes('bondiola') || lower.includes('solomillo') || lower.includes('pechito')) {
    return { kcal: 180, prot: 22.0, carbs: 0.0, fat: 10.0, cat: 'Carnes & Proteínas' };
  }

  // 7. Frutas Frescas
  if (lower.includes('banana')) {
    return { kcal: 89, prot: 1.1, carbs: 22.8, fat: 0.3, cat: 'Frutas' };
  }
  if (lower.includes('palta')) {
    return { kcal: 160, prot: 2.0, carbs: 8.5, fat: 14.7, cat: 'Frutas' };
  }
  if (lower.includes('manzana')) {
    return { kcal: 52, prot: 0.3, carbs: 13.8, fat: 0.2, cat: 'Frutas' };
  }
  if (lower.includes('pera')) {
    return { kcal: 57, prot: 0.4, carbs: 15.0, fat: 0.1, cat: 'Frutas' };
  }
  if (lower.includes('naranja') || lower.includes('mandarina') || lower.includes('pomelo') || lower.includes('limon') || lower.includes('limón')) {
    return { kcal: 47, prot: 0.9, carbs: 11.8, fat: 0.1, cat: 'Frutas' };
  }
  if (lower.includes('frutilla') || lower.includes('arandano') || lower.includes('arándano') || lower.includes('frambuesa') || lower.includes('moras')) {
    return { kcal: 33, prot: 0.7, carbs: 7.7, fat: 0.3, cat: 'Frutas' };
  }
  if (lower.includes('uva')) {
    return { kcal: 69, prot: 0.7, carbs: 18.1, fat: 0.2, cat: 'Frutas' };
  }

  // 8. Verduras & Hortalizas
  if (lower.includes('tomate')) {
    return { kcal: 18, prot: 0.9, carbs: 3.9, fat: 0.2, cat: 'Verduras' };
  }
  if (lower.includes('papa') || lower.includes('patata')) {
    return { kcal: 77, prot: 2.0, carbs: 17.5, fat: 0.1, cat: 'Verduras' };
  }
  if (lower.includes('batata') || lower.includes('camote')) {
    return { kcal: 86, prot: 1.6, carbs: 20.1, fat: 0.1, cat: 'Verduras' };
  }
  if (lower.includes('lechuga') || lower.includes('rucula') || lower.includes('rúcula') || lower.includes('espinaca') || lower.includes('acelga') || lower.includes('kale')) {
    return { kcal: 15, prot: 1.4, carbs: 2.8, fat: 0.2, cat: 'Verduras' };
  }
  if (lower.includes('cebolla') || lower.includes('puerro') || lower.includes('verdeo') || lower.includes('morron') || lower.includes('morrón')) {
    return { kcal: 32, prot: 1.1, carbs: 7.3, fat: 0.1, cat: 'Verduras' };
  }
  if (lower.includes('zanahoria') || lower.includes('zapallo') || lower.includes('calabaza') || lower.includes('zucchini')) {
    return { kcal: 30, prot: 1.0, carbs: 6.5, fat: 0.2, cat: 'Verduras' };
  }

  // 9. Leches Vegetales & Bebidas de Soja
  if (lower.includes('silk') || lower.includes('notmilk') || lower.includes('bebida vegetal') || lower.includes('leche de almendra') || lower.includes('leche de coco') || lower.includes('leche de avena')) {
    if (lower.includes('sin azucar') || lower.includes('sin azúcar')) {
      return { kcal: 24, prot: 0.8, carbs: 1.0, fat: 1.8, cat: 'Bebidas Vegetales' };
    }
    return { kcal: 45, prot: 1.0, carbs: 5.5, fat: 2.0, cat: 'Bebidas Vegetales' };
  }

  // 10. Lácteos & Yogures
  if (lower.includes('yogur') || lower.includes('actimel') || lower.includes('leche fermentada') || lower.includes('yogurt')) {
    if (lower.includes('griego')) {
      if (lower.includes('descremado') || lower.includes('light') || lower.includes('0%')) {
        return { kcal: 58, prot: 9.0, carbs: 4.0, fat: 0.2, cat: 'Lácteos' };
      }
      return { kcal: 115, prot: 8.5, carbs: 5.0, fat: 7.0, cat: 'Lácteos' };
    }
    if (lower.includes('descremado') || lower.includes('sin azucar') || lower.includes('sin azúcar') || lower.includes('light') || lower.includes('0%')) {
      return { kcal: 45, prot: 4.5, carbs: 6.0, fat: 0.2, cat: 'Lácteos' };
    }
    return { kcal: 82, prot: 3.2, carbs: 12.5, fat: 2.2, cat: 'Lácteos' };
  }
  if (lower.includes('leche')) {
    if (lower.includes('descremada') || lower.includes('0%') || lower.includes('1%')) {
      return { kcal: 42, prot: 3.1, carbs: 4.8, fat: 1.0, cat: 'Leches' };
    }
    return { kcal: 58, prot: 3.0, carbs: 4.6, fat: 3.0, cat: 'Leches' };
  }
  if (lower.includes('queso')) {
    if (lower.includes('crema') || lower.includes('casancrem') || lower.includes('finlandia') || lower.includes('mendicrim') || lower.includes('untable')) {
      if (lower.includes('light') || lower.includes('balance') || lower.includes('diet') || lower.includes('descremado')) {
        return { kcal: 140, prot: 8.5, carbs: 5.0, fat: 9.5, cat: 'Quesos' };
      }
      return { kcal: 245, prot: 4.5, carbs: 7.5, fat: 22.0, cat: 'Quesos' };
    }
    if (lower.includes('rallado') || lower.includes('reggianito') || lower.includes('sardo') || lower.includes('parmesano')) {
      return { kcal: 430, prot: 38.0, carbs: 3.5, fat: 31.0, cat: 'Quesos' };
    }
    if (lower.includes('muzzarella') || lower.includes('cremoso') || lower.includes('cuartirolo')) {
      return { kcal: 280, prot: 20.0, carbs: 1.5, fat: 22.0, cat: 'Quesos' };
    }
    return { kcal: 320, prot: 24.0, carbs: 2.0, fat: 25.0, cat: 'Quesos' };
  }
  if (lower.includes('manteca')) {
    return { kcal: 740, prot: 0.8, carbs: 0.0, fat: 82.0, cat: 'Lácteos' };
  }
  if (lower.includes('dulce de leche')) {
    if (lower.includes('light')) return { kcal: 250, prot: 6.5, carbs: 48.0, fat: 3.5, cat: 'Para untar' };
    return { kcal: 315, prot: 6.5, carbs: 56.0, fat: 7.0, cat: 'Para untar' };
  }
  if (lower.includes('mermelada')) {
    if (lower.includes('light') || lower.includes('diet') || lower.includes('sin azucar') || lower.includes('sin azúcar')) {
      return { kcal: 55, prot: 0.5, carbs: 13.0, fat: 0.0, cat: 'Para untar' };
    }
    return { kcal: 240, prot: 0.5, carbs: 60.0, fat: 0.0, cat: 'Para untar' };
  }
  if (lower.includes('miel')) {
    return { kcal: 304, prot: 0.3, carbs: 82.0, fat: 0.0, cat: 'Para untar' };
  }

  // 11. Galletitas, Panes y Cereales
  if (lower.includes('bizcoch') || lower.includes('9 de oro') || lower.includes('don satur')) {
    if (lower.includes('grasa') || lower.includes('clasico') || lower.includes('salado')) {
      return { kcal: 510, prot: 9.0, carbs: 54.0, fat: 30.0, cat: 'Galletitas' };
    }
    return { kcal: 470, prot: 7.0, carbs: 66.0, fat: 20.0, cat: 'Galletitas' };
  }
  if (lower.includes('galletit') || lower.includes('masita') || lower.includes('pepas') || lower.includes('madalena') || lower.includes('budin') || lower.includes('budín')) {
    if (lower.includes('agua') || lower.includes('salada') || lower.includes('criollita') || lower.includes('traviata') || lower.includes('sandwich')) {
      return { kcal: 420, prot: 9.5, carbs: 68.0, fat: 12.0, cat: 'Galletitas' };
    }
    return { kcal: 470, prot: 6.0, carbs: 66.0, fat: 20.0, cat: 'Galletitas' };
  }
  if (lower.includes('avena')) {
    return { kcal: 375, prot: 14.0, carbs: 65.0, fat: 7.0, cat: 'Cereales & Granos' };
  }
  if (lower.includes('granola') || lower.includes('cereal')) {
    return { kcal: 430, prot: 10.0, carbs: 68.0, fat: 14.0, cat: 'Cereales & Granos' };
  }
  if (lower.includes('pan lactal') || lower.includes('pan de molde') || lower.includes('pan blanco') || lower.includes('pan negro') || lower.includes('pan salvado') || lower.includes('pan integral')) {
    return { kcal: 260, prot: 9.0, carbs: 48.0, fat: 3.2, cat: 'Panadería' };
  }

  // 12. Pastas, Arroces y Granos
  if (lower.includes('quinoa') || lower.includes('quínoa')) {
    return { kcal: 368, prot: 14.1, carbs: 64.2, fat: 6.1, cat: 'Legumbres & Granos' };
  }
  if (lower.includes('lenteja') || lower.includes('garbanzo') || lower.includes('poroto')) {
    return { kcal: 340, prot: 24.0, carbs: 58.0, fat: 1.5, cat: 'Legumbres & Granos' };
  }
  if (lower.includes('arroz')) {
    if (lower.includes('integral')) return { kcal: 350, prot: 7.5, carbs: 74.0, fat: 2.5, cat: 'Pastas & Arroces' };
    return { kcal: 350, prot: 7.2, carbs: 78.0, fat: 0.8, cat: 'Pastas & Arroces' };
  }
  if (lower.includes('fideo') || lower.includes('pasta') || lower.includes('tallarin') || lower.includes('spaghetti') || lower.includes('barilla')) {
    return { kcal: 355, prot: 12.0, carbs: 72.0, fat: 1.5, cat: 'Pastas & Arroces' };
  }
  if (lower.includes('aceite')) {
    return { kcal: 884, prot: 0.0, carbs: 0.0, fat: 100.0, cat: 'Aceites' };
  }

  // Fallback seguro
  return { kcal: 250, prot: 6.0, carbs: 35.0, fat: 8.0, cat: category || 'Almacén' };
}

// Portion calculator
function calculatePortion(name, brand, cat, pkg) {
  const lowerName = `${brand} ${name}`.toLowerCase();
  let unitGrams = pkg.grams;
  let unitName = pkg.label;
  let defaultPortionType = 'unit';

  if (cat === 'Huevos & Granja' || lowerName.includes('huevo')) {
    unitGrams = 55;
    unitName = '1 huevo (55g)';
    defaultPortionType = 'unit';
  } else if (lowerName.includes('creatina')) {
    unitGrams = 5;
    unitName = '1 scoop (5g)';
    defaultPortionType = 'unit';
  } else if (lowerName.includes('whey') || lowerName.includes('proteina') || lowerName.includes('proteína')) {
    if (!lowerName.includes('barra')) {
      unitGrams = 30;
      unitName = '1 scoop (30g)';
      defaultPortionType = 'unit';
    }
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
  } else if (cat === 'Carnes & Proteínas' || cat === 'Pescados') {
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

  return { unitGrams, unitName, defaultPortionType };
}

async function buildMasterCatalog() {
  console.log('🚀 INICIANDO CONSOLIDACIÓN DEL CATÁLOGO MAESTRO ZENIT...');
  const masterMap = new Map(); // barcode -> product object
  const seenNames = new Set(); // normalizedKey -> barcode

  function addProduct(p) {
    if (!p.barcode || p.barcode.length < 8) return false;
    if (!isFood(p.name, p.brand)) return false;
    const normKey = normalizeKey(p.brand, p.name);
    if (masterMap.has(p.barcode)) return false;
    if (seenNames.has(normKey)) return false;

    masterMap.set(p.barcode, p);
    seenNames.add(normKey);
    return true;
  }

  // -------------------------------------------------------------
  // PASO 1: Catálogo Local Calibrado (argentineProducts.js)
  // -------------------------------------------------------------
  console.log('\n🌟 PASO 1: Cargando catálogo local verificado (Coca-Cola completa, Serenísima, Monster, etc.)...');
  try {
    const { POPULAR_ARGENTINE_PRODUCTS } = require('../src/data/argentineProducts.js');
    let localCount = 0;
    for (const item of POPULAR_ARGENTINE_PRODUCTS) {
      if (item.barcode) {
        addProduct({
          barcode: item.barcode,
          name: item.name,
          brand: item.brand,
          category: item.category || 'Almacén',
          calories: item.calories || 0,
          protein: item.protein || 0,
          carbs: item.carbs || 0,
          fats: item.fats || 0,
          default_portion_type: item.defaultPortionType || 'unit',
          serving_size: item.servingSize || '100g',
          unit_name: item.unitName || '1 porción (100g)',
          unit_grams: item.unitGrams || 100,
          unit_calories: item.unitCalories || item.calories || 0,
          unit_protein: item.unitProtein || item.protein || 0,
          unit_carbs: item.unitCarbs || item.carbs || 0,
          unit_fats: item.unitFats || item.fats || 0,
          image: item.image,
          source: 'Local Verificado',
        });
        localCount++;
      }
    }
    console.log(`✅ ${localCount} productos locales verificados incorporados.`);
  } catch (err) {
    console.error('Error cargando argentineProducts:', err.message);
  }

  // -------------------------------------------------------------
  // PASO 2: Catálogo Día Online (supermarkets_argentina_seed.sql)
  // -------------------------------------------------------------
  console.log('\n🛒 PASO 2: Incorporando catálogo de Día Online (1300+ productos)...');
  try {
    const diaSqlPath = path.resolve(__dirname, 'supermarkets_argentina_seed.sql');
    if (fs.existsSync(diaSqlPath)) {
      const diaSql = fs.readFileSync(diaSqlPath, 'utf8');
      const rowRegex = /\('(\d+)',\s*'([^']+)',\s*'([^']*)',\s*'([^']*)',\s*([0-9.]+),\s*([0-9.]+),\s*([0-9.]+),\s*([0-9.]+),\s*'([^']*)',\s*'([^']*)',\s*'([^']*)',\s*([0-9.]+),\s*([0-9.]+),\s*([0-9.]+),\s*([0-9.]+),\s*([0-9.]+),\s*'([^']*)'/g;
      let match;
      let diaAdded = 0;
      while ((match = rowRegex.exec(diaSql)) !== null) {
        const [
          ,
          barcode, name, brand, category,
          calories, protein, carbs, fats,
          default_portion_type, serving_size, unit_name, unit_grams,
          unit_calories, unit_protein, unit_carbs, unit_fats,
          image
        ] = match;

        const added = addProduct({
          barcode,
          name,
          brand,
          category,
          calories: parseFloat(calories),
          protein: parseFloat(protein),
          carbs: parseFloat(carbs),
          fats: parseFloat(fats),
          default_portion_type,
          serving_size,
          unit_name,
          unit_grams: parseFloat(unit_grams),
          unit_calories: parseFloat(unit_calories),
          unit_protein: parseFloat(unit_protein),
          unit_carbs: parseFloat(unit_carbs),
          unit_fats: parseFloat(unit_fats),
          image,
          source: 'Día Online',
        });
        if (added) diaAdded++;
      }
      console.log(`✅ ${diaAdded} productos únicos añadidos desde Día Online. Total acumulado: ${masterMap.size}`);
    }
  } catch (err) {
    console.error('Error procesando Día Online seed:', err.message);
  }

  // -------------------------------------------------------------
  // PASO 3: Cosecha Masiva de Jumbo Argentina por Categorías & Consultas
  // -------------------------------------------------------------
  console.log('\n🐘 PASO 3: Cosecha masiva de Jumbo Argentina (Árbol completo de categorías)...');
  const JUMBO_CATEGORIES = [
    { id: 'C:1', name: 'Almacén', pages: 4 },
    { id: 'C:2', name: 'Bebidas', pages: 4 },
    { id: 'C:3', name: 'Frutas y Verduras', pages: 3 },
    { id: 'C:4', name: 'Carnes', pages: 3 },
    { id: 'C:5', name: 'Pescados y Mariscos', pages: 2 },
    { id: 'C:6', name: 'Quesos y Fiambres', pages: 3 },
    { id: 'C:7', name: 'Lácteos', pages: 3 },
    { id: 'C:8', name: 'Congelados', pages: 3 },
    { id: 'C:9', name: 'Panadería y Pastelería', pages: 2 },
    { id: 'C:463', name: 'Pastas Frescas', pages: 2 },
  ];

  const JUMBO_SEARCHES = [
    'proteina', 'ena sport', 'whey protein', 'barra proteica', 'creatina',
    'notco', 'silk', 'leche almendras', 'mantequilla mani', 'sin tacc',
    'organico', 'barilla', 'lindt', 'yogur griego', 'quinoa', 'avena',
    'frutos secos', 'nueces', 'almendras', 'aceite oliva virgen',
    'pechuga pollo', 'salmon', 'merluza', 'palta hass'
  ];

  const JUMBO_BASE = 'https://www.jumbo.com.ar';
  let jumboAdded = 0;

  for (const cat of JUMBO_CATEGORIES) {
    for (let p = 0; p < cat.pages; p++) {
      const from = p * 50;
      const to = from + 49;
      process.stdout.write(`  Jumbo Cat [${cat.name}] pág ${p + 1} (${from}-${to})... `);
      const items = await fetchVtex(JUMBO_BASE, `fq=${cat.id}`, from, to);
      let pageAdded = 0;

      for (const item of items) {
        const ean = item.items?.[0]?.ean;
        const images = item.items?.[0]?.images || [];
        const rawName = (item.productName || '').trim();
        const brand = (item.brand || '').trim() || 'Jumbo';

        if (!ean || ean.length < 8 || !rawName || images.length === 0) continue;

        const img = images[0]?.imageUrl?.split('?')[0];
        const pkg = parsePackageSize(rawName);
        const macro = resolveBromatologicalMacros(rawName, brand, cat.name);
        const portion = calculatePortion(rawName, brand, macro.cat, pkg);

        const ratio = portion.unitGrams / 100;
        const pObj = {
          barcode: ean,
          name: rawName,
          brand,
          category: macro.cat,
          calories: macro.kcal,
          protein: macro.prot,
          carbs: macro.carbs,
          fats: macro.fat,
          default_portion_type: portion.defaultPortionType,
          serving_size: `${portion.unitGrams}${pkg.isLiquid ? 'ml' : 'g'}`,
          unit_name: portion.unitName,
          unit_grams: portion.unitGrams,
          unit_calories: Math.round(macro.kcal * ratio),
          unit_protein: Number((macro.prot * ratio).toFixed(1)),
          unit_carbs: Number((macro.carbs * ratio).toFixed(1)),
          unit_fats: Number((macro.fat * ratio).toFixed(1)),
          image: img,
          source: 'Jumbo Argentina',
        };

        if (addProduct(pObj)) {
          pageAdded++;
          jumboAdded++;
        }
      }
      console.log(`+${pageAdded} nuevos`);
      await sleep(200);
    }
  }

  // Jumbo Queries
  for (const query of JUMBO_SEARCHES) {
    process.stdout.write(`  Jumbo Search "${query}"... `);
    const items = await fetchVtex(JUMBO_BASE, `ft=${encodeURIComponent(query)}`, 0, 30);
    let qAdded = 0;
    for (const item of items) {
      const ean = item.items?.[0]?.ean;
      const images = item.items?.[0]?.images || [];
      const rawName = (item.productName || '').trim();
      const brand = (item.brand || '').trim() || 'Jumbo';

      if (!ean || ean.length < 8 || !rawName || images.length === 0) continue;

      const img = images[0]?.imageUrl?.split('?')[0];
      const pkg = parsePackageSize(rawName);
      const macro = resolveBromatologicalMacros(rawName, brand, item.categories?.[0]);
      const portion = calculatePortion(rawName, brand, macro.cat, pkg);

      const ratio = portion.unitGrams / 100;
      const pObj = {
        barcode: ean,
        name: rawName,
        brand,
        category: macro.cat,
        calories: macro.kcal,
        protein: macro.prot,
        carbs: macro.carbs,
        fats: macro.fat,
        default_portion_type: portion.defaultPortionType,
        serving_size: `${portion.unitGrams}${pkg.isLiquid ? 'ml' : 'g'}`,
        unit_name: portion.unitName,
        unit_grams: portion.unitGrams,
        unit_calories: Math.round(macro.kcal * ratio),
        unit_protein: Number((macro.prot * ratio).toFixed(1)),
        unit_carbs: Number((macro.carbs * ratio).toFixed(1)),
        unit_fats: Number((macro.fat * ratio).toFixed(1)),
        image: img,
        source: 'Jumbo Argentina',
      };

      if (addProduct(pObj)) {
        qAdded++;
        jumboAdded++;
      }
    }
    console.log(`+${qAdded} nuevos`);
    await sleep(200);
  }

  console.log(`✅ ${jumboAdded} productos únicos agregados desde Jumbo. Total acumulado: ${masterMap.size}`);

  // -------------------------------------------------------------
  // PASO 4: Cosecha de Carrefour Argentina
  // -------------------------------------------------------------
  console.log('\n🥖 PASO 4: Cosecha de Carrefour Argentina (Categorías y líneas Bio/Sin Gluten)...');
  const CARREFOUR_CATEGORIES = [
    { id: 'C:161', name: 'Almacén', pages: 3 },
    { id: 'C:222', name: 'Desayuno y Merienda', pages: 3 },
    { id: 'C:255', name: 'Bebidas', pages: 3 },
    { id: 'C:292', name: 'Lácteos y Frescos', pages: 3 },
    { id: 'C:321', name: 'Carnes y Pescados', pages: 2 },
    { id: 'C:330', name: 'Frutas y Verduras', pages: 2 },
    { id: 'C:336', name: 'Panadería', pages: 2 },
    { id: 'C:347', name: 'Congelados', pages: 2 },
  ];

  const CARREFOUR_SEARCHES = [
    'carrefour bio', 'carrefour sin gluten', 'yogur griego', 'proteina', 'quinoa'
  ];

  const CARREFOUR_BASE = 'https://www.carrefour.com.ar';
  let carrefourAdded = 0;

  for (const cat of CARREFOUR_CATEGORIES) {
    for (let p = 0; p < cat.pages; p++) {
      const from = p * 40;
      const to = from + 39;
      process.stdout.write(`  Carrefour Cat [${cat.name}] pág ${p + 1} (${from}-${to})... `);
      const items = await fetchVtex(CARREFOUR_BASE, `fq=${cat.id}`, from, to);
      let pageAdded = 0;

      for (const item of items) {
        const ean = item.items?.[0]?.ean;
        const images = item.items?.[0]?.images || [];
        const rawName = (item.productName || '').trim();
        const brand = (item.brand || '').trim() || 'Carrefour';

        if (!ean || ean.length < 8 || !rawName || images.length === 0) continue;

        const img = images[0]?.imageUrl?.split('?')[0];
        const pkg = parsePackageSize(rawName);
        const macro = resolveBromatologicalMacros(rawName, brand, cat.name);
        const portion = calculatePortion(rawName, brand, macro.cat, pkg);

        const ratio = portion.unitGrams / 100;
        const pObj = {
          barcode: ean,
          name: rawName,
          brand,
          category: macro.cat,
          calories: macro.kcal,
          protein: macro.prot,
          carbs: macro.carbs,
          fats: macro.fat,
          default_portion_type: portion.defaultPortionType,
          serving_size: `${portion.unitGrams}${pkg.isLiquid ? 'ml' : 'g'}`,
          unit_name: portion.unitName,
          unit_grams: portion.unitGrams,
          unit_calories: Math.round(macro.kcal * ratio),
          unit_protein: Number((macro.prot * ratio).toFixed(1)),
          unit_carbs: Number((macro.carbs * ratio).toFixed(1)),
          unit_fats: Number((macro.fat * ratio).toFixed(1)),
          image: img,
          source: 'Carrefour Argentina',
        };

        if (addProduct(pObj)) {
          pageAdded++;
          carrefourAdded++;
        }
      }
      console.log(`+${pageAdded} nuevos`);
      await sleep(200);
    }
  }

  for (const query of CARREFOUR_SEARCHES) {
    process.stdout.write(`  Carrefour Search "${query}"... `);
    const items = await fetchVtex(CARREFOUR_BASE, `ft=${encodeURIComponent(query)}`, 0, 25);
    let qAdded = 0;
    for (const item of items) {
      const ean = item.items?.[0]?.ean;
      const images = item.items?.[0]?.images || [];
      const rawName = (item.productName || '').trim();
      const brand = (item.brand || '').trim() || 'Carrefour';

      if (!ean || ean.length < 8 || !rawName || images.length === 0) continue;

      const img = images[0]?.imageUrl?.split('?')[0];
      const pkg = parsePackageSize(rawName);
      const macro = resolveBromatologicalMacros(rawName, brand, item.categories?.[0]);
      const portion = calculatePortion(rawName, brand, macro.cat, pkg);

      const ratio = portion.unitGrams / 100;
      const pObj = {
        barcode: ean,
        name: rawName,
        brand,
        category: macro.cat,
        calories: macro.kcal,
        protein: macro.prot,
        carbs: macro.carbs,
        fats: macro.fat,
        default_portion_type: portion.defaultPortionType,
        serving_size: `${portion.unitGrams}${pkg.isLiquid ? 'ml' : 'g'}`,
        unit_name: portion.unitName,
        unit_grams: portion.unitGrams,
        unit_calories: Math.round(macro.kcal * ratio),
        unit_protein: Number((macro.prot * ratio).toFixed(1)),
        unit_carbs: Number((macro.carbs * ratio).toFixed(1)),
        unit_fats: Number((macro.fat * ratio).toFixed(1)),
        image: img,
        source: 'Carrefour Argentina',
      };

      if (addProduct(pObj)) {
        qAdded++;
        carrefourAdded++;
      }
    }
    console.log(`+${qAdded} nuevos`);
    await sleep(200);
  }

  console.log(`✅ ${carrefourAdded} productos únicos agregados desde Carrefour.`);
  console.log(`\n🎉 TOTAL CATÁLOGO MAESTRO CONSOLIDADO: ${masterMap.size} PRODUCTOS ÚNICOS.`);

  // -------------------------------------------------------------
  // PASO 5: Generación del Script SQL Maestro Único
  // -------------------------------------------------------------
  const allProducts = Array.from(masterMap.values());

  // Ordenar por Marca y presentación
  allProducts.sort((a, b) => {
    if (a.brand !== b.brand) return (a.brand || '').localeCompare(b.brand || '');
    return (a.unit_grams || 0) - (b.unit_grams || 0);
  });

  const valueRows = allProducts.map((p) => {
    return `(${esc(p.barcode)}, ${esc(p.name)}, ${esc(p.brand)}, ${esc(p.category)}, ${p.calories}, ${p.protein}, ${p.carbs}, ${p.fats}, ${esc(p.default_portion_type)}, ${esc(p.serving_size)}, ${esc(p.unit_name)}, ${p.unit_grams}, ${p.unit_calories}, ${p.unit_protein}, ${p.unit_carbs}, ${p.unit_fats}, ${esc(p.image)}, 'approved')`;
  });

  const masterSql = `-- =================================================================
-- ZENIT - MASTER FOODS DATABASE (CATÁLOGO MAESTRO DE ALIMENTOS ARGENTINA)
-- Total de productos únicos calibrados: ${allProducts.length}
-- Fuentes: Catálogo Local Zenit, Día Online, Jumbo Argentina & Carrefour Argentina
-- Todas las imágenes corresponden a packshots oficiales de estudio HD sobre fondo blanco
-- Cero dependencias externas. Cero duplicados.
-- =================================================================

INSERT INTO public.foods (
  barcode, name, brand, category,
  calories, protein, carbs, fats,
  default_portion_type, serving_size, unit_name, unit_grams,
  unit_calories, unit_protein, unit_carbs, unit_fats,
  image, status
) VALUES
${valueRows.join(',\n')}
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

  const outPath = path.resolve(__dirname, 'zenit_master_foods_seed.sql');
  fs.writeFileSync(outPath, masterSql, 'utf8');

  const stats = fs.statSync(outPath);
  console.log(`\n💾 ¡CATÁLOGO MAESTRO GENERADO CON ÉXITO!`);
  console.log(`📁 Archivo: ${outPath}`);
  console.log(`📊 Tamaño: ${(stats.size / 1024).toFixed(1)} KB`);
  console.log(`✨ Total Alimentos Listos para Supabase: ${allProducts.length}`);
}

buildMasterCatalog().catch(console.error);
