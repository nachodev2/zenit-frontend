const fs = require('fs');
const path = require('path');

const SUPABASE_URL = 'https://arozpkdzzzfyeqapnnpe.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFyb3pwa2R6enpmeWVxYXBubnBlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODk1ODA5OTksImV4cCI6MjEwNTE1Njk5OX0.nNsaDOoyyTTk-HdqAwwFS9kFNc2LR8W-8DqLbytPQbw';

function determineTargetCategory(item) {
  const brand = (item.brand || '').toLowerCase().trim();
  const name = (item.name || '').toLowerCase().trim();
  const cat = item.category || '';
  const full = (brand + ' ' + name).toLowerCase();

  // 0. Artículos no comestibles a ELIMINAR
  if (
    full.includes('carbón vegetal') || full.includes('carbon vegetal') ||
    full.includes('carbocor') || full.includes('escobilla') ||
    full.includes('lavandina') || full.includes('detergente') ||
    full.includes('shampoo') || full.includes('dentifrico')
  ) {
    return 'DELETE';
  }

  // 1. Congelados (prioridad alta para no mezclar con verduras/carnes)
  if (
    full.includes('congelad') || full.includes('supercongelad') ||
    full.includes('air fryer') || full.includes('noisette') || full.includes('smiles') ||
    full.includes('papas baston') || full.includes('papas bastón') || full.includes('papas corte') ||
    full.includes('papas tradicionales') || full.includes('papas españolas') || full.includes('papas gourmet') ||
    full.includes('croqueta') || full.includes('medallon') || full.includes('medallón') ||
    full.includes('bocaditos de') || full.includes('nuggets') || full.includes('formitas') ||
    full.includes('rebozadas') || full.includes('milanesa de soja') || full.includes('empanada') ||
    full.includes('pizza congelada') || full.includes('burrito') || full.includes('chipa congelado') ||
    full.includes('waffles congelados') ||
    brand.includes('mc cain') || brand.includes('granja del sol') || brand.includes('green life') ||
    brand.includes('karinat') || brand.includes('alif agro')
  ) {
    return 'Congelados';
  }

  // 2. Golosinas y Snacks
  if (
    full.includes('franui') || full.includes('chocolate') || full.includes('bombon') || full.includes('bombón') ||
    full.includes('alfajor') || full.includes('turron') || full.includes('turrón') || full.includes('caramelo') ||
    full.includes('gomita') || full.includes('chicle') || full.includes('obleas') || full.includes('confites') ||
    full.includes('barra de cereal') || full.includes('chips de banana') || full.includes('mermelada') ||
    full.includes('dulce de batata') || full.includes('dulce de membrillo') || full.includes('dulce orgánico') ||
    full.includes('lays') || full.includes('lay\'s') || full.includes('doritos') || full.includes('cheetos') ||
    full.includes('chizito') || full.includes('palitos salados') || full.includes('pringles') || full.includes('snack') ||
    full.includes('pochoclo') || full.includes('maíz inflado') || full.includes('maiz inflado') ||
    full.includes('nuez') || full.includes('nueces') || full.includes('almendra') || full.includes('castaña') ||
    full.includes('mani') || full.includes('maní') || full.includes('frutos secos') || full.includes('pasas de uva') ||
    brand.includes('arcor') || brand.includes('bon o bon')
  ) {
    return 'Golosinas y Snacks';
  }

  // 3. Panadería
  if (
    full.includes('pan de papa') || full.includes('pan para pancho') || full.includes('pan pancho') ||
    full.includes('pan para hamburguesa') || full.includes('pan hamburguesa') || full.includes('pan de molde') ||
    full.includes('pan lactal') || full.includes('pan blanco') || full.includes('pan integral') ||
    full.includes('pan pebete') || full.includes('tostadas') || full.includes('grisines') || full.includes('talitas') ||
    full.includes('budin') || full.includes('budín') || full.includes('factura') || full.includes('medialunas') ||
    full.includes('galletitas') || full.includes('galletas') || full.includes('crackers') || full.includes('pepitas') ||
    full.includes('prepizza') || full.includes('pizzetas') || full.includes('tarta de pure de manzana') || full.includes('vainillas') ||
    brand.includes('artesano') || brand.includes('fargo') || brand.includes('bagley') || brand.includes('don satur')
  ) {
    return 'Panadería';
  }

  // 4. Lácteos y Quesos
  if (
    full.includes('yogur') || full.includes('yogurt') || full.includes('leche') || full.includes('queso') ||
    full.includes('crema de leche') || full.includes('casancrem') || full.includes('manteca') ||
    full.includes('ricota') || full.includes('mozzarella') || full.includes('muzzarella') ||
    full.includes('chocolatada') || full.includes('cindor') || brand.includes('la serenisima') ||
    brand.includes('la serenísima') || brand.includes('ilolay') || brand.includes('sancor') ||
    brand.includes('dahi') || brand.includes('emmi') || brand.includes('yogurisimo')
  ) {
    return 'Lácteos y Quesos';
  }

  // 5. Bebidas
  if (
    full.includes('vino') || full.includes('cerveza') || full.includes('fernet') || full.includes('aperitivo') ||
    full.includes('gancia') || full.includes('campari') || full.includes('aperol') || full.includes('gaseosa') ||
    full.includes('coca-cola') || full.includes('coca cola') || full.includes('sprite') || full.includes('7up') ||
    full.includes('fanta') || full.includes('crush') || full.includes('agua ') || full.includes('aguas') ||
    full.includes('aquarius') || full.includes('levite') || full.includes('levité') || full.includes('limonada') ||
    full.includes('jugo') || full.includes('citric') || full.includes('cepita') || full.includes('baggio') ||
    full.includes('gatorade') || full.includes('powerade') || full.includes('monster') || full.includes('red bull') || full.includes('speed')
  ) {
    return 'Bebidas';
  }

  // 6. Almacén (pastas, passatas, conservas, purés, aderezos, aceites)
  if (
    full.includes('fideo') || full.includes('tallarin') || full.includes('fusilli') || full.includes('pasta') ||
    full.includes('ñoqui') || full.includes('raviol') || full.includes('canelon') || full.includes('arroz') ||
    full.includes('polenta') || full.includes('lenteja') || full.includes('garbanzo') || full.includes('arveja') ||
    full.includes('salsa de tomate') || full.includes('pure de tomate') || full.includes('puré de tomate') ||
    full.includes('tomate triturado') || full.includes('passata') || full.includes('pure de papa') || full.includes('puré de papa') ||
    full.includes('aceite') || full.includes('vinagre') || full.includes('mayonesa') || full.includes('ketchup') ||
    full.includes('mostaza') || full.includes('harina') || full.includes('rebozador') || full.includes('pan rallado') ||
    full.includes('oregano') || full.includes('orégano') || full.includes('pimenton') || full.includes('pimentón') || full.includes('condimento') ||
    brand.includes('la molisana') || brand.includes('maggi') || brand.includes('barilla') || brand.includes('molinos ala')
  ) {
    return 'Almacén';
  }

  // 7. Carnes y Pescados
  if (
    full.includes('morcilla') || full.includes('chorizo') || full.includes('salchicha') ||
    full.includes('bife') || full.includes('asado') || full.includes('vacio') || full.includes('vacío') ||
    full.includes('matambre') || full.includes('entraña') || full.includes('lomo') || full.includes('peceto') ||
    full.includes('pollo') || full.includes('pechuga') || full.includes('pata muslo') || full.includes('cerdo') ||
    full.includes('bondiola') || full.includes('jamón') || full.includes('jamon') || full.includes('salame') ||
    full.includes('salmon') || full.includes('salmón') || full.includes('merluza') || full.includes('atun') || full.includes('atún') ||
    full.includes('huevo') || full.includes('huevos') || full.includes('maple')
  ) {
    return 'Carnes y Pescados';
  }

  // 8. Suplementos
  if (
    full.includes('whey') || full.includes('proteina') || full.includes('proteína') ||
    full.includes('creatina') || full.includes('bcaa') || full.includes('colageno') ||
    full.includes('barra proteica') || brand.includes('ena sport') || brand.includes('gentech') ||
    brand.includes('star nutrition') || brand.includes('entrenuts') || brand.includes('integra')
  ) {
    return 'Suplementos';
  }

  // 9. Si era Frutas o Verduras y no coincidió con nada procesado -> es fruta/verdura fresca pura
  if (
    ['Verduras', 'Frutas', 'Frutas y Verduras', 'Frutas & Verduras'].includes(cat) ||
    cat.includes('Fruta') || cat.includes('Verdura')
  ) {
    return 'Frutas y Verduras';
  }

  return cat;
}

async function generateSql() {
  let all = [];
  for (let from = 0; from < 5000; from += 1000) {
    const res = await fetch(SUPABASE_URL + '/rest/v1/foods?select=barcode,name,brand,category', {
      headers: {
        apikey: SUPABASE_KEY,
        Authorization: 'Bearer ' + SUPABASE_KEY,
        Range: from + '-' + (from + 999)
      }
    });
    const data = await res.json();
    if (!data || data.length === 0) break;
    all = all.concat(data);
  }

  const deletes = [];
  const updates = {};

  for (const item of all) {
    const target = determineTargetCategory(item);
    if (target === 'DELETE') {
      deletes.push(item.barcode);
    } else if (target !== item.category) {
      if (!updates[target]) updates[target] = [];
      updates[target].push(item.barcode);
    }
  }

  console.log('Total catalog analyzed:', all.length);
  console.log('Deletes:', deletes.length);
  for (const cat in updates) {
    console.log('Update to "' + cat + '": ' + updates[cat].length + ' items');
  }

  let sql = '-- =================================================================\n';
  sql += '-- ZENIT: 05_RECATEGORIZE_AND_CLEAN_CATALOG.SQL\n';
  sql += '-- 1. Elimina articulos no comestibles (carbon, escobilla, etc.)\n';
  sql += '-- 2. Reubica productos mezclados en sus categorias reales\n';
  sql += '--    (Congelados, Panaderia, Golosinas, Almacen, Frutas y Verduras)\n';
  sql += '-- =================================================================\n\n';

  if (deletes.length > 0) {
    sql += '-- 1. Eliminar articulos no comestibles\n';
    sql += 'DELETE FROM public.foods WHERE barcode IN (\n';
    sql += deletes.map(b => "  '" + b + "'").join(',\n') + '\n);\n\n';
  }

  sql += '-- 2. Reubicar productos en sus categorias canónicas\n';
  for (const target in updates) {
    const barcodes = updates[target];
    sql += '-- Mover a "' + target + '" (' + barcodes.length + ' productos)\n';
    sql += "UPDATE public.foods SET category = '" + target + "' WHERE barcode IN (\n";
    sql += barcodes.map(b => "  '" + b + "'").join(',\n') + '\n);\n\n';
  }

  fs.writeFileSync(path.resolve(__dirname, '05_recategorize_and_clean_catalog.sql'), sql, 'utf8');
  console.log('File successfully generated at scripts/05_recategorize_and_clean_catalog.sql');
}

generateSql();

