const fs = require('fs');
const path = require('path');
const https = require('https');

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function fetchVtexSearch(query) {
  return new Promise((resolve) => {
    const url = `https://diaonline.supermercadosdia.com.ar/api/catalog_system/pub/products/search?ft=${encodeURIComponent(query)}&_from=0&_to=4`;
    https.get(
      url,
      {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          'Accept': 'application/json',
        },
        timeout: 10000,
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
  const catalogPath = path.resolve(__dirname, '../src/data/argentineProducts.js');
  let content = fs.readFileSync(catalogPath, 'utf8');

  // Cargar catálogo actual
  const { POPULAR_ARGENTINE_PRODUCTS } = require(catalogPath);
  console.log(`🔍 Analizando ${POPULAR_ARGENTINE_PRODUCTS.length} productos locales...`);

  const offProducts = POPULAR_ARGENTINE_PRODUCTS.filter((p) =>
    p.image && p.image.includes('openfoodfacts.org')
  );
  console.log(`📦 Encontrados ${offProducts.length} productos con fotos viejas de Open Food Facts.`);

  let updatedCount = 0;

  for (let i = 0; i < offProducts.length; i++) {
    const prod = offProducts[i];
    const searchTerms = [
      `${prod.brand} ${prod.name}`,
      prod.name,
      prod.brand,
    ];

    let foundImage = null;

    for (const term of searchTerms) {
      // Limpiar términos para mejor matching
      const cleanTerm = term
        .replace(/\(.*?\)/g, '')
        .replace(/Original|Clásica|Clásico|Tradicional/gi, '')
        .replace(/\b(de|la|el|en)\b/gi, '')
        .trim();

      const results = await fetchVtexSearch(cleanTerm);
      if (results && results.length > 0) {
        for (const item of results) {
          const img = item.items?.[0]?.images?.[0]?.imageUrl;
          if (img && img.includes('vteximg.com.br')) {
            foundImage = img.split('?')[0];
            break;
          }
        }
      }
      if (foundImage) break;
      await sleep(200);
    }

    if (foundImage) {
      console.log(`✅ [${i + 1}/${offProducts.length}] ${prod.name} -> ${foundImage}`);
      // Reemplazamos la imagen vieja en el archivo
      const oldImg = prod.image;
      if (content.includes(oldImg)) {
        content = content.replace(oldImg, foundImage);
        updatedCount++;
      }
    } else {
      console.log(`⚠️ [${i + 1}/${offProducts.length}] No encontrado en Día: ${prod.brand} - ${prod.name}`);
    }

    await sleep(250);
  }

  fs.writeFileSync(catalogPath, content, 'utf8');
  console.log(`\n🎉 ¡Actualización finalizada! ${updatedCount} productos ahora tienen packshots de estudio HD.`);
}

run().catch(console.error);

