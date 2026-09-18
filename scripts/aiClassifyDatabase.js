// Polyfill de WebSocket para Node.js < 22
if (typeof global.WebSocket === 'undefined') {
  global.WebSocket = class DummyWebSocket {};
}

const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const { createClient } = require('@supabase/supabase-js');
const { GoogleGenerativeAI } = require('@google/generative-ai');

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
// Bypass explícito de RLS para escritura backend
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;
const geminiApiKey = process.env.EXPO_PUBLIC_GEMINI_API_KEY;

if (!supabaseUrl || !supabaseKey || !geminiApiKey) {
  console.error('❌ Faltan credenciales en el .env (Asegurate de tener SUPABASE_SERVICE_ROLE_KEY y EXPO_PUBLIC_GEMINI_API_KEY)');
  process.exit(1);
}

if (supabaseKey === process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY) {
  console.warn('⚠️ ATENCIÓN: Estás usando la ANON_KEY. Los inserts van a fallar por RLS. Asegurate de configurar SUPABASE_SERVICE_ROLE_KEY.');
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
  model: 'gemini-3.5-flash-lite', // Equivalente técnico al Lite actual en la API
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
 * Exponential Backoff para sortear caídas o saturación de Gemini API
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
        throw apiError;
      }
      
      const delayMs = Math.pow(2, attempt) * 1000 + Math.random() * 500;
      console.log(`\n⚠️ Saturación de API detectada (Intento ${attempt}/${maxRetries}). Reintentando en ${Math.round(delayMs / 1000)}s...`);
      await sleep(delayMs);
    }
  }
}

async function run() {
  console.log('🧪 Iniciando Clasificación y Canonicalización en Base de Datos...');

  // Traer pendientes (en bloques de 1000 para procesar grandes catálogos progresivamente)
  const { data: products, error } = await supabase
    .from('products')
    .select('id, source_name, brand, package_grams')
    .eq('status', 'pending_review')
    .limit(1000);

  if (error) {
    console.error("❌ Error de SQL al consultar products:", error.message);
    process.exit(1);
  }

  if (!products || products.length === 0) {
      console.log("✅ No hay productos pendientes de revisión ('pending_review').");
      process.exit(0);
  }

  console.log(`📦 Procesando lote de ${products.length} productos...`);

  let successCount = 0;
  let rejectedFoodCount = 0;
  let errorCount = 0;

  for (let i = 0; i < products.length; i++) {
    const item = products[i];
    
    try {
      const prompt = `Producto Crudo: "${item.source_name}"\nMarca: "${item.brand || 'No especificada'}"\nGramaje: ${item.package_grams || 'No especificado'}`;
      
      const response = await generateContentWithRetry(prompt, 3);
      const rawText = response.response.text();
      const parsedJson = safeParseJson(rawText);

      if (!parsedJson) {
         throw new Error("JSON inválido o incompleto devuelto por la IA");
      }

      if (parsedJson.is_food === false) {
        // 1. Descartar: No es comida
        const { error: updateError } = await supabase
           .from('products')
           .update({ status: 'inactive' })
           .eq('id', item.id);
        
        if (updateError) throw updateError;
        
        console.log(`[${i+1}/${products.length}] 🚫 Descartado (No comida): "${item.source_name}"`);
        rejectedFoodCount++;
        
      } else {
        // 2. Es comida: Buscar el Canónico
        const canonicalName = parsedJson.canonical_name;
        if (!canonicalName) throw new Error("Falta canonical_name en JSON de respuesta de IA");

        // a. Verificamos si este canónico ya existe en DB (Ej: "Espinaca")
        let { data: existingCanonical, error: searchError } = await supabase
            .from('canonical_foods')
            .select('id')
            .eq('canonical_name', canonicalName)
            .limit(1);

        if (searchError) throw searchError;

        let canonicalId = null;

        if (existingCanonical && existingCanonical.length > 0) {
            // c. Ya existe: Agrupamos el producto comercial bajo el canónico existente
            canonicalId = existingCanonical[0].id;
        } else {
            // b. No existe: Lo insertamos por primera vez
            const { data: newCanonical, error: insertError } = await supabase
                .from('canonical_foods')
                .insert({
                  canonical_name: canonicalName,
                  display_name: canonicalName,
                  category: parsedJson.category || 'otros',
                  subcategory: parsedJson.subcategory || null,
                  food_type: parsedJson.food_type || null,
                  serving_mode: parsedJson.serving_mode || 'packaged_volume',
                  calories_100g: 0, // A determinar en Fase 4
                  protein_100g: 0,
                  carbs_100g: 0,
                  fats_100g: 0,
                  macro_source: 'legacy_heuristic', 
                  classification_method: 'ai',
                  classification_confidence: parsedJson.confidence || 0,
                  classification_reason: parsedJson.reasoning || null
                })
                .select('id')
                .single();

            if (insertError) throw insertError;
            canonicalId = newCanonical.id;
        }

        // d. Enlazamos el producto comercial con su 'padre' canónico y lo activamos
        const { error: finalUpdateError } = await supabase
           .from('products')
           .update({
               canonical_food_id: canonicalId,
               status: 'active'
           })
           .eq('id', item.id);

        if (finalUpdateError) throw finalUpdateError;

        console.log(`[${i+1}/${products.length}] ✅ Enlazado: "${item.source_name}" -> Canónico: "${canonicalName}"`);
        successCount++;
      }

    } catch (err) {
      console.error(`\n[${i+1}/${products.length}] ❌ Error procesando "${item.source_name}": ${err.message}`);
      errorCount++;
    }

    // Delay de seguridad mandatario para no golpear los límites de Gemini Free/Lite (1 segundo)
    await sleep(1000);
  }

  console.log('\n----------------------------------------------------');
  console.log('🎉 Clasificación en Base de Datos Finalizada.');
  console.log(`✅ Canónicos enlazados/activados: ${successCount}`);
  console.log(`🚫 Productos desactivados (No comida): ${rejectedFoodCount}`);
  console.log(`⚠️ Errores totales (Parseo/SQL/API): ${errorCount}`);
  console.log('----------------------------------------------------');
}

run().catch(err => {
    console.error('❌ Error global de ejecución:', err.message);
    process.exit(1);
});

