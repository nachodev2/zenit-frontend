const fs = require('fs');

const envFile = fs.readFileSync('.env', 'utf8');
let url = '', key = '';
for (const line of envFile.split('\n')) {
  if (line.startsWith('EXPO_PUBLIC_SUPABASE_URL=')) url = line.split('=')[1].trim();
  if (line.startsWith('EXPO_PUBLIC_SUPABASE_ANON_KEY=')) key = line.split('=')[1].trim();
}

async function fetchAll() {
  let all = [];
  let from = 0;
  while (true) {
    const res = await fetch(url + '/rest/v1/foods?select=barcode,name,brand,category&offset=' + from + '&limit=1000', {
      headers: { apikey: key, Authorization: 'Bearer ' + key }
    });
    const batch = await res.json();
    if (!batch || batch.length === 0) break;
    all.push(...batch);
    if (batch.length < 1000) break;
    from += 1000;
  }
  return all;
}

fetchAll().then(items => {
  fs.writeFileSync('scripts/catalog_current.json', JSON.stringify(items, null, 2));

  // 1. Almacén containing 'pan'
  console.log('\n--- 1. PAN EN ALMACEN ---');
  const almacenPan = items.filter(it => it.category === 'Almacén' && (it.name || '').toLowerCase().includes('pan'));
  almacenPan.forEach(p => console.log('  ', p.barcode, '|', p.name));

  // 2. Lácteos weird
  console.log('\n--- 2. EMPANADAS / RAVIOLES / BARRAS / ÑOQUIS EN LACTEOS ---');
  const lacteosWeird = items.filter(it => it.category === 'Lácteos y Quesos' && 
    ['empanada', 'raviol', 'barra', 'ñoqui', 'noqui'].some(w => (it.name || '').toLowerCase().includes(w)));
  lacteosWeird.forEach(p => console.log('  ', p.barcode, '|', p.name));

  // 3. Golosinas weird
  console.log('\n--- 3. EN GOLOSINAS (leche almendras, mermelada, batata, mani, cookies, arroz con leche, silk, postres ser, tarta) ---');
  const goloWeird = items.filter(it => it.category === 'Golosinas y Snacks' && 
    ['leche', 'almendra', 'mermelada', 'batata', 'mani', 'maní', 'cookie', 'arroz con leche', 'silk', 'postre', 'ser', 'tarta'].some(w => (it.name || '').toLowerCase().includes(w) || (it.brand || '').toLowerCase().includes(w)));
  goloWeird.forEach(p => console.log('  ', p.barcode, '|', p.name));

  // 4. Congelados weird
  console.log('\n--- 4. EN CONGELADOS (achuras, chinchulin, carnes, tapas, pescados no rebozados) ---');
  const congWeird = items.filter(it => it.category === 'Congelados' && 
    ['achura', 'chinchulin', 'tapa', 'pescado', 'marisco', 'salmon', 'salmón', 'merluza', 'langostino', 'calamar', 'mejillon', 'mejillón', 'carne', 'asado', 'bife', 'vacío', 'vacio', 'peceto', 'pollo', 'cerdo'].some(w => (it.name || '').toLowerCase().includes(w)));
  congWeird.forEach(p => console.log('  ', p.barcode, '|', p.name));

  // 5. Suplementos weird
  console.log('\n--- 5. EN SUPLEMENTOS (pan masa madre / etc) ---');
  const supleWeird = items.filter(it => it.category === 'Suplementos' && (it.name || '').toLowerCase().includes('pan'));
  supleWeird.forEach(p => console.log('  ', p.barcode, '|', p.name));
});
