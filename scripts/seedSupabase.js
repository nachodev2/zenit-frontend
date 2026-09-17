// Polyfill de WebSocket para Node.js < 22 al usar @supabase/supabase-js
if (typeof global.WebSocket === 'undefined') {
  global.WebSocket = class DummyWebSocket {};
}

const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

// 1. Cargar variables de entorno desde .env
function loadEnv() {
  const envPath = path.resolve(__dirname, '..', '.env');
  if (!fs.existsSync(envPath)) {
    console.error('❌ No se encontró el archivo .env en la raíz del proyecto.');
    process.exit(1);
  }

  const envContent = fs.readFileSync(envPath, 'utf8');
  const env = {};
  envContent.split('\n').forEach((line) => {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#')) {
      const [key, ...values] = trimmed.split('=');
      env[key.trim()] = values.join('=').trim();
    }
  });

  return env;
}

async function seed() {
  const env = loadEnv();
  const supabaseUrl = env.EXPO_PUBLIC_SUPABASE_URL;
  const supabaseKey = env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey || supabaseUrl.includes('tu-proyecto')) {
    console.error('❌ Falta configurar EXPO_PUBLIC_SUPABASE_URL o EXPO_PUBLIC_SUPABASE_ANON_KEY en tu archivo .env');
    process.exit(1);
  }

  console.log('🚀 Conectando con Supabase:', supabaseUrl);
  const supabase = createClient(supabaseUrl, supabaseKey);

  // 2. Cargar catálogo de alimentos
  const { POPULAR_ARGENTINE_PRODUCTS } = require('../src/data/argentineProducts');
  console.log(`📦 Preparando ${POPULAR_ARGENTINE_PRODUCTS.length} alimentos curados para insertar...`);

  const rows = POPULAR_ARGENTINE_PRODUCTS.map((p) => ({
    barcode: p.barcode || null,
    name: p.name,
    brand: p.brand || null,
    category: p.category || 'Alimento',
    calories: p.calories || 0,
    protein: p.protein || 0,
    carbs: p.carbs || 0,
    fats: p.fats || 0,
    default_portion_type: p.defaultPortionType || 'unit',
    serving_size: p.servingSize || null,
    unit_name: p.unitName || null,
    unit_grams: p.unitGrams || 100,
    unit_calories: p.unitCalories != null ? p.unitCalories : null,
    unit_protein: p.unitProtein != null ? p.unitProtein : null,
    unit_carbs: p.unitCarbs != null ? p.unitCarbs : null,
    unit_fats: p.unitFats != null ? p.unitFats : null,
    image: p.image || null,
    status: 'approved',
  }));

  // 3. Upsert por lotes de 25
  const batchSize = 25;
  let insertedCount = 0;

  for (let i = 0; i < rows.length; i += batchSize) {
    const batch = rows.slice(i, i + batchSize);
    const { data, error } = await supabase
      .from('foods')
      .upsert(batch, { onConflict: 'barcode' });

    if (error) {
      console.error(`❌ Error en el lote ${i / batchSize + 1}:`, error.message);
    } else {
      insertedCount += batch.length;
      console.log(`✅ Lote ${Math.floor(i / batchSize) + 1}: ${insertedCount}/${rows.length} productos procesados.`);
    }
  }

  console.log(`\n🎉 ¡Catálogo cargado con éxito en Supabase! (${insertedCount} alimentos listos).`);
}

seed().catch((err) => {
  console.error('❌ Error general durante el seed:', err);
  process.exit(1);
});

