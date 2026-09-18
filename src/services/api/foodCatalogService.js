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
    id: 'frutas',
    title: 'Frutas y Verduras',
    image: 'https://carrefourar.vteximg.com.br/arquivos/ids/886228/2509836000003_02.jpg',
    accentColor: '#EA580C',
    categories: ['Frutas y Verduras', 'Verduras', 'Frutas', 'Frutas & Verduras'],
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
    categories: ['Lácteos y Quesos', 'Lácteos', 'Quesos', 'Leches', 'Quesos y Fiambres', 'Para untar', 'Lácteos y Frescos'],
  },
  {
    id: 'carnes',
    title: 'Carnes y Pescados',
    image: 'https://jumboargentina.vteximg.com.br/arquivos/ids/894358/Bife-De-Chorizo-1-248166.jpg',
    accentColor: '#EA580C',
    categories: ['Carnes y Pescados', 'Carnes & Proteínas', 'Carnes', 'Pescados', 'Pescados y Mariscos', 'Huevos & Granja'],
  },
  {
    id: 'bebidas',
    title: 'Bebidas',
    image: 'https://ardiaprod.vteximg.com.br/arquivos/ids/339782/Gaseosa-CocaCola-Sabor-Liviano-15-Lt-_1.jpg',
    accentColor: '#EA580C',
    categories: [
      'Bebidas',
      'Gaseosas',
      'Aguas',
      'Jugos e Isotónicas',
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
      'Golosinas y Snacks',
      'Golosinas',
      'Golosinas y Alfajores',
      'Alfajores & Dulces',
      'Dulces & Mermeladas',
      'Frutos Secos & Semillas',
      'Snacks & Copetín',
      'Snacks',
    ],
  },
  {
    id: 'congelados',
    title: 'Congelados',
    image: 'https://carrefourar.vteximg.com.br/arquivos/ids/386613/7791720025208_E01.jpg',
    accentColor: '#EA580C',
    categories: [
      'Congelados',
      'Vegetales Congelados',
      'Hamburguesas y Nuggets',
      'Pizzas Congeladas',
      'Pescados Congelados',
      'Postres y Helados',
    ],
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
 * Detecta si un producto contiene procesados, congelados, golosinas, panificados,
 * o bebidas que NO deben figurar en la categoría 'Frutas y Verduras'.
 * Garantiza que 'Frutas y Verduras' contenga exclusivamente productos frescos.
 */
export function isExcludedFromProduce(item) {
  if (!item) return false;
  const name = (item.name || '').toLowerCase();
  const brand = (item.brand || '').toLowerCase();

  // Marcas y términos de congelados (McCain, Simplot, Granja del Sol, Nutree, etc.)
  if (
    brand.includes('mc cain') ||
    brand.includes('mccain') ||
    brand.includes('simplot') ||
    name.includes('simplot') ||
    brand.includes('granja del sol') ||
    brand.includes('green life') ||
    brand.includes('karinat') ||
    brand.includes('alif agro') ||
    brand.includes('nutree') ||
    name.includes('nutree') ||
    name.includes('congelad') ||
    name.includes('supercongelad') ||
    name.includes('baston') ||
    name.includes('noisette') ||
    name.includes('air fryer') ||
    name.includes('smiles') ||
    name.includes('papas fritas') ||
    name.includes('helado') ||
    name.includes('mousse') ||
    name.includes('banana split')
  ) {
    return true;
  }

  // Golosinas, chocolates, Franui, alfajores y snacks
  if (
    name.includes('kibar') ||
    name.includes('franui') ||
    brand.includes('franui') ||
    brand.includes('rapsodia') ||
    name.includes('chocolate') ||
    name.includes('bombon') ||
    name.includes('alfajor') ||
    name.includes('turron') ||
    name.includes('oblea') ||
    name.includes('golosina') ||
    brand.includes('lays') ||
    brand.includes("lay's") ||
    brand.includes('pehuamar') ||
    brand.includes('twistos') ||
    brand.includes('doritos') ||
    brand.includes('cheetos') ||
    name.includes('snack') ||
    name.includes('chips') ||
    name.includes('barra ') ||
    name.includes('barrita')
  ) {
    return true;
  }

  // Panificados, masas, pastas y harinas
  if (
    brand.includes('bimbo') ||
    brand.includes('fargo') ||
    brand.includes('lactal') ||
    brand.includes('la salteña') ||
    brand.includes('la saltena') ||
    name.startsWith('pan ') ||
    name.includes(' pan ') ||
    name.includes('budin') ||
    name.includes('pizzeta') ||
    name.includes('gallet') ||
    name.includes('fideo') ||
    name.includes('ñoqui') ||
    name.includes('noqui') ||
    name.includes('raviol') ||
    name.includes('tapa ') ||
    name.includes('empanada') ||
    name.includes('tarta')
  ) {
    return true;
  }

  // Almacén procesado, conservas, purés instantáneos y passata
  if (
    name.includes('pure de') ||
    name.includes('puré de') ||
    name.includes('pure instantaneo') ||
    name.includes('passata') ||
    name.includes('triturado') ||
    name.includes('extracto de tomate') ||
    name.includes('pulpa de') ||
    name.includes('conserva') ||
    name.includes(' en lata') ||
    name.includes('enlatad') ||
    name.includes('pimienta') ||
    name.includes('oregano') ||
    name.includes('comino') ||
    name.includes('aji molido') ||
    brand.includes('maggi') ||
    brand.includes('knorr') ||
    brand.includes('la molisana') ||
    brand.includes('de cecco') ||
    brand.includes('barilla')
  ) {
    return true;
  }

  // Lácteos y yogures
  if (
    name.includes('yogur') ||
    name.includes('yogurt') ||
    name.includes('postre') ||
    brand.includes('dahi') ||
    brand.includes('yogurisimo') ||
    brand.includes('serenisima') ||
    brand.includes('sancor') ||
    brand.includes('milkaut')
  ) {
    return true;
  }

  // Bebidas y aperitivos
  if (
    brand.includes('gancia') ||
    brand.includes('campari') ||
    brand.includes('aperol') ||
    brand.includes('cinzano') ||
    brand.includes('branca') ||
    brand.includes('terma') ||
    name.includes('terma') ||
    brand.includes('skyy') ||
    name.includes('skyy') ||
    name.includes('vodka') ||
    name.includes('aperitivo') ||
    name.includes('gaseosa') ||
    name.includes('cerveza') ||
    name.includes('vino')
  ) {
    return true;
  }

  // Frutos secos y semillas empaquetadas
  if (
    name.includes('mix terra') ||
    name.includes('mix power') ||
    name.includes('mix patagonia') ||
    name.includes('nuez') ||
    name.includes('nueces') ||
    name.includes('almendra') ||
    name.includes('mani ') ||
    name.includes('castaña') ||
    name.includes('semilla')
  ) {
    return true;
  }

  return false;
}

/**
 * Consulta bajo demanda productos verificados de una sección en Supabase
 * Soporta paginación infinita real por páginas (page / limit / offset)
 * y devuelve los resultados junto con metadatos de paginación (hasMore, totalCount, nextPage).
 */
export async function fetchProductsByCategory(
  sectionId,
  { page = 0, offset = null, limit = 40, query = '', externalSignal } = {}
) {
  const canonicalId = sectionId === 'carniceria' ? 'carnes' : sectionId === 'verduleria' ? 'frutas' : sectionId;
  const section = MARKET_SECTIONS.find((s) => s.id === canonicalId || s.id === sectionId);
  if (!section) {
    const empty = [];
    empty.products = empty;
    empty.hasMore = false;
    empty.totalCount = 0;
    return empty;
  }

  const from = offset != null ? offset : page * limit;
  const to = from + limit - 1;

  // Usar caché solo para la primera página por defecto sin búsqueda
  const cacheKey = `${section.id}_page0`;
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
      .from('foods')
      .select(
        'barcode, name, brand, category, calories, protein, carbs, fats, default_portion_type, serving_size, unit_name, unit_grams, unit_calories, unit_protein, unit_carbs, unit_fats, image',
        { count: 'exact' }
      )
      .eq('status', 'approved')
      .not('image', 'is', null)
      .neq('image', '')
      .not('image', 'ilike', '%unsplash%')
      .not('name', 'ilike', '%perro%')
      .not('name', 'ilike', '%gato%');

    if (canonicalId === 'congelados') {
      // Congelados incluye la categoría canónica + marcas y términos clave aunque estén en otras categorías
      queryBuilder = queryBuilder.or(
        'category.eq.Congelados,brand.ilike.%mc cain%,brand.ilike.%granja del sol%,brand.ilike.%green life%,brand.ilike.%karinat%,brand.ilike.%alif agro%,name.ilike.%congelad%,name.ilike.%supercongelad%'
      );
    } else {
      queryBuilder = queryBuilder.in('category', section.categories);
    }

    if (canonicalId === 'frutas') {
      // Excluir a nivel DB los no-frescos evidentes para no vaciar la página
      queryBuilder = queryBuilder
        .not('name', 'ilike', '%congelad%')
        .not('name', 'ilike', '%baston%')
        .not('name', 'ilike', '%franui%')
        .not('name', 'ilike', '%chocolate%')
        .not('brand', 'ilike', '%mc cain%')
        .not('brand', 'ilike', '%granja del sol%');
    }

    if (query && query.trim()) {
      const cleanQ = query.trim();
      queryBuilder = queryBuilder.or(`name.ilike.%${cleanQ}%,brand.ilike.%${cleanQ}%`);
    }

    const { data, count, error } = await queryBuilder
      .range(from, to);

    if (error || !data || !Array.isArray(data)) {
      const empty = [];
      empty.products = empty;
      empty.hasMore = false;
      empty.totalCount = 0;
      return empty;
    }

    const totalCount = count != null ? count : data.length;
    // hasMore se basa en si hay más filas en la base de datos más allá de este lote
    const hasMore = (from + data.length) < totalCount && data.length === limit;

    const seenKeys = new Set();
    const seenBarcodes = new Set();
    const cleanResults = [];

    for (const item of data) {
      if (!item.image || isPlaceholderImage(item.image)) continue;
      if (isPetFood(item)) continue;

      // Sanitización estricta por categoría
      if (canonicalId === 'frutas' && isExcludedFromProduce(item)) continue;

      let image = item.image;
      if (item.barcode === '7798080000025' || (image && image.includes('779/808/000/0025'))) {
        image = 'https://jumboargentina.vteximg.com.br/arquivos/ids/925375/Proteina-En-Polvo-Ena-Sport-Chocolate-900gr-1-1062611.jpg';
      }

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
        image,
        source: 'supabase',
      });
    }

    // Enriquecer el array con metadatos de paginación para máxima compatibilidad
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
          // Descartar alimentos para mascotas
          if (isPetFood(item)) continue;

          let image = item.image;
          if (item.barcode === '7798080000025' || (image && image.includes('779/808/000/0025'))) {
            image = 'https://jumboargentina.vteximg.com.br/arquivos/ids/925375/Proteina-En-Polvo-Ena-Sport-Chocolate-900gr-1-1062611.jpg';
          }

          // Descartar automáticamente productos sin imagen o con placeholder de cámara
          if (!image || isPlaceholderImage(image)) continue;

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
            image,
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


