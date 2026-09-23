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
  console.log('🧹 Iniciando limpieza manual de Base de Datos...');

  // 1. ELIMINAR DIRECTAMENTE (Inactivar en products, se volverán huérfanos y no aparecerán en UI)
  const toDelete = [
    '%Facturas surtidas%',
    '%Obleas fiambres%',
    '%Panificados Varios SD%',
    '%Sándwich FRESH%',
    '%Sándwich triple%',
    '%Nestlé alimento a base de cereales%',
    '%Cereal para bebe%',
    '%Cereal infantil%'
  ];

  for (const term of toDelete) {
    const { data: canons } = await supabase.from('canonical_foods').select('id, canonical_name').ilike('canonical_name', term);
    if (canons && canons.length > 0) {
      for (const c of canons) {
        console.log(`🚫 Desactivando productos del canónico: "${c.canonical_name}"`);
        await supabase.from('products').update({ status: 'inactive' }).eq('canonical_food_id', c.id);
      }
    }
  }

  // 2. RENOMBRAR CANÓNICOS
  const renames = [
    { from: '%Criollitos%', to: 'Tortillas' },
    { from: '%Nestum%', to: 'Alimento A Base De Cereales' },
    { from: '%Cereal infantil NUTRILON con frutas%', to: 'Cereal Nutrilon Con Frutas' }
  ];

  for (const r of renames) {
    const { data: canons } = await supabase.from('canonical_foods').select('id, canonical_name').ilike('canonical_name', r.from);
    if (canons && canons.length > 0) {
      for (const c of canons) {
        let newName = r.to;
        // Lógica específica si queremos sólo sacar la palabra "infantil"
        if (r.from.includes('Nestum')) {
           newName = c.canonical_name.replace(/infantil/gi, '').trim();
        }
        console.log(`✏️ Renombrando: "${c.canonical_name}" -> "${newName}"`);
        await supabase.from('canonical_foods').update({ canonical_name: newName, display_name: newName }).eq('id', c.id);
      }
    }
  }

  // 3. MOVER DE CATEGORÍA
  const toConservas = [
    '%Frijoles Negros Ortega%',
    '%Lentejas Cumana%',
    '%Lentejas Secas Carrefour%',
    '%Porotos colorados INALPA%',
    '%Protos de SOJA JUMBO%',
    '%Porotos de soja La esq%',
    '%Porotos en conserva JUMBO%',
    '%Porotos manteca Estrella%',
    '%Porotos negros INALPA%'
  ];
  for (const term of toConservas) {
    const { data: canons } = await supabase.from('canonical_foods').select('id, canonical_name').ilike('canonical_name', term);
    if (canons) {
      for (const c of canons) {
        console.log(`📦 Moviendo a conservas: "${c.canonical_name}"`);
        await supabase.from('canonical_foods').update({ category: 'conservas' }).eq('id', c.id);
      }
    }
  }

  // Mover a Snacks
  const toSnacks = ['%Frutas secas mix%'];
  for (const term of toSnacks) {
    const { data: canons } = await supabase.from('canonical_foods').select('id, canonical_name').ilike('canonical_name', term);
    if (canons) {
      for (const c of canons) {
        console.log(`📦 Moviendo a snacks: "${c.canonical_name}"`);
        await supabase.from('canonical_foods').update({ category: 'snacks' }).eq('id', c.id);
      }
    }
  }

  // Mover a Panadería y Masas (Premezclas, etc)
  const toPanificados = [
    '%Lemonies Exquisita%',
    '%Postre Rapido Exquisita%',
    '%Premezcla%'
  ];
  for (const term of toPanificados) {
    const { data: canons } = await supabase.from('canonical_foods').select('id, canonical_name').ilike('canonical_name', term);
    if (canons) {
      for (const c of canons) {
        console.log(`📦 Moviendo a panificados: "${c.canonical_name}"`);
        await supabase.from('canonical_foods').update({ category: 'panificados' }).eq('id', c.id);
      }
    }
  }

  console.log('✅ Limpieza finalizada.');
}

run();
