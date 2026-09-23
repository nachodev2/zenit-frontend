if (typeof global.WebSocket === 'undefined') {
  global.WebSocket = class DummyWebSocket {};
}

const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.EXPO_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY,
  { auth: { persistSession: false } }
);

async function run() {
  console.log('🧹 Iniciando segunda pasada de limpieza manual (Casos exactos)...');

  // Mover a Conservas
  const toConservas = [
    'Porotos Colorados',
    'Porotos De Soja',
    'Porotos de Soja',
    'Porotos En Conserva',
    'Porotos Manteca',
    'Porotos Negros',
    'Frijoles Negros'
  ];

  for (const term of toConservas) {
    const { data: canons } = await supabase.from('canonical_foods').select('id, canonical_name').eq('canonical_name', term);
    if (canons) {
      for (const c of canons) {
        console.log(`📦 Moviendo a conservas: "${c.canonical_name}"`);
        await supabase.from('canonical_foods').update({ category: 'conservas' }).eq('id', c.id);
      }
    }
  }

  // Mover a Panificados
  const toPanificados = [
    'Mezcla Para Preparar Lemonies',
    'Postre Rápido'
  ];

  for (const term of toPanificados) {
    const { data: canons } = await supabase.from('canonical_foods').select('id, canonical_name').eq('canonical_name', term);
    if (canons) {
      for (const c of canons) {
        console.log(`📦 Moviendo a panificados: "${c.canonical_name}"`);
        await supabase.from('canonical_foods').update({ category: 'panificados' }).eq('id', c.id);
      }
    }
  }

  console.log('✅ Segunda limpieza finalizada.');
}

run();
