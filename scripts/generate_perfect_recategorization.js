const fs = require('fs');

const items = JSON.parse(fs.readFileSync('scripts/catalog_current.json', 'utf8'));

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

for (const item of items) {
  const name = (item.name || '').toLowerCase().trim();
  const brand = (item.brand || '').toLowerCase().trim();
  const oldCat = item.category;

  let target = null;

  // -----------------------------------------------------------------
  // 1. PANADERÍA: TODO EL PAN VA A PANADERÍA (salvo pan rallado)
  //    + Cookies, Muffins, Medialunas, Tartas dulces/saladas, etc.
  // -----------------------------------------------------------------
  const isPanRallado = name.includes('pan rallado') || name.includes('pan panko') || name.includes('rebozador') || name.includes('harina pureza panes') || name.includes('premezcla para pizza-pan');
  const isBread = (
    name.startsWith('pan ') || name.includes(' pan ') || name.endsWith(' pan') ||
    name.includes('pan lactal') || name.includes('pan molde') || name.includes('pan de ') ||
    name.includes('pan artesano') || name.includes('pan blanco') || name.includes('pan negro') ||
    name.includes('pan integral') || name.includes('pan salvado') || name.includes('pan multicereal') ||
    name.includes('pan con cereales') || name.includes('pan con semillas') || name.includes('pan arabe') ||
    name.includes('pan árabe') || name.includes('pan pita') || name.includes('baguette') ||
    name.includes('pan flauta') || name.includes('pan felipe') || name.includes('pan casero') ||
    name.includes('pan de campo') || name.includes('pan brioche') || name.includes('pan de hamburguesa') ||
    name.includes('pan para pancho') || name.includes('pan de papa') || name.includes('pan masa madre') ||
    name.includes('pan proteic') || name.includes('pan protein') || name.includes('pan fibras') ||
    name.includes('pan low carb')
  ) && !isPanRallado && !name.includes('pan dulce') && !name.includes('panquequ') && !name.includes('panzotti') && !name.includes('panceta');

  if (isBread) {
    target = 'Panadería';
  }

  // Cookies van a Panadería según instrucción expresa del usuario
  if (!target && (name.includes('cookie') || name.includes('cookies'))) {
    target = 'Panadería';
  }

  // Tartas (dulces o saladas de panadería) van a Panadería
  if (!target && (name.startsWith('tarta ') || name.includes(' tarta ')) && !name.includes('mix tarta') && !name.includes('relleno para tarta') && !name.includes('tarta de merluza') && !name.includes('tarta de salmón')) {
    target = 'Panadería';
  }

  // Otros panificados clásicos
  if (!target && (
    name.includes('palmeritas') || name.includes('muffin') || name.includes('medialuna') ||
    name.includes('sandwich') || name.includes('sándwich') || name.includes('rosca matera') ||
    name.includes('bizcochuelo') || (brand.includes('nevares') && (name.includes('bizcochuelo') || name.includes('budin'))) ||
    name.includes('magdalena') || name.includes('madalena') || name.includes('fajitas') ||
    name.includes('rapiditas') || brand.includes('rapiditas') ||
    name.includes('alfajor de maicena') || name.includes('budin') || name.includes('budín') ||
    name.includes('pan dulce') || name.includes('tostada') || name.includes('tostadas') ||
    name.includes('bizcocho de grasa') || name.includes('bizcochos tia maruca') ||
    name.includes('pasta frola') || name.includes('pastafrola')
  )) {
    target = 'Panadería';
  }

  // -----------------------------------------------------------------
  // 2. BARRAS DE CEREAL (incluidas las con yogur) -> GOLOSINAS Y SNACKS (o Suplementos si son proteicas)
  // -----------------------------------------------------------------
  const isCerealBar = (name.startsWith('barra ') || name.includes(' barra ') || name.includes('barrita')) && 
                      !name.includes('queso barra') && !name.includes('en barra') && !name.includes('chocolate en barra') && !name.includes('barraza');
  if (!target && isCerealBar) {
    if (name.includes('proteic') || name.includes('protein') || name.includes('proteina') || brand.includes('integra') || brand.includes('ena') || brand.includes('gentech')) {
      target = 'Suplementos';
    } else {
      target = 'Golosinas y Snacks';
    }
  }

  // -----------------------------------------------------------------
  // 3. TAPAS DE EMPANADAS Y PASCUALINAS -> ALMACÉN (según pedido expreso)
  // -----------------------------------------------------------------
  if (!target && (
    name.includes('tapa de empanada') || name.includes('tapas de empanada') ||
    name.includes('tapa empanada') || name.includes('tapas empanadas') ||
    name.includes('tapas para empanada') || name.includes('tapas rotiseras') ||
    name.includes('tapa pascualina') || name.includes('tapas pascualina') ||
    name.includes('pascualina')
  )) {
    target = 'Almacén';
  }

  // -----------------------------------------------------------------
  // 4. EMPANADAS LISTAS / RELLENAS -> CONGELADOS (según pedido expreso)
  // -----------------------------------------------------------------
  if (!target && (
    (name.startsWith('empanada ') || name.startsWith('empanadas ')) &&
    !name.includes('tapa')
  )) {
    target = 'Congelados';
  }

  // -----------------------------------------------------------------
  // 5. PASTAS FRESCAS Y SECAS -> ALMACÉN (mini raviolitos, ñoquis, etc.)
  // -----------------------------------------------------------------
  if (!target && (
    name.includes('raviol') || name.includes('ñoqui') || name.includes('noqui') ||
    name.includes('sorrentino') || name.includes('panzotti') || name.includes('capelettini') ||
    name.includes('capeletinis') || name.includes('canelones') || name.includes('tortelleti') ||
    name.includes('tortelli') || name.includes('lasagna') || name.includes('fusil') ||
    name.includes('fideo') || name.includes('tallarines') || name.includes('spaghetti') ||
    name.includes('tirabuzon') || name.includes('mostachol') || name.includes('codito') ||
    name.includes('moñito')
  )) {
    target = 'Almacén';
  }

  // -----------------------------------------------------------------
  // 6. CARNES Y PESCADOS (Frescos y achuras de carnicería/pescadería)
  //    - Chinchulín, achuras, cortes de carne Wagyu/cerdo/pollo/vaca, panceta
  //    - Pescados y mariscos NO rebozados
  // -----------------------------------------------------------------
  const isRebozado = (
    name.includes('rebozad') || name.includes('nugget') || name.includes('bastoncitos de merluza') ||
    name.includes('bastones de merluza') || name.includes('bastones de pollo') || name.includes('formitas de pollo') ||
    name.includes('patitas de pollo') || name.includes('bocaditos de pollo') || name.includes('bocaditos sabor pollo') ||
    name.includes('milanesa de merluza rebozada') || name.includes('milanesa de carne rebozada') ||
    name.includes('medallon de merluza rebozado') || name.includes('medallon de salmon rebozado') ||
    name.includes('langostino rebozado') || name.includes('supremas de merluza rebozadas') ||
    name.includes('a la romana')
  );

  const isFishOrSeafood = (
    name.includes('salmon') || name.includes('salmón') || name.includes('merluza') ||
    name.includes('calamar') || name.includes('mejillon') || name.includes('mejillón') ||
    name.includes('langostino') || name.includes('trucha') || name.includes('abadejo') ||
    name.includes('kani kama') || name.includes('cazuela de marisco') || name.includes('ensalada de marisco') ||
    name.includes('pescado')
  ) && !name.includes('atun') && !name.includes('atún') && !name.includes('caballa') && !name.includes('sardina');

  if (!target && isFishOrSeafood && !isRebozado && !name.includes('tarta de')) {
    target = 'Carnes y Pescados';
  }

  const isCarniceria = (
    name.includes('panceta') ||
    name.includes('chinchulin') || name.includes('achura') || name.includes('molleja') ||
    name.includes('riñon') || name.includes('riñón') ||
    name.includes('wagyu') || name.includes('asado banderita') || name.includes('bife de chorizo') ||
    name.includes('ojo de bife') || name.includes('colita de cuadril') || name.includes('peceto') ||
    name.includes('matambre') || name.includes('entraña') || name.includes('vacio') || name.includes('vacío') ||
    name.includes('carne picada') || name.includes('roast beef') || name.includes('nalga de cerdo') ||
    name.includes('paleta de cerdo') || name.includes('carre de cerdo') || name.includes('bondiola de cerdo') ||
    name.includes('patitas de cerdo') || name.includes('pollo entero') || name.includes('muslo de pollo') ||
    name.includes('pata y muslo') || name.includes('pechuga') ||
    (name.includes('milanesa de pollo congelada') && !isRebozado) ||
    (name.includes('milanesa de cerdo congelada') && !isRebozado) ||
    name.includes('chorizo') || name.includes('morcilla') || name.includes('salchicha parrillera') ||
    name.includes('salchichas viena') || name.includes('salchichas clasicas') || name.includes('salchichas vienissima') ||
    name.includes('salchichas granja iris') || name.includes('salchichas paladini') || name.includes('salchichas cortas') ||
    name.includes('huevos') || name.includes('huevo blanco') || name.includes('huevo colorado') || brand.includes('avicoper')
  );

  if (!target && isCarniceria && !name.includes('hamburguesa') && !name.includes('medallon')) {
    target = 'Carnes y Pescados';
  }

  // -----------------------------------------------------------------
  // 7. CONGELADOS:
  //    - Hamburguesas y medallones de carne, pollo o veganas (todas a Congelados)
  //    - Rebozados de pescado y pollo
  //    - Helados, papas fritas congeladas, pizzas congeladas, vegetales congelados
  // -----------------------------------------------------------------
  if (!target && (
    name.includes('hamburguesa') || name.includes('medallon') || name.includes('medallones') ||
    brand.includes('paty') || brand.includes('good mark') || brand.includes('swift') && (name.includes('parrillera') || name.includes('hamburguesa')) ||
    brand.includes('nutree') || name.includes('vegetalex') ||
    isRebozado ||
    name.includes('bastones de mozzarella') || name.includes('bastoncitos de mozzarella') ||
    (name.includes('helado') && !name.includes('polvo') && !name.includes('postre')) ||
    brand.includes('freddo') || brand.includes('not icecream') ||
    name.includes('tabletas heladas') || name.includes('paletas heladas') ||
    name.includes('pizza sibarita') || brand.includes('sibarita') || name.includes('pizza zen') ||
    brand.includes('mc cain') || brand.includes('mccain') || brand.includes('simplot') ||
    brand.includes('granja del sol') || brand.includes('green life') || brand.includes('karinat') || brand.includes('alif agro') ||
    name.includes('papas baston') || name.includes('papa baston') || name.includes('supercongelad') ||
    (name.includes('congelad') && (name.includes('vegetal') || name.includes('cebolla') || name.includes('mix tarta') || name.includes('relleno de tarta') || name.includes('tarta de merluza') || name.includes('tarta de salmón')))
  )) {
    target = 'Congelados';
  }

  // -----------------------------------------------------------------
  // 8. LÁCTEOS Y QUESOS:
  //    - Leches de almendras / vegetales con 'leche', leches Silk
  //    - Leche de proteína (La Serenísima Protein)
  //    - Arroz con leche, Postres Ser, Danette, Ilolay postres
  //    - Leches fluidas, chocolatadas Cindor / Nesquik
  //    - Quesos de todo tipo, yogures, manteca, crema
  // -----------------------------------------------------------------
  if (!target && (
    name.includes('leche de almendra') || name.includes('leche de almendras') ||
    name.includes('leche silk') || (brand.includes('silk') && (name.includes('alimento') || name.includes('leche') || name.includes('silk'))) ||
    name.includes('leche de coco') || name.includes('leche de avena') || name.includes('leche vegetal') ||
    name.includes('leche protein') || name.includes('serenisima protein') ||
    name.includes('arroz con leche') ||
    name.includes('postre ser') || name.includes('postres ser') || (name.includes('postre') && brand.includes('ser')) ||
    name.includes('danette') || name.includes('shimmy') || name.includes('postre c/ confites') ||
    name.includes('cindor') || brand.includes('cindor') || name.includes('chocolatada') ||
    name.includes('leche descremada') || name.includes('leche entera') || name.includes('leche parcialmente') ||
    name.includes('queso') || name.includes('casancrem') || name.includes('finlandia') || name.includes('bocconcino') ||
    name.includes('yogur') || name.includes('yogurt') || brand.includes('dahi') || brand.includes('yogurisimo') ||
    name.includes('crema de leche') || name.includes('manteca')
  )) {
    target = 'Lácteos y Quesos';
  }

  // -----------------------------------------------------------------
  // 9. ALMACÉN:
  //    - Mermeladas (todas)
  //    - Dulce de batata y membrillo
  //    - Mantequilla y pasta de maní, pouch maní
  //    - Pan rallado y rebozador
  //    - Atún y pescados enlatados
  //    - Aceites, vinagres, aderezos, mayonesas
  //    - Arroces, legumbres, polenta, harinas, azúcar, sal
  //    - Enlatados de frutas y verduras (choclo, arvejas, durazno, tomate)
  //    - Café, edulcorantes, jugos en polvo
  // -----------------------------------------------------------------
  if (!target && (
    name.includes('mermelada') ||
    (name.includes('dulce de batata') || name.includes('dulce de membrillo') || name.includes('membrillo') || (name.includes('batata') && name.includes('dulce'))) ||
    name.includes('mantequilla de mani') || name.includes('pasta de mani') || name.includes('pouch mani') || name.includes('mantequilla de maní') || name.includes('pasta de maní') ||
    name.includes('crema de almendras') ||
    isPanRallado ||
    name.includes('atun') || name.includes('atún') || name.includes('lomitos de atun') || name.includes('caballa') || name.includes('sardina') ||
    name.includes('tomate perita') || name.includes('pure de tomate') || name.includes('puré de tomate') || name.includes('passata') || name.includes('extracto de tomate') ||
    name.includes('aceite') || name.includes('vinagre') || name.includes('aceto') ||
    name.includes('mayonesa') || name.includes('mostaza') || name.includes('ketchup') || name.includes('salsa') ||
    name.includes('arroz') || name.includes('rissoto') || name.includes('polenta') || name.includes('presto pronta') ||
    name.includes('lenteja') || name.includes('arveja') || name.includes('garbanzo') || name.includes('poroto') || name.includes('choclo') ||
    name.includes('durazno en lata') || name.includes('durazno en mitades') || name.includes('duraznos amarillos') ||
    name.includes('aceitunas') || name.includes('pepinos') || name.includes('pickles') ||
    name.includes('harina') || name.includes('azucar') || name.includes('azúcar') || name.includes('sal fina') || name.includes('sal gruesa') ||
    name.includes('cafe ') || name.includes('café ') || name.includes('nescafe') || name.includes('dolca') ||
    name.includes('edulcorante') || name.includes('stevia') || name.includes('sucralosa') ||
    name.includes('jugo en polvo') || brand.includes('tang') || brand.includes('clight') ||
    name.includes('caldo ') || name.includes('pimienta') || name.includes('oregano') || name.includes('nuez moscada') ||
    name.includes('miel ') || brand.includes('aleluya') ||
    name.includes('premezcla') || name.includes('gelatina') || name.includes('flan en polvo') || name.includes('postre en polvo')
  )) {
    target = 'Almacén';
  }

  // -----------------------------------------------------------------
  // 10. SUPLEMENTOS:
  //     - Proteínas, creatinas, avena
  // -----------------------------------------------------------------
  if (!target && (
    name.includes('proteína de arveja') || name.includes('proteina de arveja') ||
    (name.includes('proteina') && name.includes('ena sport') && name.includes('cafe')) ||
    (name.includes('avena') && (name.includes('instantanea') || name.includes('instantánea') || name.includes('quaker') || name.includes('tradicional') || name.includes('arrollada') || name.includes('extra fina'))) ||
    (name.includes('barra') && (name.includes('proteic') || name.includes('proteina') || name.includes('protein'))) ||
    brand.includes('ena sport') || brand.includes('gentech') || brand.includes('star nutrition') ||
    brand.includes('pulver') || brand.includes('xtrenght') || brand.includes('nutremax') ||
    name.includes('whey protein') || name.includes('creatina') || name.includes('bcaa') ||
    name.includes('colageno hidrolizado') || name.includes('colágeno hidrolizado')
  )) {
    target = 'Suplementos';
  }

  // -----------------------------------------------------------------
  // 11. GOLOSINAS Y SNACKS:
  //     - Galletas Rex, cereales azucarados de desayuno (Froot Loops, etc.)
  //     - Papas fritas snack, Twistos, chocolates, alfajores
  //     - Mix de frutos secos snack (Terra, Power, Patagonia)
  // -----------------------------------------------------------------
  if (!target && (
    name.includes('rex') || brand.includes('rex') ||
    name.includes('froot loops') || name.includes('nesquik cereal') || name.includes('trix') || name.includes('zucaritas') || name.includes('copos de maiz') ||
    name.includes('papas fritas') || name.includes('papas clasicas') || (name.includes('papas') && name.includes('asado criollo')) ||
    name.includes('twistos') || brand.includes('twistos') ||
    name.includes('lays') || name.includes("lay's") || name.includes('pehuamar') || name.includes('doritos') || name.includes('cheetos') || name.includes('chizitos') || name.includes('palitos salados') || name.includes('mani salado') || name.includes('maní salado') || name.includes('snack') ||
    name.includes('nutella') || brand.includes('nutella') ||
    name.includes('aguila nut') || name.includes('águila nut') ||
    name.includes('mix terra') || name.includes('mix power') || name.includes('mix patagonia') ||
    (name.includes('almendras') && (name.includes('roasted') || name.includes('chocolate') || name.includes('snack'))) ||
    name.includes('peladilla') || name.includes('turron') ||
    name.includes('alfajor') || name.includes('chocolate') || name.includes('bon o bon') || name.includes('caramelo') || name.includes('gomitas') || name.includes('chupetin') || name.includes('oblea') || name.includes('confite') || name.includes('franui')
  )) {
    target = 'Golosinas y Snacks';
  }

  // -----------------------------------------------------------------
  // 12. BEBIDAS:
  //     - Gaseosas, aguas, energizantes, cervezas, vinos, aperitivos, bebidas vegetales (no leche)
  // -----------------------------------------------------------------
  if (!target && (
    name.includes('vodka') || name.includes('skyy') || name.includes('terma') ||
    name.includes('gaseosa') || name.includes('coca-cola') || name.includes('coca cola') ||
    name.includes('sprite') || name.includes('fanta') || name.includes('pepsi') || name.includes('7up') || name.includes('schweppes') || name.includes('paso de los toros') || name.includes('manaos') ||
    name.includes('agua mineral') || name.includes('agua sin gas') || name.includes('agua con gas') || name.includes('villavicencio') || name.includes('villa del sur') || name.includes('glaciar') || name.includes('kin') || name.includes('eco de los andes') ||
    name.includes('agua saborizada') || name.includes('aquarius') || name.includes('levite') || name.includes('levité') || name.includes('h2oh') ||
    name.includes('gatorade') || name.includes('powerade') ||
    name.includes('monster energy') || name.includes('red bull') || name.includes('speed unlimited') || name.includes('rockstar') ||
    name.includes('cerveza') || name.includes('quilmes') || name.includes('brahma') || name.includes('heineken') || name.includes('stella artois') || name.includes('corona') || name.includes('andes') || name.includes('imperial') || name.includes('amstel') ||
    name.includes('vino') || name.includes('malbec') || name.includes('cabernet') || name.includes('chardonnay') || name.includes('espumante') || name.includes('champagne') ||
    name.includes('fernet') || name.includes('campari') || name.includes('gancia') || name.includes('aperol') || name.includes('gin ') || name.includes('whisky') ||
    ((name.includes('bebida vegetal') || name.includes('bebida de almendra') || name.includes('bebida de mani') || name.includes('bebida de soja') || name.includes('bebida de avena')) && !name.includes('leche'))
  )) {
    target = 'Bebidas';
  }

  // -----------------------------------------------------------------
  // 13. FRUTAS Y VERDURAS:
  //     - Solo productos 100% frescos
  // -----------------------------------------------------------------
  if (!target && (
    name.includes('repollo colorado') || name.includes('repollo blanco') ||
    name.startsWith('tomate ') || name.startsWith('tomates ') ||
    name.startsWith('papa ') || name.startsWith('papas ') ||
    name.startsWith('cebolla') || name.startsWith('cebollas') ||
    name.includes('zanahoria x') || name.includes('lechuga') || name.includes('espinaca fresca') || name.includes('acelga') ||
    name.includes('banana') || name.includes('manzana') || name.includes('naranja') || name.includes('mandarina') ||
    name.includes('limon x') || name.includes('limón x') || name.includes('palta') || name.includes('zapallito') ||
    name.includes('zucchini') || name.includes('calabaza') || name.includes('morron') || name.includes('morrón') ||
    name.includes('rucula') || name.includes('rúcula') || name.includes('radicheta') || name.includes('albahaca fresca') ||
    name.includes('choclo fresco') || name.includes('berenjena') || name.includes('remolacha x') ||
    name.includes('pera williams') || name.includes('pera packham') || name.includes('uvas') || name.includes('frutilla x') ||
    name.includes('durazno x') || name.includes('ciruela x') || name.includes('kiwi x') || name.includes('melon') || name.includes('melón') || name.includes('sandia') || name.includes('sandía') ||
    name.includes('mix coleslaw') || name.includes('mix de verduras para sopa')
  )) {
    target = 'Frutas y Verduras';
  }

  // Fallback canónico
  if (!target) {
    if (updates[oldCat]) {
      target = oldCat;
    } else {
      target = 'Almacén';
    }
  }

  updates[target].push(item);
}

console.log('--- FINAL REFINED RECLASSIFICATION BREAKDOWN ---');
let total = 0;
for (const [cat, arr] of Object.entries(updates)) {
  console.log(`${cat}: ${arr.length}`);
  total += arr.length;
}
console.log('Total catalog items classified:', total);

// Generate SQL migration 07_perfect_catalog_refinement.sql
let sql = `-- =================================================================
-- ZENIT: 07_PERFECT_CATALOG_REFINEMENT.SQL
-- Reclasificacion quirurgica segun feedback detallado del usuario:
-- 1. Todo el pan (artesano, masa madre, molde, marca, propio) a Panaderia (solo pan rallado en Almacen).
-- 2. Hamburguesas (carne y veganas) a Congelados.
-- 3. Empanadas a Congelados; mini raviolitos, ñoquis a Almacen; barras de cereal a Golosinas/Snacks.
-- 4. Leches de almendras, Silk, proteina, arroz con leche, postres Ser a Lacteos.
-- 5. Mermeladas, dulce de batata, mantequillas/pastas de mani a Almacen.
-- 6. Cookies y tartas a Panaderia.
-- 7. Tapas de empanadas/pascualina a Almacen.
-- 8. Achuras, cortes de carne, carnes/pollos frescos, y todos los pescados/mariscos frescos a Carnes.
--    Solo quedan en Congelados los rebozados de pescado/pollo, pizzas, papas, hamburguesas y helados.
-- =================================================================

`;

for (const [cat, arr] of Object.entries(updates)) {
  if (arr.length === 0) continue;
  sql += `\n-- Mover a \"${cat}\" (${arr.length} productos)\n`;
  sql += `UPDATE public.foods SET category = '${cat}' WHERE barcode IN (\n`;
  sql += arr.map(d => `  '${d.barcode}'`).join(',\n');
  sql += `\n);\n`;
}

fs.writeFileSync('scripts/07_perfect_catalog_refinement.sql', sql, 'utf8');
console.log('Generated scripts/07_perfect_catalog_refinement.sql successfully!');
