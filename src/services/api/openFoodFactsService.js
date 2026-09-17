// Servicio Open Food Facts para Argentina con Fallback y Catálogo Local
// Open Food Facts API v2 (Gratuita y Open Source - Licencia ODbL)
import { useUserStore } from '../../store/useUserStore';
import { POPULAR_ARGENTINE_PRODUCTS } from '../../data/argentineProducts';
import { supabase, isSupabaseConfigured } from '../supabaseClient';

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

  const supabaseResults = [];

  // TIER 2: Consultar Supabase en la nube (<50ms) si está configurado
  if (isSupabaseConfigured && supabase && !externalSignal?.aborted) {
    try {
      let queryBuilder = supabase
        .from('foods')
        .select('*')
        .eq('status', 'approved');

      if (tokens.length <= 1) {
        queryBuilder = queryBuilder.or(`name.ilike.%${cleanQuery}%,brand.ilike.%${cleanQuery}%,category.ilike.%${cleanQuery}%`);
      } else {
        // Multi-palabra (ej: "leche descremada", "coca zero"): cada token debe coincidir en name o brand
        for (const token of tokens.slice(0, 3)) {
          queryBuilder = queryBuilder.or(`name.ilike.%${token}%,brand.ilike.%${token}%`);
        }
      }

      const { data } = await queryBuilder.limit(60);

      if (data && Array.isArray(data)) {
        for (const item of data) {
          const foodKey = normalizeFoodKey(item.brand, item.name);
          if (seenKeys.has(foodKey)) continue;
          if (item.barcode && seenBarcodes.has(item.barcode)) continue;

          seenKeys.add(foodKey);
          if (item.barcode) seenBarcodes.add(item.barcode);

          supabaseResults.push({
            id: item.id || item.barcode,
            barcode: item.barcode || '',
            name: item.name,
            brand: item.brand || 'Marca nacional',
            category: item.category || 'Alimento',
            servingSize: item.serving_size || `${item.unit_grams || 100}g`,
            unitName: item.unit_name || '1 porción',
            unitGrams: Number(item.unit_grams) || 100,
            defaultPortionType: item.default_portion_type || 'unit',
            calories: Number(item.calories) || 0,
            protein: Number(item.protein) || 0,
            carbs: Number(item.carbs) || 0,
            fats: Number(item.fats) || 0,
            unitCalories: item.unit_calories != null ? Number(item.unit_calories) : null,
            unitProtein: item.unit_protein != null ? Number(item.unit_protein) : null,
            unitCarbs: item.unit_carbs != null ? Number(item.unit_carbs) : null,
            unitFats: item.unit_fats != null ? Number(item.unit_fats) : null,
            image: item.image || null,
            source: 'supabase',
          });
        }
      }
    } catch (err) {
      // Continuar silenciosamente
    }
  }

  // Ordenar inteligentemente por tamaño/presentación de menor a mayor para la misma familia
  const combined = [...localMatches, ...supabaseResults].sort((a, b) => {
    // Si comparten marca o raíz de nombre, ordenar por gramaje/volumen
    const aBrand = (a.brand || '').toLowerCase();
    const bBrand = (b.brand || '').toLowerCase();
    if (aBrand && bBrand && aBrand === bBrand) {
      const aGrams = Number(a.unitGrams) || 0;
      const bGrams = Number(b.unitGrams) || 0;
      if (aGrams !== bGrams) return aGrams - bGrams;
    }
    return 0;
  });

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
 * Busca un producto exclusivamente en la base de datos propietaria Zenit (Local + Supabase)
 * CERO dependencias externas de Open Food Facts para evitar datos corruptos.
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

  // 2. Revisar en catálogo local argentino verificado (0 ms)
  const localMatch = POPULAR_ARGENTINE_PRODUCTS.find((p) => p.barcode === barcode);
  if (localMatch) return localMatch;

  // 3. Revisar en base de datos Supabase en la nube (<50 ms)
  if (isSupabaseConfigured && supabase) {
    try {
      const { data, error } = await supabase
        .from('foods')
        .select('*')
        .eq('barcode', barcode)
        .eq('status', 'approved')
        .maybeSingle();

      if (!error && data) {
        return {
          id: data.id || data.barcode,
          barcode: data.barcode,
          name: data.name,
          brand: data.brand || 'Marca registrada',
          category: data.category || 'Alimento',
          servingSize: data.serving_size || `${data.unit_grams || 100}g`,
          unitName: data.unit_name || '1 porción',
          unitGrams: Number(data.unit_grams) || 100,
          defaultPortionType: data.default_portion_type || 'unit',
          calories: Number(data.calories) || 0,
          protein: Number(data.protein) || 0,
          carbs: Number(data.carbs) || 0,
          fats: Number(data.fats) || 0,
          unitCalories: data.unit_calories != null ? Number(data.unit_calories) : null,
          unitProtein: data.unit_protein != null ? Number(data.unit_protein) : null,
          unitCarbs: data.unit_carbs != null ? Number(data.unit_carbs) : null,
          unitFats: data.unit_fats != null ? Number(data.unit_fats) : null,
          image: data.image || null,
          source: 'supabase',
        };
      }
    } catch (e) {
      // Manejar error silenciosamente
    }
  }

  // Si no está registrado en la base oficial, retornamos null para que la UI
  // permita enviarlo a la cola de moderación del administrador.
  return null;
}
