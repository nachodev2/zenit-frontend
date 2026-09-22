// =================================================================
// ZENIT - V2 RAW CRAWLER (JUMBO & CARREFOUR)
// Extrae data en crudo de la API VTEX y la inserta en raw_scrapes
// =================================================================

// Polyfill de WebSocket para Node.js < 22
if (typeof global.WebSocket === 'undefined') {
  global.WebSocket = class DummyWebSocket {};
}

const path = require('path');
const https = require('https');
const { createClient } = require('@supabase/supabase-js');

require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Faltan las variables de Supabase en el .env');
  process.exit(1);
}

if (supabaseKey === process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY) {
  console.warn('⚠️ ATENCIÓN: Estás usando la ANON_KEY. Los inserts pueden ser bloqueados por RLS. Asegurate de tener SUPABASE_SERVICE_ROLE_KEY en el .env.');
}

const supabase = createClient(supabaseUrl, supabaseKey, {
    auth: { persistSession: false }
});

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
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

async function run() {
  console.log('🛒 Iniciando Cosecha RAW de Jumbo & Carrefour...');

  const SOURCES = [
    {
      name: 'jumbo',
      baseUrl: 'https://www.jumbo.com.ar',
      queries: [
        // Categorías macro para catálogo amplio
        'almacen', 'lacteos', 'bebidas', 'carnes', 'verduras', 'frutas',
        'panaderia', 'congelados', 'quesos', 'fiambres', 'desayuno', 'merienda', 'postres',
        // Nichos específicos y productos ancla
        'proteina', 'ena sport', 'whey protein', 'barra proteica',
        'notco', 'silk', 'leche vegetal', 'mantequilla de mani',
        'organico', 'banana', 'pechuga de pollo', 'huevos', 'palta',
      ],
    },
    {
      name: 'carrefour',
      baseUrl: 'https://www.carrefour.com.ar',
      queries: [
        // Categorías macro para catálogo amplio
        'almacen', 'lacteos', 'bebidas', 'carnes', 'verduras', 'frutas',
        'panaderia', 'congelados', 'quesos', 'fiambres', 'desayuno', 'merienda', 'postres',
        // Nichos específicos y productos ancla
        'carrefour bio', 'carrefour sin gluten', 'proteina',
        'yogur griego', 'quinoa', 'arroz integral', 'frutos secos',
      ],
    },
  ];

  const harvestedRaw = [];
  const seenIds = new Set(); 

  for (const source of SOURCES) {
    console.log(`\n📦 Extrayendo data cruda de ${source.name.toUpperCase()}...`);

    for (const query of source.queries) {
      let offset = 0;
      const PAGE_SIZE = 50;
      let queryAdded = 0;

      while (true) {
        const from = offset;
        const to = offset + PAGE_SIZE - 1;

        console.log(`  Buscando "${query}" (offset: ${offset})...`);
        const items = await fetchVtexSearch(source.baseUrl, query, from, to);

        if (!items || items.length === 0) {
          break;
        }

        let added = 0;
        for (const item of items) {
          if (!item || !item.productId) continue;
          if (seenIds.has(item.productId)) continue;
          seenIds.add(item.productId);

          const categoryPath = (item.categories && item.categories.length > 0) 
              ? item.categories[0] 
              : null;

          const sourceUrl = item.linkText ? `${source.baseUrl}/${item.linkText}/p` : null;

          harvestedRaw.push({
            source: source.name,
            source_url: sourceUrl,
            source_category_path: categoryPath,
            raw_json: item, 
            status: 'pending'
          });

          added++;
        }

        queryAdded += added;
        console.log(`    +${added} nuevos añadidos (+${items.length} recibidos en página)`);

        offset += PAGE_SIZE;
        await sleep(300);
      }

      console.log(`  ✔️ Fin de búsqueda para "${query}": ${queryAdded} productos agregados.`);
    }
  }

  console.log(`\n🎉 Cosecha finalizada: ${harvestedRaw.length} productos crudos listos.`);

  if (harvestedRaw.length === 0) {
    console.log('✅ No hay nada para insertar.');
    return;
  }

  console.log(`💾 Insertando ${harvestedRaw.length} registros en Supabase (raw_scrapes)...`);
  
  // Inserción en bloques de 500 para evitar superar límites de payload de Supabase
  const BATCH_SIZE = 500;
  for (let i = 0; i < harvestedRaw.length; i += BATCH_SIZE) {
    const batch = harvestedRaw.slice(i, i + BATCH_SIZE);
    const { error } = await supabase.from('raw_scrapes').insert(batch);

    if (error) {
      throw new Error(`❌ Error fatal insertando lote en Supabase: ${error.message}`);
    }
    console.log(`  💾 Lote guardado: ${Math.min(i + BATCH_SIZE, harvestedRaw.length)}/${harvestedRaw.length}`);
  }

  console.log('✅ Inserción completada con éxito.');
}

run().catch(err => {
  console.error('❌ Error global de ejecución:', err.message);
  process.exit(1);
});
