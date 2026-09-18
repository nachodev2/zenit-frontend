// Polyfill de WebSocket para Node.js < 22
if (typeof global.WebSocket === 'undefined') {
  global.WebSocket = class DummyWebSocket {};
}

const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const { createClient } = require('@supabase/supabase-js');
const { GoogleGenerativeAI } = require('@google/generative-ai');

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
// Uso estricto de la Service Role Key para hacer bypass del RLS
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;
const geminiApiKey = process.env.EXPO_PUBLIC_GEMINI_API_KEY;

if (!supabaseUrl || !supabaseKey || !geminiApiKey) {
  console.error('❌ Faltan credenciales en el .env (Asegurate de tener SUPABASE_SERVICE_ROLE_KEY y EXPO_PUBLIC_GEMINI_API_KEY)');
  process.exit(1);
}

if (supabaseKey === process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY) {
  console.warn('⚠️ ATENCIÓN: Estás usando la ANON_KEY. Los datos pueden ser bloqueados por RLS. Agregá SUPABASE_SERVICE_ROLE_KEY al .env si tenés problemas de array vacío.');
}

const supabase = createClient(supabaseUrl, supabaseKey, {
    auth: { persistSession: false }
});

const genAI = new GoogleGenerativeAI(geminiApiKey);

const SYSTEM_PROMPT = `Sos un experto en taxonomía de alimentos. Tu objetivo es normalizar y clasificar el nombre de scrapeo crudo de un producto de supermercado.

REGLAS DE NORMALIZACIÓN ESTRICTAS:
1. canonical_name DEBE estar siempre en 'Title Case' (Ej: 'Proteína Whey', no 'proteina whey').
2. canonical_name NO debe incluir marcas, gramajes ni sabores (Ej: Si es 'Yogur Ser Pro Vainilla Caramel', el canónico es 'Yogur' o 'Yogur Proteico'. Nunca incluyas 'Vainilla').
3. Si el producto NO ES COMIDA (ej: ropa, limpieza, alimento para perros), devolvé is_food: false y dejá el resto de los campos vacíos o en null.

Respondé ÚNICAMENTE con un JSON con esta estructura exacta:
{
  "is_food": boolean,
  "canonical_name": "string en Title Case",
  "category": "string (enum obligatorio: frutas_verduras, carnes_pescados, lacteos, huevos, cereales_legumbres, panificados, conservas, bebidas, snacks, condimentos_salsas, aceites_grasas, congelados, suplementos, otros)",
  "subcategory": "string",
  "food_type": "string",
  "serving_mode": "string (enum obligatorio: bulk_weight, unit, packaged_volume)",
  "confidence": number (0 a 1),
  "reasoning": "string breve justificando la decisión"
}`;

const model = genAI.getGenerativeModel({
  model: 'gemini-3.5-flash-lite', // Versión Lite/8B actual de Gemini 1.5
  systemInstruction: SYSTEM_PROMPT,
  generationConfig: {
    responseMimeType: "application/json",
    temperature: 0.1
  }
});

const sleep = (ms) => new Promise(r => setTimeout(r, ms));

const safeParseJson = (rawText) => {
  try {
    const cleaned = rawText.replace(/```(?:json)?\s*/gi, '').replace(/```/g, '').trim();
    return JSON.parse(cleaned);
  } catch (e) {
    return null;
  }
};

/**
 * Llama a la API de Gemini con lógica de reintentos (Exponential Backoff)
 * para sortear errores temporales de la API (503, 429).
 */
async function generateContentWithRetry(prompt, maxRetries = 3) {
  let attempt = 0;
  while (attempt < maxRetries) {
    try {
      return await model.generateContent(prompt);
    } catch (apiError) {
      const msg = (apiError.message || '').toLowerCase();
      const isRateLimitOrOverload = msg.includes('429') || msg.includes('503') || msg.includes('quota') || msg.includes('overloaded');
      
      attempt++;
      if (!isRateLimitOrOverload || attempt >= maxRetries) {
        throw apiError; // Falla dura o se agotaron los reintentos
      }
      
      // Exponential Backoff: 2s, 4s, 8s (+ un factor aleatorio)
      const delayMs = Math.pow(2, attempt) * 1000 + Math.random() * 500;
      console.log(`\n⚠️ Saturación de API detectada (Intento ${attempt}/${maxRetries}). Reintentando en ${Math.round(delayMs / 1000)}s...`);
      await sleep(delayMs);
    }
  }
}

async function run() {
  console.log('🧪 Iniciando muestreo de IA para 100 productos...');

  const { data: products, error } = await supabase
    .from('products')
    .select('id, source_name, brand, package_grams')
    .limit(100);

  if (error) {
    console.error("❌ Error de SQL al consultar products:", error.message);
    process.exit(1);
  }

  console.log(`📦 Se recuperaron ${products?.length || 0} productos de la base de datos.`);

  if (!products || products.length === 0) {
      console.log("⚠️ No hay productos para procesar. Abortando.");
      process.exit(0);
  }

  const results = [];
  let successCount = 0;
  let rejectedFoodCount = 0;
  let failCount = 0;

  for (let i = 0; i < products.length; i++) {
    const item = products[i];
    process.stdout.write(`[${i + 1}/${products.length}] Analizando: "${item.source_name}"... `);

    const prompt = `Producto Crudo: "${item.source_name}"\nMarca: "${item.brand || 'No especificada'}"\nGramaje: ${item.package_grams || 'No especificado'}`;

    let response;
    try {
      // Llamada segura con Exponential Backoff
      response = await generateContentWithRetry(prompt, 3);
    } catch (apiError) {
      console.error(`\n❌ ERROR CRÍTICO DE LA API DE GEMINI:`, apiError.message || apiError);
      results.push({
        original_product: item,
        ai_classification: { error: `API_REJECTED: ${apiError.message}` }
      });
      failCount++;
      await sleep(2000); // Respiro de emergencia tras falla total
      continue; // Pasamos al siguiente producto
    }

    try {
      const rawText = response.response.text();
      const parsedJson = safeParseJson(rawText);

      if (parsedJson && parsedJson.is_food === false) {
        results.push({
          original_product: item,
          ai_classification: parsedJson
        });
        console.log(`🚫 Descartado (No es comida). Razón: ${parsedJson.reasoning || 'N/A'}`);
        rejectedFoodCount++;
      } else if (parsedJson && parsedJson.canonical_name) {
        results.push({
          original_product: item,
          ai_classification: parsedJson
        });
        console.log(`✅ Canónico: ${parsedJson.canonical_name} (${parsedJson.category})`);
        successCount++;
      } else {
        throw new Error("JSON inválido o incompleto devuelto por la IA");
      }
    } catch (parseError) {
      console.log(`❌ Error de Parseo: ${parseError.message}`);
      results.push({
        original_product: item,
        ai_classification: { error: parseError.message }
      });
      failCount++;
    }

    // Delay artificial obligatorio entre iteraciones para no ahogar la API (1500ms)
    await sleep(1500);
  }

  const outPath = path.resolve(__dirname, 'sample_ai_classification_100.json');
  fs.writeFileSync(outPath, JSON.stringify(results, null, 2), 'utf8');

  console.log('\n----------------------------------------------------');
  console.log('🎉 Muestreo finalizado (Modo Read-Only).');
  console.log(`✅ Éxitos (Comida validada): ${successCount}`);
  console.log(`🚫 Rechazados (No es comida): ${rejectedFoodCount}`);
  console.log(`⚠️ Errores (API o Parseo): ${failCount}`);
  console.log(`💾 Guardado localmente en: ${outPath}`);
  console.log('----------------------------------------------------');
}

run().catch(err => {
    console.error('❌ Error global de ejecución:', err.message);
    process.exit(1);
});
