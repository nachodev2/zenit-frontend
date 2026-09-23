// =================================================================
// ZENIT - SERVICIO DE CATÁLOGO Y BASE DE DATOS DE ALIMENTOS
// Arquitectura Híbrida de Alto Rendimiento:
// - Tier 1: Catálogo local curado (0 ms, offline-friendly)
// - Tier 2: Supabase PostgreSQL en la nube (<100 ms) con indexación
// Cero dependencias de APIs de terceros (Open Food Facts eliminada).
// =================================================================

import { useUserStore } from '../../store/useUserStore';
import { POPULAR_ARGENTINE_PRODUCTS } from '../../data/argentineProducts';
import { JUMBO_PLACEHOLDER_IDS } from '../../data/placeholderImageIds';
import { supabase, isSupabaseConfigured } from '../supabaseClient';

export { POPULAR_ARGENTINE_PRODUCTS };

/**
 * Parser inteligente de porciones y unidades comerciales
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

  const lowerName = (p.product_name || p.product_name_es || p.name || '').toLowerCase();
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
 * Detecta si una imagen es un placeholder de stock o cámara rota servida por supermercados
 */
export function isPlaceholderImage(url) {
  if (!url || typeof url !== 'string' || !url.trim()) return true;
  const lower = url.toLowerCase();
  // Descartar fotos de stock genéricas de Unsplash
  if (lower.includes('unsplash.com')) return true;
  if (lower.includes('photo-1599488615731-7e5c2823ff28')) return true;
  if (lower.includes('placeholder') || lower.includes('sin-foto') || lower.includes('sin-imagen') || lower.includes('no-disponible')) return true;
  
  // Extraer ID numérico de VTEX Jumbo y verificar si es el placeholder de cámara rota
  if (lower.includes('jumboargentina')) {
    const match = url.match(/\/ids\/(\d+)\//);
    if (match && JUMBO_PLACEHOLDER_IDS.has(match[1])) {
      return true;
    }
  }
  return false;
}

/**
 * Convierte URLs de miniaturas (.100 / .200) a packshots HD (.400) y descarta placeholders
 */
export function toHighResImage(url) {
  if (!url || typeof url !== 'string' || isPlaceholderImage(url)) return null;
  if (url.includes('openfoodfacts.org')) {
    return url.replace(/\.(200|100)\.jpg$/i, '.400.jpg');
  }
  return url;
}

const PET_BRANDS = new Set([
  'dog chow', 'cat chow', 'whiskas', 'felix', 'gati', 'purina one', 'purina',
  'pedigree', 'temptations', "pet's class", 'pets class', 'royal canin',
  'eukanuba', 'pro plan', 'vitalcan', 'sabrositos', 'raza', 'catchow', 'dogchow',
  'dogui', 'catui', 'sieger', 'excellent'
]);

const PET_PHRASES = [
  'alimento para perro', 'alimento para gato', 'comida para perro', 'comida para gato',
  'para perros', 'para gatos', 'para cachorros', 'para gatitos',
  'snack para perro', 'snack para gato', 'snacks para gatos', 'snacks para perros',
  'mascotas', 'pet shop', 'alimento seco para', 'alimento humedo para',
  'adulto raza', 'cachorro raza', 'perro adulto', 'perro cachorro',
  'gato adulto', 'gato cachorro', 'alimento balanceado'
];

/**
 * Detecta si un ítem no corresponde a un alimento apto (librería, bazar, carbón, leña, naftalina, fórmulas para bebés)
 */
export function isNonFood(item) {
  if (!item) return false;
  const name = (item.name || '').toLowerCase().trim();
  const brand = (item.brand || '').toLowerCase().trim();

  // Librería / Bazar / No comestible
  if (
    name.includes('cuaderno') || name.includes('repuesto ledesma') || name.includes('resma de hoja') ||
    (name.startsWith('chango ') && !name.includes('azúcar') && !name.includes('azucar') && !name.includes('canela')) ||
    name.includes('naftalina') ||
    name.includes('neo silk') ||
    name.includes('chips de leña') || name.includes('astillas ahumadoras') || name.includes('chips ahumadores') || name.includes('pastillas de encendido')
  ) {
    return true;
  }

  // Fórmulas infantiles / Bebé ("los bebés no usan la app")
  if (brand.includes('sancor bebé') || brand.includes('sancor bebe') || name.includes('sancor bebé') || name.includes('sancor bebe') || name.includes('leche infantil')) {
    return true;
  }

  // Promo pack doble
  if (name.includes('duopac') || (name.includes('coca cola') && name.includes('sprite') && name.includes('1.75'))) {
    return true;
  }

  return false;
}

/**
 * Detecta si un producto corresponde a alimento para mascotas o producto no comestible
 */
export function isPetFood(item) {
  if (!item) return false;
  if (isNonFood(item)) return true;
  const brand = (item.brand || '').toLowerCase().trim();
  const name = (item.name || '').toLowerCase().trim();
  const category = (item.category || '').toLowerCase().trim();

  for (const petBrand of PET_BRANDS) {
    if (brand === petBrand || brand.startsWith(petBrand + ' ') || brand.endsWith(' ' + petBrand) || brand.includes(petBrand)) {
      return true;
    }
  }

  for (const phrase of PET_PHRASES) {
    if (name.includes(phrase) || category.includes(phrase)) {
      return true;
    }
  }

  return false;
}

/**
 * Normaliza cadenas de búsqueda eliminando diacríticos, mayúsculas y caracteres especiales
 */
export function normalizeSearchText(text) {
  if (!text || typeof text !== 'string') return '';
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Quita tildes
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
 * Evalúa si un producto coincide con los tokens de búsqueda por límite de palabra
 * (evita que "pollo" coincida con "repollo")
 */
export function matchesQueryTokens(item, queryTokens) {
  if (!queryTokens || queryTokens.length === 0) return true;
  const target = normalizeSearchText(`${item.name || ''} ${item.brand || ''} ${item.category || ''}`);
  const words = target.split(' ').filter((w) => w.length > 0);
  // Cada token de búsqueda debe coincidir con el INICIO de alguna palabra
  return queryTokens.every((token) => words.some((word) => word.startsWith(token)));
}

/**
 * Secciones canónicas minimalistas estilo PedidosYa Market / Rappi
 * Cumplen con la regla de oro: Cero colores aleatorios, fondo neutro #F1F5F9,
 * packshots limpios y títulos directos sin textos de relleno.
 */
export const MARKET_SECTIONS = [
  // TOP 6 CATEGORÍAS (Visibles de entrada en grilla 3x2)
  {
    id: 'frutas_verduras',
    title: 'Frutas y Verduras',
    image: 'https://carrefourar.vteximg.com.br/arquivos/ids/886228/2509836000003_02.jpg',
    accentColor: '#16A34A',
  },
  {
    id: 'carnes_pescados',
    title: 'Carnes y Pescados',
    image: 'https://jumboargentina.vteximg.com.br/arquivos/ids/894358/Bife-De-Chorizo-1-248166.jpg',
    accentColor: '#DC2626',
  },
  {
    id: 'lacteos',
    title: 'Lácteos y Quesos',
    image: 'https://jumboargentina.vteximg.com.br/arquivos/ids/901212/7791337061385_1.jpg',
    accentColor: '#0284C7',
  },
  {
    id: 'panificados',
    title: 'Panadería y Masas',
    image: 'https://ardiaprod.vteximg.com.br/arquivos/ids/366731/Pan-de-Hamburguesa-Bimbo-Artesano-4-Ud-_1.jpg',
    accentColor: '#D97706',
  },
  {
    id: 'cereales_legumbres',
    title: 'Cereales y Granos',
    image: 'https://ardiaprod.vteximg.com.br/arquivos/ids/373038/Arroz-Molinos-Ala-Doble-Carolina-1-Kg-_1.jpg',
    accentColor: '#CA8A04',
  },
  {
    id: 'bebidas',
    title: 'Bebidas',
    image: 'https://ardiaprod.vteximg.com.br/arquivos/ids/339782/Gaseosa-CocaCola-Sabor-Liviano-15-Lt-_1.jpg',
    accentColor: '#0891B2',
  },
  // CATEGORÍAS EXPANDIBLES ("Más categorías ⌵")
  {
    id: 'snacks',
    title: 'Snacks y Dulces',
    image: 'https://ardiaprod.vteximg.com.br/arquivos/ids/307588/Bombon-Relleno-Bon-o-Bon-Original-15-Gr-_1.jpg',
    accentColor: '#EA580C',
  },
  {
    id: 'congelados',
    title: 'Congelados',
    image: 'https://carrefourar.vteximg.com.br/arquivos/ids/386613/7791720025208_E01.jpg',
    accentColor: '#2563EB',
  },
  {
    id: 'suplementos',
    title: 'Suplementos',
    image: 'https://jumboargentina.vteximg.com.br/arquivos/ids/925375/Proteina-En-Polvo-Ena-Sport-Chocolate-900gr-1-1062611.jpg',
    accentColor: '#7C3AED',
  },
  {
    id: 'conservas',
    title: 'Conservas y Dulces',
    image: 'https://jumboargentina.vteximg.com.br/arquivos/ids/880371/Mermelada-Frambuesa-Patagonia-Berries-320-Gr-1-1044873.jpg?v=638911389739100000',
    accentColor: '#C026D3',
  },
  {
    id: 'condimentos_salsas',
    title: 'Condimentos y Salsas',
    image: 'https://jumboargentina.vteximg.com.br/arquivos/ids/757719/Cacao-Amargo-Puro-En-Polvo-Sin-Tacc-Dicomere-200g-1-940318.jpg?v=638031863434670000',
    accentColor: '#B45309',
  },
  {
    id: 'aceites_grasas',
    title: 'Aceites y Grasas',
    image: 'https://jumboargentina.vteximg.com.br/arquivos/ids/865024/Aceite-De-Palta-100puro-X-250ml-Chia-Graal-1-1034850.jpg?v=638809545698600000',
    accentColor: '#65A30D',
  },
  {
    id: 'huevos',
    title: 'Huevos y Granja',
    image: 'https://jumboargentina.vteximg.com.br/arquivos/ids/188696/Huevos-Avicoper-Color-Huevos-De-Color-Avicoper-12-U-1-25041.jpg?v=636383496879400000',
    accentColor: '#F59E0B',
  },
];

export const TOP_MARKET_SECTIONS = MARKET_SECTIONS.slice(0, 6);
export const ALL_MARKET_SECTIONS = MARKET_SECTIONS;

// Caché en memoria para secciones cargadas (respuesta instantánea en 0 ms)
const CATEGORY_CACHE = new Map();

/**
 * Consulta la base de datos V2 (canonical_foods con LEFT JOIN en products)
 * para listar alimentos de una categoría específica con soporte de paginación y filtro.
 */
export async function fetchProductsByCategory(sectionId, options = {}) {
  const { page = 0, limit = 40, offset, query = '', externalSignal } = options;
  if (!sectionId) {
    const empty = [];
    empty.products = empty;
    empty.hasMore = false;
    empty.totalCount = 0;
    return empty;
  }

  // Normalización retrocompatible de IDs viejos ('frutas' -> 'frutas_verduras', 'carnes' -> 'carnes_pescados')
  let categoryKey = sectionId;
  if (sectionId === 'frutas' || sectionId === 'verduleria') categoryKey = 'frutas_verduras';
  if (sectionId === 'carnes' || sectionId === 'carniceria') categoryKey = 'carnes_pescados';
  if (sectionId === 'panaderia') categoryKey = 'panificados';
  if (sectionId === 'almacen') categoryKey = 'cereales_legumbres';
  if (sectionId === 'fitness') categoryKey = 'suplementos';

  const section = MARKET_SECTIONS.find((s) => s.id === categoryKey || s.id === sectionId);
  const targetCategory = section ? section.id : categoryKey;

  const from = offset != null ? offset : page * limit;
  const to = from + limit - 1;

  // Usar caché solo para la primera página por defecto sin búsqueda
  const cacheKey = `${targetCategory}_page${page}_${query || ''}`;
  if (from === 0 && !query && CATEGORY_CACHE.has(cacheKey)) {
    return CATEGORY_CACHE.get(cacheKey);
  }

  if (!isSupabaseConfigured || !supabase || externalSignal?.aborted) {
    const empty = [];
    empty.products = empty;
    empty.hasMore = false;
    empty.totalCount = 0;
    return empty;
  }

  try {
    let queryBuilder = supabase
      .from('canonical_foods')
      .select(
        `
          id,
          canonical_name,
          display_name,
          category,
          calories_100g,
          protein_100g,
          carbs_100g,
          fats_100g,
          macro_source,
          products (
            id,
            brand,
            image,
            status
          )
        `,
        { count: 'exact' }
      )
      .eq('category', targetCategory)
      .order('canonical_name', { ascending: true });

    if (query && query.trim()) {
      const cleanQ = query.trim();
      queryBuilder = queryBuilder.ilike('canonical_name', `%${cleanQ}%`);
    }

    const { data, count, error } = await queryBuilder.range(from, to);

    if (error || !data || !Array.isArray(data)) {
      const empty = [];
      empty.products = empty;
      empty.hasMore = false;
      empty.totalCount = 0;
      return empty;
    }

    const totalCount = count != null ? count : data.length;
    const hasMore = (from + data.length) < totalCount && data.length === limit;

    const cleanResults = data.map((item) => {
      // Priorizar el producto comercial activo con packshot disponible
      const activeProduct =
        (item.products || []).find((p) => p.status === 'active' && p.image) ||
        (item.products || []).find((p) => p.image) ||
        (item.products || [])[0];

      const calories = Math.round(Number(item.calories_100g) || 0);
      const protein = Number(Number(item.protein_100g || 0).toFixed(1));
      const carbs = Number(Number(item.carbs_100g || 0).toFixed(1));
      const fats = Number(Number(item.fats_100g || 0).toFixed(1));

      return {
        id: item.id,
        barcode: '',
        name: item.canonical_name,
        canonical_name: item.canonical_name,
        brand: activeProduct?.brand || 'Genérico',
        matched_brand: activeProduct?.brand || null,
        category: item.category || (section ? section.title : 'Alimento'),
        servingSize: '100g',
        unitName: '100g',
        unitGrams: 100,
        defaultPortionType: 'grams',
        calories,
        protein,
        carbs,
        fats,
        calories_100g: calories,
        protein_100g: protein,
        carbs_100g: carbs,
        fats_100g: fats,
        macro_source: item.macro_source || 'ai_estimated',
        image: activeProduct?.image || null,
        source: 'canonical_foods',
      };
    });

    cleanResults.products = cleanResults;
    cleanResults.hasMore = hasMore;
    cleanResults.totalCount = totalCount;
    cleanResults.nextPage = page + 1;

    if (from === 0 && !query && cleanResults.length > 0) {
      CATEGORY_CACHE.set(cacheKey, cleanResults);
    }

    return cleanResults;
  } catch (err) {
    const empty = [];
    empty.products = empty;
    empty.hasMore = false;
    empty.totalCount = 0;
    return empty;
  }
}

/**
 * Búsqueda instantánea en memoria (0 ms) para productos personalizados del usuario
 */
export function findLocalMatches(query, customProducts = []) {
  if (!customProducts || customProducts.length === 0) return [];
  const tokens = getQueryTokens(query);
  if (tokens.length === 0) {
    return customProducts;
  }
  return customProducts.filter((item) => matchesQueryTokens(item, tokens));
}

// Caché en memoria para acelerar búsquedas repetidas
const SEARCH_CACHE = new Map();
const MAX_CACHE_SIZE = 60;

/**
 * Normaliza nombres para deduplicar productos redundantes e ignorar orden de palabras
 */
export function normalizeFoodKey(brand, name) {
  const text = `${brand || ''} ${name || ''}`
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/(\d+)\s*(?:g|gr|grs|ml|cc|l|kg|kilos?)\b/gi, '$1')
    .replace(/\b(original|clasico|clasica|tradicional|fresco|fresca|de|del|la|el|con|sin|x|en|unidades?|unids?|un|paquete|pck|caja|cja|pote|botella|lata|bebida|drink)\b/g, ' ')
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  const uniqueWords = Array.from(new Set(text.split(' ').filter((w) => w.length > 1))).sort();
  return uniqueWords.join('');
}

/**
 * Busca productos por nombre en el Catálogo Zenit (Local + Supabase)
 * con deduplicación inteligente y ordenamiento por presentación.
 */
export async function searchFoodCatalog(query, externalSignal) {
  const cleanQuery = query?.trim()?.toLowerCase() || '';
  if (!cleanQuery) return [];

  const tokens = getQueryTokens(cleanQuery);
  const localMatches = [];

  // Verificar caché en memoria para respuesta en 0ms
  const cacheKey = normalizeSearchText(cleanQuery);
  if (SEARCH_CACHE.has(cacheKey)) {
    return SEARCH_CACHE.get(cacheKey);
  }

  // Registro para deduplicación: Evita mostrar repeticiones innecesarias
  const seenKeys = new Set();
  const seenBarcodes = new Set();

  localMatches.forEach((item) => {
    if (item.barcode) seenBarcodes.add(item.barcode);
    seenKeys.add(normalizeFoodKey(item.brand, item.name));
  });

  const supabaseResults = [];

  // TIER 2: Supabase RPC 'search_zenit_foods' en la nube (<100ms)
  if (isSupabaseConfigured && supabase && !externalSignal?.aborted) {
    try {
      const { data, error } = await supabase.rpc('search_zenit_foods', {
        search_term: cleanQuery,
      });

      if (!error && data && Array.isArray(data)) {
        for (const item of data) {
          const foodKey = normalizeFoodKey(item.matched_brand, item.canonical_name);
          if (seenKeys.has(foodKey)) continue;
          seenKeys.add(foodKey);

          const calories = Math.round(Number(item.calories_100g) || 0);
          const protein = Number(Number(item.protein_100g || 0).toFixed(1));
          const carbs = Number(Number(item.carbs_100g || 0).toFixed(1));
          const fats = Number(Number(item.fats_100g || 0).toFixed(1));

          supabaseResults.push({
            id: item.id,
            barcode: '',
            name: item.canonical_name,
            canonical_name: item.canonical_name,
            brand: item.matched_brand || 'Genérico',
            matched_brand: item.matched_brand || null,
            category: item.category || 'Alimento',
            servingSize: '100g',
            unitName: '100g',
            unitGrams: 100,
            defaultPortionType: 'grams',
            calories,
            protein,
            carbs,
            fats,
            calories_100g: calories,
            protein_100g: protein,
            carbs_100g: carbs,
            fats_100g: fats,
            macro_source: item.macro_source,
            image: item.image || null,
            source: 'supabase_rpc',
          });
        }
      }
    } catch (err) {
      // Continuar silenciosamente
    }
  }

  // Ordenar inteligentemente por tamaño/presentación de menor a mayor para la misma marca
  const combined = [...localMatches, ...supabaseResults].sort((a, b) => {
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

// Alias retrocompatible
export const searchOpenFoodFacts = searchFoodCatalog;

/**
 * Busca un producto exclusivamente en la base de datos propietaria Zenit (Local + Supabase)
 * Soporta variaciones de formato EAN-13, UPC-A, ceros a la izquierda y espacios.
 * CERO dependencias externas de Open Food Facts.
 */
export async function getProductByBarcode(barcode) {
  if (!barcode) return null;
  const raw = String(barcode).trim();
  const digitsOnly = raw.replace(/[^0-9]/g, '');
  const rawNoLeadingZero = digitsOnly.replace(/^0+/, '');
  const rawWithLeadingZero = digitsOnly.length === 12 ? '0' + digitsOnly : digitsOnly;
  const candidates = Array.from(new Set([raw, digitsOnly, rawNoLeadingZero, rawWithLeadingZero])).filter(Boolean);

  // 1. Revisar en productos creados por el usuario
  try {
    const customProducts = useUserStore.getState().customProducts || [];
    const customMatch = customProducts.find((p) => candidates.includes(p.barcode));
    if (customMatch) return customMatch;
  } catch (e) {
    // Si useUserStore aún no está listo
  }

  // 2. Revisar en catálogo local argentino verificado (0 ms)
  const localMatch = POPULAR_ARGENTINE_PRODUCTS.find((p) => candidates.includes(p.barcode));
  if (localMatch) {
    if (isPetFood(localMatch)) return null;
    return localMatch;
  }

  // 3. Revisar en base de datos Supabase en la nube (<100 ms)
  if (isSupabaseConfigured && supabase) {
    try {
      const { data, error } = await supabase
        .from('foods')
        .select('*')
        .in('barcode', candidates)
        .eq('status', 'approved')
        .limit(1)
        .maybeSingle();

      if (!error && data) {
        if (isPetFood(data)) return null;

        let image = data.image;
        if (data.barcode === '7798080000025' || (image && image.includes('779/808/000/0025'))) {
          image = 'https://jumboargentina.vteximg.com.br/arquivos/ids/925375/Proteina-En-Polvo-Ena-Sport-Chocolate-900gr-1-1062611.jpg';
        }

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
          image: image || null,
          source: 'supabase',
        };
      }
    } catch (e) {
      // Manejar error silenciosamente
    }
  }

  // Si no está registrado en la base oficial, retornamos null
  return null;
}

// =================================================================
// CARRUSELES CURADOS TEMÁTICOS (ALIMENTOS ESENCIALES, FITNESS, POPULARES)
// =================================================================

let CAROUSEL_CACHE = null;

const ESSENTIALS_BARCODES = [
  '7790742335500', // Leche Entera Clásica La Serenísima Botella 1 Lt
  '7792335000543', // Huevos Blancos Avicoper 30 U
  '7791120021558', // Arroz Molinos Ala Doble Carolina 1 Kg
  '7790310001016', // Avena Instantánea Tradicional Quaker
  '7790580131364', // Atún al Natural La Campagnola 170 Gr
  '7798136870859', // Yogur Estilo Griego Dahi 190 Gr
  '7790080023409', // Queso Crema Clásico Casancrem
  '2508844000005', // Banana Selección x kg
];

const FITNESS_BARCODES = [
  '7798080000025', // True Made Whey Protein ENA Sport
  '7792981070792', // Creatina Monohidrato 200 Grs Ena Sport
  '7792981070693', // Proteína Whey Sabor Chocolate Ena Sport
  '7798101201909', // Barra Proteica Gentech Peanut Butter
  '7798136870859', // Yogur Estilo Griego Dahi 190 Gr
  '7790580131364', // Atún al Natural La Campagnola 170 Gr
  '7792335000543', // Huevos Blancos Avicoper 30 U
];

const FEATURED_BARCODES = [
  '7790895012266', // Coca-Cola Sabor Original 1.25L
  '7790895007306', // Rapiditas Clásicas Bimbo
  '7790080023409', // Queso Crema Clásico Casancrem
  '77958921',      // Bombón Relleno Bon o Bon Original
  '7790310001016', // Avena Instantánea Quaker
  '7790742335500', // Leche Entera La Serenísima
  '7791120021558', // Arroz Molinos Ala Doble Carolina
];

/**
 * Obtiene los alimentos para los 3 carruseles curados en 1 sola consulta indexada a Supabase
 * Cacheado en memoria para navegación instantánea (0 ms).
 */
export async function fetchCuratedCarousels() {
  if (CAROUSEL_CACHE) {
    return CAROUSEL_CACHE;
  }

  if (!isSupabaseConfigured || !supabase) {
    return {
      essentials: [],
      fitness: [],
      featured: [],
    };
  }

  try {
    const allBarcodes = Array.from(
      new Set([...ESSENTIALS_BARCODES, ...FITNESS_BARCODES, ...FEATURED_BARCODES])
    );

    const { data, error } = await supabase
      .from('foods')
      .select(
        'barcode, name, brand, category, calories, protein, carbs, fats, default_portion_type, serving_size, unit_name, unit_grams, unit_calories, unit_protein, unit_carbs, unit_fats, image'
      )
      .in('barcode', allBarcodes)
      .eq('status', 'approved')
      .not('image', 'is', null)
      .neq('image', '');

    if (error || !data || !Array.isArray(data)) {
      return { essentials: [], fitness: [], featured: [] };
    }

    const byBarcode = new Map();
    for (const item of data) {
      let image = item.image;
      if (item.barcode === '7798080000025' || (image && image.includes('779/808/000/0025'))) {
        image = 'https://jumboargentina.vteximg.com.br/arquivos/ids/925375/Proteina-En-Polvo-Ena-Sport-Chocolate-900gr-1-1062611.jpg';
      }

      if (!image || isPlaceholderImage(image)) continue;
      byBarcode.set(item.barcode, {
        id: item.barcode,
        barcode: item.barcode,
        name: item.name,
        brand: item.brand || 'Marca registrada',
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
        image,
        source: 'supabase',
      });
    }

    const result = {
      essentials: ESSENTIALS_BARCODES.map((b) => byBarcode.get(b)).filter(Boolean),
      fitness: FITNESS_BARCODES.map((b) => byBarcode.get(b)).filter(Boolean),
      featured: FEATURED_BARCODES.map((b) => byBarcode.get(b)).filter(Boolean),
    };

    if (result.essentials.length > 0 || result.fitness.length > 0) {
      CAROUSEL_CACHE = result;
    }

    return result;
  } catch (err) {
    return { essentials: [], fitness: [], featured: [] };
  }
}


