const fs = require('fs');

const catalog = JSON.parse(fs.readFileSync('scripts/catalog_snapshot.json', 'utf8'));

const toDelete = [];
const updates = {
  'Suplementos': [],
  'Congelados': [],
  'Golosinas y Snacks': [],
  'Panadería': [],
  'Almacén': [],
  'Lácteos y Quesos': [],
  'Bebidas': [],
  'Carnes y Pescados': [],
  'Frutas y Verduras': [],
};

for (const item of catalog) {
  const name = (item.name || '').toLowerCase().trim();
  const brand = (item.brand || '').toLowerCase().trim();
  const oldCat = item.category;

  // =================================================================
  // 1. NON-FOOD PURGE (ELIMINAR DEFINITIVAMENTE - "SACAR URGENTE")
  // =================================================================
  if (
    // Cuadernos / Hojas / Resmas
    name.includes('cuaderno') || name.includes('repuesto ledesma') || name.includes('resma de hoja') ||
    // Changos (carritos)
    (name.startsWith('chango ') && !name.includes('azúcar') && !name.includes('azucar') && !name.includes('canela')) ||
    // Naftalina
    name.includes('naftalina') ||
    // Vajilla Neo Silk
    name.includes('neo silk') ||
    // Leña / Ahumadores / Encendido
    name.includes('chips de leña') || name.includes('astillas ahumadoras') || name.includes('chips ahumadores') || name.includes('pastillas de encendido') ||
    // Fórmulas infantiles / Bebé ("los bebés no usan la app")
    brand.includes('sancor bebé') || brand.includes('sancor bebe') || name.includes('sancor bebé') || name.includes('sancor bebe') || name.includes('leche infantil') ||
    // Promo gaseosa doble Coca & Sprite
    name.includes('duopac') || (name.includes('coca cola') && name.includes('sprite') && name.includes('1.75'))
  ) {
    toDelete.push(item);
    continue;
  }

  let target = null;

  // =================================================================
  // 2. SUPLEMENTOS (Fitness, Proteínas en polvo, Avena según usuario)
  // =================================================================
  if (
    name.includes('proteína de arveja') || name.includes('proteina de arveja') ||
    (name.includes('proteina') && name.includes('ena sport') && name.includes('cafe')) ||
    (name.includes('avena') && (name.includes('instantanea') || name.includes('instantánea') || name.includes('quaker') || name.includes('tradicional') || name.includes('arrollada') || name.includes('extra fina'))) ||
    (name.includes('barra') && (name.includes('proteic') || name.includes('proteina') || name.includes('protein'))) ||
    brand.includes('ena sport') || brand.includes('gentech') || brand.includes('star nutrition') ||
    brand.includes('pulver') || brand.includes('xtrenght') || brand.includes('nutremax') ||
    name.includes('whey protein') || name.includes('creatina') || name.includes('bcaa') ||
    name.includes('colageno hidrolizado') || name.includes('colágeno hidrolizado')
  ) {
    if (!name.includes('gallet') && !name.includes('alfajor') && !name.includes('pan ') && !name.includes('pan lactal') && !name.includes('leche de avena') && !name.includes('bebida')) {
      target = 'Suplementos';
    }
  }

  // =================================================================
  // 3. CONGELADOS
  // =================================================================
  if (!target) {
    if (
      name.includes('cebolla 250') ||
      name.includes('simplot') || brand.includes('simplot') ||
      brand.includes('mc cain') || brand.includes('mccain') ||
      brand.includes('granja del sol') || brand.includes('green life') || brand.includes('karinat') || brand.includes('alif agro') ||
      name.includes('bastones de mozzarella') || name.includes('bastoncitos de mozzarella') ||
      (name.includes('helado') && !name.includes('polvo') && !name.includes('postre')) ||
      brand.includes('freddo') || name.includes('freddo') ||
      brand.includes('not icecream') || name.includes('not icecream') ||
      name.includes('tabletas heladas') || name.includes('paletas heladas') ||
      name.includes('pizza sibarita') || brand.includes('sibarita') || name.includes('pizza zen') ||
      name.includes('milanesa de merluza') || name.includes('milanesas de merluza') ||
      name.includes('bocaditos de pollo') || name.includes('bocaditos sabor pollo') ||
      name.includes('bastones de merluza') || name.includes('bastones de pollo') ||
      name.includes('not mila') ||
      (name.includes('milanesa') && (name.includes('soja') || name.includes('espinaca') || name.includes('calabaza'))) ||
      (name.includes('hamburguesa') && (name.includes('quinoa') || name.includes('espinaca') || name.includes('lenteja') || name.includes('vegetal') || name.includes('vegana') || brand.includes('nutree'))) ||
      (name.includes('medallon') && (name.includes('quinoa') || name.includes('espinaca') || name.includes('lenteja') || name.includes('vegetal') || name.includes('vegano') || brand.includes('nutree'))) ||
      name.includes('salchichas vegetarianas') ||
      name.includes('papas fritas congeladas') || name.includes('papas baston') || name.includes('papa baston') ||
      name.includes('supercongelad') || name.includes('congelad')
    ) {
      if (!name.includes('wagyu') && !name.includes('fresco') && !name.includes('al natural') && !name.includes('en aceite') && !name.includes('en lata') && !name.includes('desmenuzado') && !name.includes('lomitos de atun')) {
        target = 'Congelados';
      }
    }
  }

  // =================================================================
  // 4. PANADERÍA
  // =================================================================
  if (!target) {
    if (
      name.includes('pan artesano') || name.includes('pan molde') || name.includes('pan lactal') ||
      name.includes('pan de hamburguesa') || name.includes('pan para pancho') || name.includes('pan de papa') ||
      name.includes('pan con cereales') || name.includes('pan multicereal') || name.includes('pan integral') ||
      name.includes('pan blanco') || name.includes('pan salvado') || name.includes('pan árabe') || name.includes('pan arabe') ||
      name.includes('palmeritas') ||
      name.includes('muffin') ||
      name.includes('tarta de ricota') || name.includes('torta tres leches') ||
      name.includes('medialuna') || name.includes('medialunas') ||
      name.includes('sandwich') || name.includes('sándwich') ||
      name.includes('rosca matera') || name.includes('rosca de pascua') ||
      name.includes('bizcochuelo') || (brand.includes('nevares') && (name.includes('bizcochuelo') || name.includes('budin'))) ||
      name.includes('magdalena') || name.includes('magdalenas') || name.includes('madalenas') ||
      name.includes('fajitas') || name.includes('rapiditas') || brand.includes('rapiditas') ||
      name.includes('tapa pascualina') || name.includes('pascualina') ||
      name.includes('tapas de empanada') || name.includes('tapas para empanada') || name.includes('tapas rotiseras') ||
      name.includes('cookies chips') || name.includes('cookie chips') ||
      name.includes('alfajor de maicena') || name.includes('alfajores de maicena') ||
      name.includes('budin') || name.includes('budín') ||
      name.includes('pan dulce') ||
      name.includes('tostada') || name.includes('tostadas') || name.includes('tostaditas de arroz') ||
      name.includes('bizcocho de grasa') || name.includes('bizcochos') ||
      (name.includes('torta') && !name.includes('tortafritas') && !name.includes('helada')) ||
      (name.includes('tarta dulce') || name.includes('tarta de manzana') || name.includes('tarta de coco') || name.includes('tarta de ricota') || name.includes('pasta frola') || name.includes('pastafrola'))
    ) {
      target = 'Panadería';
    }
  }

  // =================================================================
  // 5. FRUTAS Y VERDURAS (100% Fresco de verdulería)
  // =================================================================
  if (!target) {
    if (
      name.includes('repollo colorado') || name.includes('repollo blanco') ||
      ((name.startsWith('tomate ') || name.startsWith('tomates ')) && (name.includes('kg') || name.includes('kilo') || name.includes('perita x') || name.includes('redondo x') || name.includes('cherry x') || name.includes('racimo'))) ||
      ((name.startsWith('papa ') || name.startsWith('papas ')) && (name.includes('negra') || name.includes('blanca') || name.includes('lavada') || name.includes('cepillada') || name.includes('x kg') || name.includes('x kilo'))) ||
      ((name.startsWith('cebolla') || name.startsWith('cebollas')) && (name.includes('x kg') || name.includes('x kilo') || name.includes('morada') || name.includes('comun') || name.includes('común'))) ||
      name.includes('zanahoria x') || name.includes('lechuga') || name.includes('espinaca fresca') || name.includes('acelga') ||
      (name.includes('banana') && (name.includes('kg') || name.includes('kilo') || name.includes('ecuador') || name.includes('bolivia') || name.includes('comun'))) ||
      (name.includes('manzana') && (name.includes('kg') || name.includes('kilo') || name.includes('roja') || name.includes('verde') || name.includes('elegida'))) ||
      name.includes('naranja x') || name.includes('naranja de ombligo') || name.includes('mandarina') || name.includes('limon x') || name.includes('limón x') ||
      name.includes('palta hass') || name.includes('palta x') || name.includes('zapallito') || name.includes('zucchini') ||
      (name.includes('calabaza') && (name.includes('kg') || name.includes('kilo') || name.includes('coqueta') || name.includes('anquito'))) ||
      (name.includes('morron') || name.includes('morrón')) && (name.includes('rojo') || name.includes('verde') || name.includes('amarillo')) ||
      name.includes('rucula') || name.includes('rúcula') || name.includes('radicheta') || name.includes('albahaca fresca') ||
      name.includes('choclo fresco') || name.includes('choclo choclo') || name.includes('berenjena') || name.includes('remolacha x') ||
      name.includes('pera williams') || name.includes('pera packham') || name.includes('uvas') || name.includes('frutilla x') ||
      name.includes('durazno x') || name.includes('ciruela x') || name.includes('kiwi x') || name.includes('melon') || name.includes('melón') || name.includes('sandia') || name.includes('sandía') ||
      name.includes('mix coleslaw') || name.includes('mix de verduras para sopa')
    ) {
      if (!name.includes('congelad') && !name.includes('en lata') && !name.includes('conserva') && !name.includes('mermelada') && !name.includes('helado') && !name.includes('jugo')) {
        target = 'Frutas y Verduras';
      }
    }
  }

  // =================================================================
  // 6. GOLOSINAS Y SNACKS (Rex, Cereales azucarados, Papas fritas, etc.)
  // =================================================================
  if (!target) {
    if (
      name.includes('rex') || brand.includes('rex') ||
      name.includes('froot loops') || name.includes('nesquik cereal') || name.includes('trix') || name.includes('zucaritas') || name.includes('copos de maiz') || name.includes('copos de maíz') ||
      name.includes('papas fritas') || name.includes('papas clasicas') || (name.includes('papas') && name.includes('asado criollo')) ||
      name.includes('twistos') || brand.includes('twistos') ||
      name.includes('lays') || name.includes("lay's") || name.includes('pehuamar') || name.includes('doritos') || name.includes('cheetos') || name.includes('chizitos') || name.includes('palitos salados') || name.includes('mani salado') || name.includes('maní salado') || name.includes('snack') ||
      name.includes('kibar') ||
      name.includes('nutella') || brand.includes('nutella') ||
      name.includes('aguila nut') || name.includes('águila nut') ||
      name.includes('barra cereal mix') || (brand.includes('cereal mix') && name.includes('barra')) ||
      name.includes('barra yogur') ||
      name.includes('mix terra') || name.includes('mix power') || name.includes('mix patagonia') ||
      name.includes('alfajor') || name.includes('chocolate') || name.includes('bon o bon') || name.includes('caramelo') || name.includes('gomitas') || name.includes('chupetin') || name.includes('turron') || name.includes('oblea') || name.includes('confite') || name.includes('franui')
    ) {
      if (!name.includes('helado') && !name.includes('pan ') && !name.includes('proteina') && !name.includes('whey') && !name.includes('congelad') && !name.includes('fideo')) {
        target = 'Golosinas y Snacks';
      }
    }
  }

  // =================================================================
  // 7. CARNES Y PESCADOS (Frescos y huevos)
  // =================================================================
  if (!target) {
    if (
      name.includes('wagyu') || name.includes('bife ') || name.includes('asado ') || name.includes('vacio ') || name.includes('vacío ') ||
      name.includes('colita de cuadril') || name.includes('peceto') || name.includes('lomo ') || name.includes('matambre') ||
      name.includes('entraña') || name.includes('tapa de asado') || name.includes('roast beef') || name.includes('paleta vacuna') ||
      name.includes('carne picada') || name.includes('cuadril') || name.includes('nalga ') || name.includes('bola de lomo') ||
      name.includes('achuras') || name.includes('chinchulin') || name.includes('chinchulín') || name.includes('molleja') || name.includes('riñon') || name.includes('riñón') ||
      name.includes('chorizo') || name.includes('morcilla') || name.includes('salchicha parrillera') || name.includes('salchichas viena') || name.includes('salchichas clasicas') || name.includes('salchichas vienissima') || name.includes('salchichas granja iris') || name.includes('salchichas paladini') || name.includes('salchichas cortas') ||
      (name.includes('pollo') && (name.includes('entero') || name.includes('pata') || name.includes('muslo') || name.includes('pechuga') || name.includes('suprema') || name.includes('alitas') || name.includes('fresco'))) ||
      name.includes('mejillon cocido') || name.includes('mejillón cocido') || name.includes('mejillones') ||
      name.includes('salmon fresco') || name.includes('salmón fresco') || name.includes('filet de merluza fresco') ||
      name.includes('huevos') || name.includes('huevo blanco') || name.includes('huevo colorado') || brand.includes('avicoper') ||
      (name.includes('cerdo') && (name.includes('carre') || name.includes('bondiola') || name.includes('pechito') || name.includes('costillita') || name.includes('solomillo')))
    ) {
      if (!name.includes('congelad') && !name.includes('pizza') && !name.includes('empanada') && !name.includes('caldo') && !name.includes('atun') && !name.includes('atún')) {
        target = 'Carnes y Pescados';
      }
    }
  }

  // =================================================================
  // 8. LÁCTEOS Y QUESOS (Lácteos, quesos, manteca, yogures, postres lácteos)
  // =================================================================
  if (!target) {
    if (
      name.includes('cindor') || brand.includes('cindor') ||
      name.includes('leche silk') || (brand.includes('silk') && name.includes('leche')) ||
      name.includes('leche de almendra') || name.includes('leche de almendras') || (name.includes('leche vegetal') || name.includes('alimento silk')) ||
      name.includes('leche descremada') || name.includes('leche entera') || name.includes('leche parcialmente') ||
      name.includes('serenisima protein') || name.includes('la serenísima protein') ||
      name.includes('queso gouda') || name.includes('queso cremoso') || name.includes('queso cuartirolo') ||
      name.includes('queso dambo') || name.includes('queso tybo') || name.includes('queso pategras') ||
      name.includes('queso reggianito') || name.includes('queso sardo') || name.includes('queso azul') ||
      name.includes('queso roquefort') || name.includes('queso brie') || name.includes('queso camembert') ||
      name.includes('queso provolone') || name.includes('queso muzzarella') || name.includes('queso mozzarella') ||
      name.includes('queso barra') || name.includes('queso feta') || name.includes('queso parmesano') ||
      name.includes('queso rallado') || name.includes('queso crema') || name.includes('casancrem') || name.includes('finlandia') ||
      name.includes('bocconcino') || name.includes('bocconcini') ||
      name.includes('yogur') || name.includes('yogurt') || brand.includes('dahi') || brand.includes('yogurisimo') ||
      name.includes('postre ser') || name.includes('postres ser') || name.includes('danette') || name.includes('shimmy') ||
      name.includes('crema de leche') || name.includes('manteca') ||
      name.includes('arroz con leche')
    ) {
      if (!name.includes('palmeritas') && !name.includes('medialuna') && !name.includes('bizcochuelo') && !name.includes('barra') && !name.includes('helado')) {
        target = 'Lácteos y Quesos';
      }
    }
  }

  // =================================================================
  // 9. BEBIDAS (Aguas, gaseosas, jugos listos, aperitivos, cervezas, vinos, bebidas vegetales)
  // =================================================================
  if (!target) {
    if (
      name.includes('vodka skyy') || name.includes('skyy') ||
      name.includes('terma') || brand.includes('terma') ||
      name.includes('gaseosa') || name.includes('coca-cola') || name.includes('coca cola') ||
      name.includes('sprite') || name.includes('fanta') || name.includes('pepsi') || name.includes('7up') || name.includes('seven up') || name.includes('schweppes') || name.includes('paso de los toros') || name.includes('manaos') ||
      name.includes('agua mineral') || name.includes('agua sin gas') || name.includes('agua con gas') || name.includes('villavicencio') || name.includes('villa del sur') || name.includes('glaciar') || name.includes('kin') || name.includes('eco de los andes') ||
      name.includes('agua saborizada') || name.includes('aquarius') || name.includes('levite') || name.includes('levité') || name.includes('ser saborizada') || name.includes('h2oh') ||
      name.includes('gatorade') || name.includes('powerade') ||
      name.includes('monster energy') || name.includes('red bull') || name.includes('speed unlimited') || name.includes('rockstar') ||
      name.includes('cerveza') || name.includes('quilmes') || name.includes('brahma') || name.includes('heineken') || name.includes('stella artois') || name.includes('corona') || name.includes('andes') || (name.includes('patagonia') && name.includes('cerveza')) || name.includes('imperial') || name.includes('amstel') || name.includes('miller') ||
      name.includes('vino') || name.includes('malbec') || name.includes('cabernet') || name.includes('chardonnay') || name.includes('sauvignon') || name.includes('espumante') || name.includes('champagne') ||
      name.includes('fernet') || name.includes('branca') || name.includes('campari') || name.includes('gancia') || name.includes('aperol') || name.includes('gin ') || name.includes('ron ') || name.includes('whisky') ||
      ((name.includes('bebida vegetal') || name.includes('bebida de almendra') || name.includes('bebida de mani') || name.includes('bebida de soja') || name.includes('bebida de avena')) && !name.includes('leche'))
    ) {
      if (!name.includes('jugo en polvo') && !name.includes('helado') && !name.includes('alfajor')) {
        target = 'Bebidas';
      }
    }
  }

  // =================================================================
  // 10. ALMACÉN (Despensa, atún enlatado, pastas secas y frescas, conservas, aceites, miel, edulcorantes, etc.)
  // =================================================================
  if (!target) {
    if (
      name.includes('atun') || name.includes('atún') || name.includes('lomitos de atun') || name.includes('caballa') || name.includes('sardinas') ||
      name.includes('tomate perita') || name.includes('pure de manzana') || name.includes('puré de manzana') ||
      name.includes('pimienta negra') || name.includes('nuez moscada') || name.includes('oregano') || name.includes('pimenton') || name.includes('comino') || name.includes('aji molido') || name.includes('laurel') ||
      name.includes('ravioles') || name.includes('sorrentinos') || name.includes('panzottis') || name.includes('panzotti') ||
      name.includes('capelettini') || name.includes('capeletinis') || name.includes('raviolones') || name.includes('ñoquis') || name.includes('noquis') ||
      name.includes('canelones') || name.includes('tortelletis') || name.includes('tortelli') || name.includes('lasagna') ||
      name.includes('fusiles') || name.includes('fusilli') || name.includes('fideos') || name.includes('tallarines') || name.includes('spaghetti') || name.includes('tirabuzon') || name.includes('mostachol') || name.includes('codito') || name.includes('moñito') ||
      (brand.includes('la salteña') && (name.includes('pasta') || name.includes('ravioles') || name.includes('ñoqui'))) ||
      brand.includes('mendia') || name.includes('mendia') ||
      name.includes('salsa de cheddar') || name.includes('salsa') || name.includes('passata') || name.includes('tuco') ||
      name.includes('miel ') || brand.includes('aleluya') ||
      name.includes('aceitunas') || brand.includes('castell') || brand.includes('la toscana') || brand.includes('nucete') || brand.includes('ybarra') ||
      name.includes('pepinos develey') || name.includes('pepinos en vinagre') || name.includes('pickles') ||
      name.includes('membrillo') || (name.includes('batata') && (name.includes('dulce') || name.includes('pote') || name.includes('lata'))) ||
      name.includes('rissoto gallo') || name.includes('arroz gallo') || name.includes('arroz yamani') || name.includes('arroz yamaní') || name.includes('arroz doble carolina') || name.includes('arroz largo fino') ||
      name.includes('salchichas veganas') || name.includes('caldo sabor carne') || name.includes('caldo ') || name.includes('sopas') ||
      name.includes('arenque escabeche') || name.includes('escabeche') ||
      name.includes('jugo en polvo') || brand.includes('tang') || brand.includes('clight') ||
      name.includes('mayonesa') || name.includes('mostaza') || name.includes('ketchup') || name.includes('salsa golf') ||
      (name.includes('durazno') && (name.includes('lata') || name.includes('mitades'))) ||
      name.includes('choclo en grano') || name.includes('arvejas') || name.includes('lentejas secas') || name.includes('lentejas en lata') || name.includes('garbanzos') || name.includes('porotos') ||
      name.includes('polenta') || name.includes('presto pronta') ||
      name.includes('mermelada') ||
      name.includes('aceite de maiz') || name.includes('aceite de maíz') || name.includes('aceite de girasol') || name.includes('aceite de oliva') || name.includes('aceite mezcla') ||
      name.includes('mantequilla de mani') || name.includes('pasta de mani') || name.includes('pouch mani') ||
      name.includes('granola') ||
      name.includes('cafe ') || name.includes('café ') || name.includes('nescafe') || name.includes('dolca') || name.includes('la virginia') ||
      name.includes('edulcorante') || name.includes('stevia') || name.includes('sucralosa') ||
      name.includes('premezcla') || name.includes('postre en polvo') || name.includes('gelatina') || name.includes('flan en polvo') ||
      name.includes('harina') || name.includes('azucar') || name.includes('azúcar') || name.includes('sal fina') || name.includes('sal gruesa')
    ) {
      target = 'Almacén';
    }
  }

  // Fallback a categoría canónica existente o Almacén
  if (!target) {
    if (updates[oldCat]) {
      target = oldCat;
    } else {
      target = 'Almacén';
    }
  }

  if (target && updates[target]) {
    updates[target].push(item);
  }
}

console.log('--- FINAL RECLASSIFICATION BREAKDOWN ---');
console.log('Total To Delete:', toDelete.length);
let totalUpdated = 0;
for (const [cat, items] of Object.entries(updates)) {
  console.log(cat + ':', items.length);
  totalUpdated += items.length;
}
console.log('Total kept in catalog:', totalUpdated);
console.log('Total accounted for:', totalUpdated + toDelete.length);

// Generate SQL migration script 06_deep_recategorize_and_purge.sql
let sql = `-- =================================================================
-- ZENIT: 06_DEEP_RECATEGORIZE_AND_PURGE.SQL
-- 1. Elimina definitivamente 57 articulos no comestibles / no deseados:
--    (Cuadernos, Changos carritos, Naftalina, Hojas/Resmas, Neo Silk,
--     Chips de leña/ahumadores, Pastillas de encendido, Leches infantiles bebé, Promo pack)
-- 2. Reclasifica cada producto en su categoria canonica segun revision minuciosa
-- =================================================================

-- 1. ELIMINAR NO COMESTIBLES / NO DESEADOS (${toDelete.length} articulos)
DELETE FROM public.foods WHERE barcode IN (
${toDelete.map(d => `  '${d.barcode}'`).join(',\n')}
);

-- 2. RECLASIFICACION CANONICA EXACTA
`;

for (const [cat, items] of Object.entries(updates)) {
  if (items.length === 0) continue;
  sql += `\n-- Mover a \"${cat}\" (${items.length} productos)\n`;
  sql += `UPDATE public.foods SET category = '${cat}' WHERE barcode IN (\n`;
  sql += items.map(d => `  '${d.barcode}'`).join(',\n');
  sql += `\n);\n`;
}

fs.writeFileSync('scripts/06_deep_recategorize_and_purge.sql', sql, 'utf8');
console.log('\nGenerated scripts/06_deep_recategorize_and_purge.sql successfully!');

