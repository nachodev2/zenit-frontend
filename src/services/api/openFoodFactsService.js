// Servicio Open Food Facts para Argentina con Fallback y Catálogo Local
// Open Food Facts API v2 (Gratuita y Open Source - Licencia ODbL)
import { useUserStore } from '../../store/useUserStore';
import { POPULAR_ARGENTINE_PRODUCTS } from '../../data/argentineProducts';

export { POPULAR_ARGENTINE_PRODUCTS };

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
 * Normaliza cadenas de búsqueda eliminando diacríticos, mayúsculas y caracteres especiales
 */
export function normalizeSearchText(text) {
  if (!text || typeof text !== 'string') return '';
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Quita tildes / diacríticos
    .replace(/[^a-z0-9\s]/gi, ' ') // Quita puntuación
    .replace(/\s+/g, ' ')
    .trim();
}

const STOP_WORDS = new Set([
  'el', 'la', 'los', 'las', 'de', 'del', 'y', 'e', 'en', 'con', 'sin', 'un', 'una', 'unos', 'unas', 'para', 'por'
]);

/**
 * Obtiene los tokens significativos de una búsqueda eliminando artículos
 */
export function getQueryTokens(query) {
  const normalized = normalizeSearchText(query);
  if (!normalized) return [];
  const tokens = normalized.split(' ').filter((t) => t.length > 0);
  const filtered = tokens.filter((t) => !STOP_WORDS.has(t));
  return filtered.length > 0 ? filtered : tokens;
}

/**
 * Evalúa si un producto coincide con los tokens de búsqueda (en nombre, marca o categoría)
 */
export function matchesQueryTokens(item, queryTokens) {
  if (!queryTokens || queryTokens.length === 0) return true;
  const target = normalizeSearchText(`${item.name || ''} ${item.brand || ''} ${item.category || ''}`);
  return queryTokens.every((token) => target.includes(token));
}

/**
 * Búsqueda instantánea en memoria (0 ms) para catálogo local y productos personalizados
 */
export function findLocalMatches(query, customProducts = []) {
  const tokens = getQueryTokens(query);
  if (tokens.length === 0) {
    return [...customProducts, ...POPULAR_ARGENTINE_PRODUCTS];
  }

  const allLocal = [...customProducts, ...POPULAR_ARGENTINE_PRODUCTS];
  return allLocal.filter((item) => matchesQueryTokens(item, tokens));
}

// Caché en memoria para acelerar búsquedas repetidas
const SEARCH_CACHE = new Map();
const MAX_CACHE_SIZE = 60;

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
export async function searchOpenFoodFacts(query, externalSignal) {
  const cleanQuery = query?.trim()?.toLowerCase() || '';
  if (!cleanQuery) return POPULAR_ARGENTINE_PRODUCTS;

  const tokens = getQueryTokens(cleanQuery);
  const localMatches = POPULAR_ARGENTINE_PRODUCTS.filter((item) => matchesQueryTokens(item, tokens));

  // Verificar caché en memoria para respuesta en 0ms
  const cacheKey = normalizeSearchText(cleanQuery);
  if (SEARCH_CACHE.has(cacheKey)) {
    return SEARCH_CACHE.get(cacheKey);
  }

  // Registro para deduplicación: Evita mostrar 80 latas repetidas de Monster o Havanna
  const seenKeys = new Set();
  const seenBarcodes = new Set();

  localMatches.forEach((item) => {
    if (item.barcode) seenBarcodes.add(item.barcode);
    seenKeys.add(normalizeFoodKey(item.brand, item.name));
  });

  const offResults = [];

  // Intentamos consultar primero el nodo de Argentina (ar.openfoodfacts.org) y luego el nodo global (world.openfoodfacts.org)
  const candidateUrls = [
    `https://ar.openfoodfacts.org/cgi/search.pl?search_terms=${encodeURIComponent(cleanQuery)}&search_simple=1&action=process&json=1&page_size=24`,
    `https://world.openfoodfacts.org/cgi/search.pl?search_terms=${encodeURIComponent(cleanQuery)}&search_simple=1&action=process&json=1&page_size=24`,
  ];

  for (const url of candidateUrls) {
    if (externalSignal?.aborted) break;

    try {
      const fetchOptions = {
        headers: {
          'User-Agent': 'ZenitApp - Android - Version 1.0 (contact@zenitapp.com)',
          'Accept': 'application/json',
        },
      };

      if (externalSignal) {
        fetchOptions.signal = externalSignal;
      }

      const response = await fetch(url, fetchOptions);

      // Validar que la respuesta sea exitosa y en formato JSON (para evitar HTML en errores 503)
      const contentType = response.headers?.get('content-type') || '';
      if (response.ok && contentType.includes('json')) {
        const data = await response.json();
        if (data?.products && Array.isArray(data.products) && data.products.length > 0) {
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

          // Si obtuvimos resultados del primer nodo, no necesitamos consultar el siguiente
          if (offResults.length > 0) {
            break;
          }
        }
      }
    } catch (error) {
      if (error.name === 'AbortError') {
        return localMatches;
      }
      // Si falla un nodo (503/timeout), el bucle continúa con el siguiente candidato
    }
  }

  const combined = [...localMatches, ...offResults];
  if (combined.length > 0) {
    if (SEARCH_CACHE.size >= MAX_CACHE_SIZE) {
      const firstKey = SEARCH_CACHE.keys().next().value;
      SEARCH_CACHE.delete(firstKey);
    }
    SEARCH_CACHE.set(cacheKey, combined);
  }

  return combined;
}

/**
 * Busca un producto por código de barras EAN-13
 */
export async function getProductByBarcode(barcode) {
  if (!barcode) return null;

  // 1. Revisar primero en productos creados por el usuario
  try {
    const customProducts = useUserStore.getState().customProducts || [];
    const customMatch = customProducts.find((p) => p.barcode === barcode);
    if (customMatch) return customMatch;
  } catch (e) {
    // Si useUserStore aún no está listo o en contexto aislado
  }

  // 2. Revisar en catálogo local argentino
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
