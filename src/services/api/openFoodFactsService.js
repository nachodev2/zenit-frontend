// Servicio Open Food Facts para Argentina con Fallback y Catálogo Local
// Open Food Facts API v2 (Gratuita y Open Source - Licencia ODbL)

export const POPULAR_ARGENTINE_PRODUCTS = [
  {
    id: 'off-arg-monster',
    name: 'Monster Energy Original',
    brand: 'Monster Energy',
    barcode: '5060335632302',
    servingSize: '473ml (1 lata)',
    unitName: '1 lata (473ml)',
    unitGrams: 473,
    defaultPortionType: 'unit',
    // Macros por 100ml
    calories: 48,
    protein: 0.0,
    carbs: 12.0,
    fats: 0.0,
    // Macros por 1 lata completa (473ml)
    unitCalories: 227,
    unitProtein: 0.0,
    unitCarbs: 56.8,
    unitFats: 0.0,
    image: 'https://images.openfoodfacts.org/images/products/506/033/563/2302/front_en.103.400.jpg',
    category: 'Bebidas Energéticas',
  },
  {
    id: 'off-arg-monster-ultra-white',
    name: 'Monster Energy Zero Ultra (Blanca)',
    brand: 'Monster Energy',
    barcode: '5060337501316',
    servingSize: '473ml (1 lata)',
    unitName: '1 lata (473ml)',
    unitGrams: 473,
    defaultPortionType: 'unit',
    calories: 3,
    protein: 0.0,
    carbs: 0.8,
    fats: 0.0,
    unitCalories: 14,
    unitProtein: 0.0,
    unitCarbs: 3.8,
    unitFats: 0.0,
    image: 'https://images.openfoodfacts.org/images/products/506/033/750/1316/front_es.145.400.jpg',
    category: 'Bebidas Energéticas',
  },
  {
    id: 'off-arg-monster-mango-loco',
    name: 'Monster Energy Mango Loco',
    brand: 'Monster Energy',
    barcode: '5060639121915',
    servingSize: '473ml (1 lata)',
    unitName: '1 lata (473ml)',
    unitGrams: 473,
    defaultPortionType: 'unit',
    calories: 47,
    protein: 0.0,
    carbs: 11.6,
    fats: 0.0,
    unitCalories: 222,
    unitProtein: 0.0,
    unitCarbs: 54.8,
    unitFats: 0.0,
    image: 'https://images.openfoodfacts.org/images/products/506/063/912/1915/front_es.23.400.jpg',
    category: 'Bebidas Energéticas',
  },
  {
    id: 'off-arg-monster-pipeline-punch',
    name: 'Monster Energy Pipeline Punch',
    brand: 'Monster Energy',
    barcode: '5060517885526',
    servingSize: '473ml (1 lata)',
    unitName: '1 lata (473ml)',
    unitGrams: 473,
    defaultPortionType: 'unit',
    calories: 45,
    protein: 0.0,
    carbs: 11.0,
    fats: 0.0,
    unitCalories: 213,
    unitProtein: 0.0,
    unitCarbs: 52.0,
    unitFats: 0.0,
    image: 'https://images.openfoodfacts.org/images/products/506/051/788/5526/front_fr.27.400.jpg',
    category: 'Bebidas Energéticas',
  },
  {
    id: 'off-arg-monster-ultra-paradise',
    name: 'Monster Energy Ultra Paradise',
    brand: 'Monster Energy',
    barcode: '5060639127139',
    servingSize: '473ml (1 lata)',
    unitName: '1 lata (473ml)',
    unitGrams: 473,
    defaultPortionType: 'unit',
    calories: 3,
    protein: 0.0,
    carbs: 0.8,
    fats: 0.0,
    unitCalories: 14,
    unitProtein: 0.0,
    unitCarbs: 3.8,
    unitFats: 0.0,
    image: 'https://images.openfoodfacts.org/images/products/506/063/912/7139/front_en.62.400.jpg',
    category: 'Bebidas Energéticas',
  },
  {
    id: 'off-arg-monster-ultra-watermelon',
    name: 'Monster Energy Ultra Watermelon',
    brand: 'Monster Energy',
    barcode: '5060896621326',
    servingSize: '473ml (1 lata)',
    unitName: '1 lata (473ml)',
    unitGrams: 473,
    defaultPortionType: 'unit',
    calories: 3,
    protein: 0.0,
    carbs: 0.8,
    fats: 0.0,
    unitCalories: 14,
    unitProtein: 0.0,
    unitCarbs: 3.8,
    unitFats: 0.0,
    image: 'https://images.openfoodfacts.org/images/products/506/089/662/1326/front_fr.16.400.jpg',
    category: 'Bebidas Energéticas',
  },
  {
    id: 'off-arg-alfajor',
    name: 'Alfajor Chocolate',
    brand: 'Havanna',
    barcode: '7791875005353',
    servingSize: '55g (1 unidad)',
    unitName: '1 alfajor (55g)',
    unitGrams: 55,
    defaultPortionType: 'unit',
    calories: 382,
    protein: 6.5,
    carbs: 54.5,
    fats: 14.5,
    unitCalories: 210,
    unitProtein: 3.6,
    unitCarbs: 30.0,
    unitFats: 8.0,
    image: 'https://images.unsplash.com/photo-1558961363-fa8fdf82db35?auto=format&fit=crop&w=400&q=80',
    category: 'Dulces y Snacks',
  },
  {
    id: 'off-arg-1',
    name: 'Yogur Firme Vainilla',
    brand: 'La Serenísima',
    barcode: '7790080026042',
    servingSize: '120g (1 pote)',
    unitName: '1 pote (120g)',
    unitGrams: 120,
    defaultPortionType: 'unit',
    calories: 95,
    protein: 3.5,
    carbs: 13.3,
    fats: 3.0,
    unitCalories: 114,
    unitProtein: 4.2,
    unitCarbs: 16.0,
    unitFats: 3.6,
    image: 'https://images.unsplash.com/photo-1488477181946-6428a0291777?auto=format&fit=crop&w=400&q=80',
    category: 'Lácteos',
  },
  {
    id: 'off-arg-2',
    name: 'Pechuga de Pollo Fresca',
    brand: 'Granja Tres Arroyos',
    barcode: '7798031234567',
    servingSize: '150g (1 filete)',
    unitName: '1 filete (150g)',
    unitGrams: 150,
    defaultPortionType: 'grams',
    calories: 165,
    protein: 34.5,
    carbs: 0.0,
    fats: 2.7,
    unitCalories: 248,
    unitProtein: 51.8,
    unitCarbs: 0.0,
    unitFats: 4.1,
    image: 'https://images.unsplash.com/photo-1604503468506-a8da13d82791?auto=format&fit=crop&w=400&q=80',
    category: 'Carnes',
  },
  {
    id: 'off-arg-3',
    name: 'Fideos Spaghetti',
    brand: 'Lucchetti',
    barcode: '7790070312018',
    servingSize: '80g (1 plato seco)',
    unitName: '1 plato (80g)',
    unitGrams: 80,
    defaultPortionType: 'grams',
    calories: 350,
    protein: 12.0,
    carbs: 71.3,
    fats: 1.5,
    unitCalories: 280,
    unitProtein: 9.6,
    unitCarbs: 57.0,
    unitFats: 1.2,
    image: 'https://images.unsplash.com/photo-1551462147-ff29053bfc14?auto=format&fit=crop&w=400&q=80',
    category: 'Pastas y Granos',
  },
  {
    id: 'off-arg-4',
    name: 'Avena Instantánea',
    brand: 'Quaker',
    barcode: '7790310984512',
    servingSize: '40g (4 cdas)',
    unitName: '1 porción (40g)',
    unitGrams: 40,
    defaultPortionType: 'grams',
    calories: 390,
    protein: 14.0,
    carbs: 67.0,
    fats: 7.0,
    unitCalories: 156,
    unitProtein: 5.6,
    unitCarbs: 26.8,
    unitFats: 2.8,
    image: 'https://images.unsplash.com/photo-1586495777744-4413f21062fa?auto=format&fit=crop&w=400&q=80',
    category: 'Cereales',
  },
  {
    id: 'off-arg-5',
    name: 'Atún al Natural en Lomitos',
    brand: 'La Campagnola',
    barcode: '7790035001254',
    servingSize: '120g (1 lata escurrida)',
    unitName: '1 lata (120g)',
    unitGrams: 120,
    defaultPortionType: 'unit',
    calories: 100,
    protein: 22.0,
    carbs: 0.0,
    fats: 1.0,
    unitCalories: 120,
    unitProtein: 26.4,
    unitCarbs: 0.0,
    unitFats: 1.2,
    image: 'https://images.unsplash.com/photo-1501595091296-3aa970afb3ff?auto=format&fit=crop&w=400&q=80',
    category: 'Pescados',
  },
  {
    id: 'off-arg-6',
    name: 'Queso Cremón Cremoso',
    brand: 'La Serenísima',
    barcode: '7790080034023',
    servingSize: '30g (1 rebanada)',
    unitName: '1 rebanada (30g)',
    unitGrams: 30,
    defaultPortionType: 'unit',
    calories: 293,
    protein: 21.0,
    carbs: 2.0,
    fats: 22.7,
    unitCalories: 88,
    unitProtein: 6.3,
    unitCarbs: 0.6,
    unitFats: 6.8,
    image: 'https://images.unsplash.com/photo-1486297678162-eb2a19b0a32d?auto=format&fit=crop&w=400&q=80',
    category: 'Lácteos',
  },
  {
    id: 'off-arg-7',
    name: 'Arroz Largo Fino',
    brand: 'Gallo Oro',
    barcode: '7790070112458',
    servingSize: '50g (1 taza crudo)',
    unitName: '1 porción (50g)',
    unitGrams: 50,
    defaultPortionType: 'grams',
    calories: 350,
    protein: 7.0,
    carbs: 77.0,
    fats: 0.8,
    unitCalories: 175,
    unitProtein: 3.5,
    unitCarbs: 38.5,
    unitFats: 0.4,
    image: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?auto=format&fit=crop&w=400&q=80',
    category: 'Pastas y Granos',
  },
  {
    id: 'off-arg-8',
    name: 'Huevos de Campo Grandes',
    brand: 'Granja Argentina',
    barcode: '7791234567890',
    servingSize: '50g (1 huevo)',
    unitName: '1 huevo (50g)',
    unitGrams: 50,
    defaultPortionType: 'unit',
    calories: 143,
    protein: 12.6,
    carbs: 0.8,
    fats: 9.5,
    unitCalories: 72,
    unitProtein: 6.3,
    unitCarbs: 0.4,
    unitFats: 4.8,
    image: 'https://images.unsplash.com/photo-1582722872445-44dc5f7e3c8f?auto=format&fit=crop&w=400&q=80',
    category: 'Huevos',
  },
  {
    id: 'off-arg-9',
    name: 'Leche Descremada 0%',
    brand: 'La Serenísima Clásica',
    barcode: '7790080011024',
    servingSize: '200ml (1 vaso)',
    unitName: '1 vaso (200ml)',
    unitGrams: 200,
    defaultPortionType: 'unit',
    calories: 34,
    protein: 3.1,
    carbs: 4.9,
    fats: 0.0,
    unitCalories: 68,
    unitProtein: 6.2,
    unitCarbs: 9.8,
    unitFats: 0.0,
    image: 'https://images.unsplash.com/photo-1550583724-b2692b85b150?auto=format&fit=crop&w=400&q=80',
    category: 'Lácteos',
  },
  {
    id: 'off-arg-10',
    name: 'Galletitas de Salvado',
    brand: 'Granix',
    barcode: '7790580123456',
    servingSize: '30g (3 galletitas)',
    unitName: '3 galletitas (30g)',
    unitGrams: 30,
    defaultPortionType: 'unit',
    calories: 420,
    protein: 11.0,
    carbs: 65.0,
    fats: 12.7,
    unitCalories: 126,
    unitProtein: 3.3,
    unitCarbs: 19.5,
    unitFats: 3.8,
    image: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=400&q=80',
    category: 'Snacks',
  },
  {
    id: 'off-arg-11',
    name: 'Banana Fresca',
    brand: 'Ecuador Premium',
    barcode: '7790001002003',
    servingSize: '120g (1 mediana)',
    unitName: '1 banana (120g)',
    unitGrams: 120,
    defaultPortionType: 'unit',
    calories: 88,
    protein: 1.1,
    carbs: 22.5,
    fats: 0.2,
    unitCalories: 105,
    unitProtein: 1.3,
    unitCarbs: 27.0,
    unitFats: 0.3,
    image: 'https://images.unsplash.com/photo-1571771894821-ce9b6c11b08e?auto=format&fit=crop&w=400&q=80',
    category: 'Frutas',
  },
  {
    id: 'off-arg-12',
    name: 'Dulce de Leche Colonial',
    brand: 'La Serenísima',
    barcode: '7790080045012',
    servingSize: '20g (1 cucharada)',
    unitName: '1 cucharada (20g)',
    unitGrams: 20,
    defaultPortionType: 'unit',
    calories: 310,
    protein: 6.0,
    carbs: 55.0,
    fats: 7.0,
    unitCalories: 62,
    unitProtein: 1.2,
    unitCarbs: 11.0,
    unitFats: 1.4,
    image: 'https://images.unsplash.com/photo-1559598467-f8b76c8155d0?auto=format&fit=crop&w=400&q=80',
    category: 'Dulces',
  },
];

/**
 * Parser inteligente de porciones/unidades para productos
 */
export function parseServingInfo(p, kcal100, prot100, carbs100, fat100) {
  const nutriments = p.nutriments || {};
  let servingStr = (p.serving_size || '').trim();
  let servingGrams = Number(p.serving_quantity) || 0;

  // Extraer gramos/ml de texto si no está numérico
  if (!servingGrams && servingStr) {
    const match = servingStr.match(/(\d+(?:[.,]\d+)?)\s*(?:g|ml|gr|cl)/i);
    if (match) {
      servingGrams = parseFloat(match[1].replace(',', '.'));
      if (servingStr.toLowerCase().includes('cl')) {
        servingGrams *= 10;
      }
    }
  }

  // Fallback si no hay porción especificada
  if (!servingGrams || servingGrams <= 0) {
    servingGrams = 100;
  }

  const lowerName = (p.product_name || p.product_name_es || '').toLowerCase();
  const lowerServing = servingStr.toLowerCase();

  // Nombre coloquial de la unidad
  let unitName = '1 porción';
  if (lowerServing.includes('lata') || lowerName.includes('monster') || lowerName.includes('red bull') || lowerName.includes('speed') || lowerName.includes('cerveza') || lowerName.includes('gaseosa') || lowerName.includes('coca')) {
    unitName = `1 lata (${servingGrams}ml)`;
  } else if (lowerServing.includes('botella') || lowerServing.includes('vaso')) {
    unitName = `1 botella (${servingGrams}ml)`;
  } else if (lowerServing.includes('pote') || lowerName.includes('yogur') || lowerName.includes('yogurt') || lowerName.includes('postre')) {
    unitName = `1 pote (${servingGrams}g)`;
  } else if (lowerServing.includes('alfajor') || lowerName.includes('alfajor')) {
    unitName = `1 alfajor (${servingGrams}g)`;
  } else if (lowerServing.includes('barra') || lowerName.includes('bar')) {
    unitName = `1 barra (${servingGrams}g)`;
  } else if (lowerServing.includes('huevo') || lowerName.includes('huevo')) {
    unitName = `1 huevo (${servingGrams}g)`;
  } else if (servingStr) {
    unitName = `1 unidad / porción (${servingStr})`;
  } else {
    unitName = `1 porción (${servingGrams}g)`;
  }

  // Macros calculados para 1 unidad / porción
  const servingKcal = nutriments['energy-kcal_serving'] != null
    ? Math.round(Number(nutriments['energy-kcal_serving']))
    : Math.round(kcal100 * (servingGrams / 100));

  const servingProt = nutriments.proteins_serving != null
    ? Number(Number(nutriments.proteins_serving).toFixed(1))
    : Number((prot100 * (servingGrams / 100)).toFixed(1));

  const servingCarbs = nutriments.carbohydrates_serving != null
    ? Number(Number(nutriments.carbohydrates_serving).toFixed(1))
    : Number((carbs100 * (servingGrams / 100)).toFixed(1));

  const servingFat = nutriments.fat_serving != null
    ? Number(Number(nutriments.fat_serving).toFixed(1))
    : Number((fat100 * (servingGrams / 100)).toFixed(1));

  // Es un producto que naturalmente se consume por unidad/envase?
  const isUnitDefault =
    servingGrams !== 100 ||
    lowerName.includes('monster') ||
    lowerName.includes('bebida') ||
    lowerName.includes('alfajor') ||
    lowerName.includes('yogur') ||
    lowerName.includes('huevo') ||
    lowerName.includes('lata') ||
    lowerName.includes('barra') ||
    lowerName.includes('snack') ||
    lowerServing.includes('lata') ||
    lowerServing.includes('pote') ||
    lowerServing.includes('unidad');

  return {
    servingSizeStr: servingStr || `${servingGrams}g`,
    unitName,
    unitGrams: Math.round(servingGrams),
    defaultPortionType: isUnitDefault ? 'unit' : 'grams',
    unitCalories: servingKcal,
    unitProtein: servingProt,
    unitCarbs: servingCarbs,
    unitFats: servingFat,
  };
}

/**
 * Convierte URLs de miniaturas (.100 / .200) de Open Food Facts a packshots HD (.400)
 */
export function toHighResImage(url) {
  if (!url || typeof url !== 'string') return null;
  if (url.includes('openfoodfacts.org')) {
    return url.replace(/\.(200|100)\.jpg$/i, '.400.jpg');
  }
  return url;
}

/**
 * Normaliza nombres para deduplicar productos redundantes (ej: 15 variantes idénticas de Monster)
 */
export function normalizeFoodKey(brand, name) {
  return `${brand || ''} ${name || ''}`
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\b(bebida|energizante|drink|lata|ml|gr|g|pack|unidades?|porcions?)\b/g, '')
    .replace(/[^a-z0-9]/g, '')
    .trim();
}

/**
 * Busca productos por nombre en Open Food Facts con deduplicación y prioridad de catálogo local curado
 */
export async function searchOpenFoodFacts(query) {
  const cleanQuery = query?.trim()?.toLowerCase() || '';
  if (!cleanQuery) return POPULAR_ARGENTINE_PRODUCTS;

  // 1. Filtrar primero coincidencias en nuestro catálogo curado argentino
  const localMatches = POPULAR_ARGENTINE_PRODUCTS.filter(
    (item) =>
      item.name.toLowerCase().includes(cleanQuery) ||
      item.brand.toLowerCase().includes(cleanQuery) ||
      item.category.toLowerCase().includes(cleanQuery)
  );

  // Registro para deduplicación: Evita mostrar 80 latas repetidas de Monster oHavanna
  const seenKeys = new Set();
  const seenBarcodes = new Set();

  localMatches.forEach((item) => {
    if (item.barcode) seenBarcodes.add(item.barcode);
    seenKeys.add(normalizeFoodKey(item.brand, item.name));
  });

  const offResults = [];

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4500);

    const url = `https://world.openfoodfacts.org/cgi/search.pl?search_terms=${encodeURIComponent(
      cleanQuery
    )}&search_simple=1&action=process&json=1&page_size=24&country=argentina`;

    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'ZenitApp - React Native - Version 1.0',
      },
    });
    clearTimeout(timeoutId);

    if (response.ok) {
      const data = await response.json();
      if (data?.products && Array.isArray(data.products)) {
        for (const p of data.products) {
          const rawName = p.product_name_es || p.product_name;
          if (!rawName || rawName.trim().length < 2) continue;

          const rawBrand = p.brands || 'Marca nacional';
          const foodKey = normalizeFoodKey(rawBrand, rawName);

          // Si ya tenemos esta variante (en catálogo curado o en resultados anteriores), la descartamos
          if (seenKeys.has(foodKey)) continue;
          if (p.code && seenBarcodes.has(p.code)) continue;

          seenKeys.add(foodKey);
          if (p.code) seenBarcodes.add(p.code);

          const nutriments = p.nutriments || {};
          const kcal = Math.round(Number(nutriments['energy-kcal_100g'] || nutriments['energy-kcal'] || 0));
          const prot = Number((nutriments.proteins_100g || nutriments.proteins || 0).toFixed(1));
          const carbs = Number((nutriments.carbohydrates_100g || nutriments.carbohydrates || 0).toFixed(1));
          const fat = Number((nutriments.fat_100g || nutriments.fat || 0).toFixed(1));

          const servingData = parseServingInfo(p, kcal, prot, carbs, fat);

          const hdImage = toHighResImage(
            p.selected_images?.front?.display?.es ||
            p.selected_images?.front?.display?.en ||
            p.image_front_url ||
            p.image_front_small_url ||
            p.image_url ||
            null
          );

          offResults.push({
            id: p.code || `off-${Math.random()}`,
            name: rawName.trim(),
            brand: rawBrand.trim(),
            barcode: p.code || '',
            servingSize: servingData.servingSizeStr,
            unitName: servingData.unitName,
            unitGrams: servingData.unitGrams,
            defaultPortionType: servingData.defaultPortionType,
            calories: kcal,
            protein: prot,
            carbs: carbs,
            fats: fat,
            unitCalories: servingData.unitCalories,
            unitProtein: servingData.unitProtein,
            unitCarbs: servingData.unitCarbs,
            unitFats: servingData.unitFats,
            image: hdImage,
            category: p.categories?.split(',')?.[0] || 'Alimento',
            source: 'open_food_facts',
          });
        }
      }
    }
  } catch (error) {
    console.log('[OpenFoodFacts] Offline o timeout en búsqueda.');
  }

  return [...localMatches, ...offResults];
}

/**
 * Busca un producto por código de barras EAN-13
 */
export async function getProductByBarcode(barcode) {
  if (!barcode) return null;

  // 1. Revisar primero en catálogo local
  const localMatch = POPULAR_ARGENTINE_PRODUCTS.find((p) => p.barcode === barcode);
  if (localMatch) return localMatch;

  try {
    const url = `https://world.openfoodfacts.org/api/v2/product/${barcode}.json`;
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'ZenitApp - React Native - Version 1.0',
      },
    });

    if (response.ok) {
      const data = await response.json();
      if (data?.status === 1 && data.product) {
        const p = data.product;
        const nutriments = p.nutriments || {};
        const kcal = Math.round(Number(nutriments['energy-kcal_100g'] || nutriments['energy-kcal'] || 0));
        const prot = Number((nutriments.proteins_100g || 0).toFixed(1));
        const carbs = Number((nutriments.carbohydrates_100g || 0).toFixed(1));
        const fat = Number((nutriments.fat_100g || 0).toFixed(1));

        const servingData = parseServingInfo(p, kcal, prot, carbs, fat);

        const hdImage = toHighResImage(
          p.selected_images?.front?.display?.es ||
          p.selected_images?.front?.display?.en ||
          p.image_front_url ||
          p.image_front_small_url ||
          p.image_url ||
          null
        );

        return {
          id: p.code,
          name: p.product_name_es || p.product_name || 'Producto Escaneado',
          brand: p.brands || 'Genérico',
          barcode: p.code,
          servingSize: servingData.servingSizeStr,
          unitName: servingData.unitName,
          unitGrams: servingData.unitGrams,
          defaultPortionType: servingData.defaultPortionType,
          calories: kcal,
          protein: prot,
          carbs: carbs,
          fats: fat,
          unitCalories: servingData.unitCalories,
          unitProtein: servingData.unitProtein,
          unitCarbs: servingData.unitCarbs,
          unitFats: servingData.unitFats,
          image: hdImage,
          category: p.categories?.split(',')?.[0] || 'Alimento',
          source: 'open_food_facts',
        };
      }
    }
  } catch (err) {
    console.log('[OpenFoodFacts] Error consultando código de barras:', err);
  }

  return null;
}

