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
    id: 'frutas',
    title: 'Frutas y Verduras',
    image: 'https://carrefourar.vteximg.com.br/arquivos/ids/886228/2509836000003_02.jpg',
    accentColor: '#EA580C',
    categories: ['Verduras', 'Frutas', 'Frutas y Verduras', 'Frutas & Verduras'],
  },
  {
    id: 'almacen',
    title: 'Almacén',
    image: 'https://ardiaprod.vteximg.com.br/arquivos/ids/373038/Arroz-Molinos-Ala-Doble-Carolina-1-Kg-_1.jpg',
    accentColor: '#EA580C',
    categories: [
      'Almacén',
      'Pastas & Arroces',
      'Pastas y arroces',
      'Pastas Frescas',
      'Pastas & Masas',
      'Pastas & Arroz',
      'Pastas',
      'Legumbres & Granos',
      'Conservas',
      'Aceites y Aderezos',
      'Aceites',
      'Aderezos',
      'Condimentos',
    ],
  },
  {
    id: 'lacteos',
    title: 'Lácteos y Quesos',
    image: 'https://jumboargentina.vteximg.com.br/arquivos/ids/901212/7791337061385_1.jpg',
    accentColor: '#EA580C',
    categories: ['Lácteos', 'Quesos', 'Leches', 'Quesos y Fiambres', 'Para untar', 'Lácteos y Frescos'],
  },
  {
    id: 'carnes',
    title: 'Carnes y Pescados',
    image: 'https://jumboargentina.vteximg.com.br/arquivos/ids/894358/Bife-De-Chorizo-1-248166.jpg',
    accentColor: '#EA580C',
    categories: ['Carnes & Proteínas', 'Carnes', 'Pescados', 'Pescados y Mariscos', 'Carnes y Pescados', 'Huevos & Granja'],
  },
  {
    id: 'bebidas',
    title: 'Bebidas',
    image: 'https://ardiaprod.vteximg.com.br/arquivos/ids/339782/Gaseosa-CocaCola-Sabor-Liviano-15-Lt-_1.jpg',
    accentColor: '#EA580C',
    categories: [
      'Gaseosas',
      'Aguas',
      'Jugos e Isotónicas',
      'Bebidas',
      'Isotónicas',
      'Bebidas Vegetales',
      'Energizantes',
      'Cervezas',
      'Vinos',
    ],
  },
  {
    id: 'panaderia',
    title: 'Panadería',
    image: 'https://ardiaprod.vteximg.com.br/arquivos/ids/366731/Pan-de-Hamburguesa-Bimbo-Artesano-4-Ud-_1.jpg',
    accentColor: '#EA580C',
    categories: [
      'Panadería',
      'Panadería y Pastelería',
      'Panificados',
      'Panificados & Galletitas',
      'Galletitas',
      'Galletitas y Cereales',
    ],
  },
  // 3 CATEGORÍAS EXPANDIBLES ("Más categorías  ⌵")
  {
    id: 'snacks',
    title: 'Golosinas y Snacks',
    image: 'https://ardiaprod.vteximg.com.br/arquivos/ids/307588/Bombon-Relleno-Bon-o-Bon-Original-15-Gr-_1.jpg',
    accentColor: '#EA580C',
    categories: [
      'Golosinas',
      'Golosinas y Alfajores',
      'Alfajores & Dulces',
      'Dulces & Mermeladas',
      'Frutos Secos & Semillas',
      'Snacks & Copetín',
    ],
  },
  {
    id: 'congelados',
    title: 'Congelados',
    image: 'https://carrefourar.vteximg.com.br/arquivos/ids/386613/7791720025208_E01.jpg',
    accentColor: '#EA580C',
    categories: ['Congelados'],
  },
  {
    id: 'fitness',
    title: 'Suplementos',
    image: 'https://jumboargentina.vteximg.com.br/arquivos/ids/925375/Proteina-En-Polvo-Ena-Sport-Chocolate-900gr-1-1062611.jpg',
    accentColor: '#EA580C',
    categories: ['Suplementos', 'Fitness & Suplementos', 'Cereales & Granos', 'Cereales & Avena'],
  },
];

export const TOP_MARKET_SECTIONS = MARKET_SECTIONS.slice(0, 6);
export const ALL_MARKET_SECTIONS = MARKET_SECTIONS;

// Caché en memoria para secciones cargadas (respuesta instantánea en 0 ms)
const CATEGORY_CACHE = new Map();

/**
 * Consulta bajo demanda productos verificados de una sección en Supabase
 */
export async function fetchProductsByCategory(sectionId, { limit = 50, externalSignal } = {}) {
  const canonicalId = sectionId === 'carniceria' ? 'carnes' : sectionId === 'verduleria' ? 'frutas' : sectionId;
  const section = MARKET_SECTIONS.find((s) => s.id === canonicalId || s.id === sectionId);
  if (!section) return [];

  if (CATEGORY_CACHE.has(section.id)) {
    return CATEGORY_CACHE.get(section.id);
  }

  if (!isSupabaseConfigured || !supabase || externalSignal?.aborted) {
    return [];
  }

  try {
    const { data, error } = await supabase
      .from('foods')
      .select(
        'barcode, name, brand, category, calories, protein, carbs, fats, default_portion_type, serving_size, unit_name, unit_grams, unit_calories, unit_protein, unit_carbs, unit_fats, image'
      )
      .in('category', section.categories)
      .eq('status', 'approved')
      .not('image', 'is', null)
      .neq('image', '')
      .not('image', 'ilike', '%unsplash%')
      .not('name', 'ilike', '%perro%')
      .not('name', 'ilike', '%gato%')
      .limit(limit);

    if (error || !data || !Array.isArray(data)) {
      return [];
    }

    const seenKeys = new Set();
    const seenBarcodes = new Set();
    const cleanResults = [];

    for (const item of data) {
      if (!item.image || isPlaceholderImage(item.image)) continue;

      const foodKey = normalizeFoodKey(item.brand, item.name);
      if (seenKeys.has(foodKey)) continue;
      if (item.barcode && seenBarcodes.has(item.barcode)) continue;

      seenKeys.add(foodKey);
      if (item.barcode) seenBarcodes.add(item.barcode);

      cleanResults.push({
        id: item.id || item.barcode,
        barcode: item.barcode || '',
        name: item.name,
        brand: item.brand || 'Marca registrada',
        category: item.category || section.title,
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

    if (cleanResults.length > 0) {
      CATEGORY_CACHE.set(sectionId, cleanResults);
    }

    return cleanResults;
  } catch (err) {
    return [];
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

  // TIER 2: Consultar Supabase en la nube (<100ms) si está configurado
  if (isSupabaseConfigured && supabase && !externalSignal?.aborted) {
    try {
      let queryBuilder = supabase
        .from('foods')
        .select(
          'barcode, name, brand, category, calories, protein, carbs, fats, default_portion_type, serving_size, unit_name, unit_grams, unit_calories, unit_protein, unit_carbs, unit_fats, image'
        )
        .eq('status', 'approved')
        .not('image', 'is', null)
        .neq('image', '')
        .not('image', 'ilike', '%unsplash%');

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
          // Descartar automáticamente productos sin imagen o con placeholder de cámara
          if (!item.image || isPlaceholderImage(item.image)) continue;

          // Filtrar por límite de palabras (ej: evita repollo al buscar pollo)
          if (!matchesQueryTokens(item, tokens)) continue;

          const foodKey = normalizeFoodKey(item.brand, item.name);
          if (seenKeys.has(foodKey)) continue;
          if (item.barcode && seenBarcodes.has(item.barcode)) continue;

          seenKeys.add(foodKey);
          if (item.barcode) seenBarcodes.add(item.barcode);

          supabaseResults.push({
            id: item.id || item.barcode,
            barcode: item.barcode || '',
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
            image: item.image || null,
            source: 'supabase',
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
 * CERO dependencias externas de Open Food Facts.
 */
export async function getProductByBarcode(barcode) {
  if (!barcode) return null;

  // 1. Revisar en productos creados por el usuario
  try {
    const customProducts = useUserStore.getState().customProducts || [];
    const customMatch = customProducts.find((p) => p.barcode === barcode);
    if (customMatch) return customMatch;
  } catch (e) {
    // Si useUserStore aún no está listo
  }

  // 2. Revisar en catálogo local argentino verificado (0 ms)
  const localMatch = POPULAR_ARGENTINE_PRODUCTS.find((p) => p.barcode === barcode);
  if (localMatch) return localMatch;

  // 3. Revisar en base de datos Supabase en la nube (<100 ms)
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
      if (!item.image || isPlaceholderImage(item.image)) continue;
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
        image: item.image,
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


