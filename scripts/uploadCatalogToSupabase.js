// =================================================================
// ZENIT - SCRIPT DE CARGA AUTOMATIZADA DIRECTA A SUPABASE
// Sube los 4.075 productos verificados a Supabase en lotes de 250
// evitando el límite de tamaño del SQL Editor web.
// =================================================================

const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

// Leer variables de entorno de .env si existe
const envPath = path.resolve('.env');
let supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || '';
let supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '';

if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  envContent.split('\n').forEach((line) => {
    const [k, ...v] = line.split('=');
    if (k && v) {
      const val = v.join('=').trim().replace(/(^['"]|['"]$)/g, '');
      if (k.trim() === 'EXPO_PUBLIC_SUPABASE_URL') supabaseUrl = val;
      if (k.trim() === 'SUPABASE_SERVICE_ROLE_KEY' || k.trim() === 'EXPO_PUBLIC_SUPABASE_ANON_KEY') supabaseKey = val;
    }
  });
}

if (!supabaseUrl || !supabaseKey) {
  console.log('⚠️ Faltan las credenciales de Supabase en tu archivo .env o variables de entorno:');
  console.log('   EXPO_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co');
  console.log('   EXPO_PUBLIC_SUPABASE_ANON_KEY=tu-anon-key\n');
  console.log('💡 Tip: Podés usar los archivos SQL divididos en la carpeta "scripts/seeds/" para pegarlos en el SQL Editor de Supabase:');
  console.log('   1. scripts/01_create_foods_table.sql (Crea la tabla e índices)');
  console.log('   2. scripts/seeds/seed_part1.sql (1.050 productos)');
  console.log('   3. scripts/seeds/seed_part2.sql (1.050 productos)');
  console.log('   4. scripts/seeds/seed_part3.sql (1.050 productos)');
  console.log('   5. scripts/seeds/seed_part4.sql (925 productos)');
  process.exit(0);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function uploadDirectly() {
  console.log(`🚀 Conectando a Supabase: ${supabaseUrl}`);

  const masterSql = fs.readFileSync(path.resolve(__dirname, 'zenit_master_foods_seed.sql'), 'utf8');
  const lines = masterSql.split('\n');
  const tuples = lines.filter((l) => l.trim().startsWith('('));

  console.log(`📦 Procesando ${tuples.length} alimentos verificados...`);

  const products = [];
  for (const t of tuples) {
    const match = t.match(
      /\('([^']*)',\s*'([^']*)',\s*'([^']*)',\s*'([^']*)',\s*([0-9.]+),\s*([0-9.]+),\s*([0-9.]+),\s*([0-9.]+),\s*'([^']*)',\s*'([^']*)',\s*'([^']*)',\s*([0-9.]+),\s*([0-9.]+),\s*([0-9.]+),\s*([0-9.]+),\s*([0-9.]+),\s*'([^']*)'/
    );
    if (match) {
      products.push({
        barcode: match[1],
        name: match[2],
        brand: match[3],
        category: match[4],
        calories: Number(match[5]),
        protein: Number(match[6]),
        carbs: Number(match[7]),
        fats: Number(match[8]),
        default_portion_type: match[9],
        serving_size: match[10],
        unit_name: match[11],
        unit_grams: Number(match[12]),
        unit_calories: Number(match[13]),
        unit_protein: Number(match[14]),
        unit_carbs: Number(match[15]),
        unit_fats: Number(match[16]),
        image: match[17],
        status: 'approved',
      });
    }
  }

  const BATCH_SIZE = 250;
  for (let i = 0; i < products.length; i += BATCH_SIZE) {
    const batch = products.slice(i, i + BATCH_SIZE);
    const { error } = await supabase.from('foods').upsert(batch, { onConflict: 'barcode' });
    if (error) {
      console.error(`❌ Error en lote ${i / BATCH_SIZE + 1}:`, error.message);
    } else {
      console.log(`✅ Lote ${i / BATCH_SIZE + 1}/${Math.ceil(products.length / BATCH_SIZE)} insertado (${Math.min(i + BATCH_SIZE, products.length)}/${products.length})`);
    }
  }

  console.log('\n🎉 ¡Carga completa finalizada con éxito en Supabase!');
}

uploadDirectly();

