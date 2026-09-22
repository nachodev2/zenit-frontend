// =================================================================
// ZENIT - FASE 4B: RESOLUCIÓN DE MACROS CON IA (FALLBACK USDA / INTA)
// Determina macros cada 100g para canonical_foods pendientes usando Gemini
// =================================================================

// Polyfill de WebSocket para Node.js < 22 al usar @supabase/supabase-js
if (typeof global.WebSocket === 'undefined') {
  global.WebSocket = class DummyWebSocket {};
}

const path = require('path');
const { createClient } = require('@supabase/supabase-js');
const { GoogleGenerativeAI } = require('@google/generative-ai');

// 1. Cargar variables de entorno desde .env
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Faltan las variables de Supabase en el .env');
  process.exit(1);
}

if (supabaseKey === process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY) {
  console.warn('⚠️ ATENCIÓN: Estás usando la ANON_KEY. Los updates pueden ser bloqueados por RLS. Asegurate de tener SUPABASE_SERVICE_ROLE_KEY en el .env.');
}

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: { persistSession: false },
});

// -----------------------------------------------------------------
// 2. LECTURA DE MÚLTIPLES CLAVES (GEMINI_API_KEYS / Fallbacks)
// -----------------------------------------------------------------
let apiKeys = [];
if (process.env.GEMINI_API_KEYS) {
  apiKeys = process.env.GEMINI_API_KEYS.split(',').map((k) => k.trim()).filter(Boolean);
} else if (process.env.GEMINI_API_KEY) {
  apiKeys = process.env.GEMINI_API_KEY.split(',').map((k) => k.trim()).filter(Boolean);
} else if (process.env.EXPO_PUBLIC_GEMINI_API_KEY) {
  apiKeys = process.env.EXPO_PUBLIC_GEMINI_API_KEY.split(',').map((k) => k.trim()).filter(Boolean);
}

if (apiKeys.length === 0) {
  console.error('❌ No se encontraron API Keys de Gemini en el .env (GEMINI_API_KEYS)');
  process.exit(1);
}

// -----------------------------------------------------------------
// 3. CLASE KEYMANAGER: KEY POOL & ROTACIÓN AUTOMÁTICA
// -----------------------------------------------------------------
class KeyManager {
  constructor(keys) {
    this.keys = keys;
    this.currentIndex = 0;
    this._initModel();
  }

  _initModel() {
    const activeKey = this.keys[this.currentIndex];
    const genAI = new GoogleGenerativeAI(activeKey);
    this.model = genAI.getGenerativeModel({
      model: 'gemini-3.5-flash-lite',
      generationConfig: {
        responseMimeType: 'application/json',
        temperature: 0.1,
      },
    });
  }

  getModel() {
    return this.model;
  }

  rotateKey(reason = 'Cuota excedida') {
    this.currentIndex++;
    if (this.currentIndex >= this.keys.length) {
      throw new Error('❌ Se agotaron todas las API Keys del pool.');
    }
    console.warn(`\n⚠️ Rotando a la API Key [${this.currentIndex + 1}/${this.keys.length}] por: ${reason}`);
    this._initModel();
    return this.model;
  }
}

const keyManager = new KeyManager(apiKeys);
console.log(`🔑 Key Pool inicializado con ${apiKeys.length} API Key(s) disponibles.`);

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const safeParseJson = (rawText) => {
  try {
    const cleaned = rawText.replace(/```(?:json)?\s*/gi, '').replace(/```/g, '').trim();
    return JSON.parse(cleaned);
  } catch (e) {
    return null;
  }
};

/**
 * Realiza la llamada a Gemini soportando rotación de API Keys (Failover)
 * y reintentos transparentes distinguiendo límites por minuto (15 RPM)
 * de límites diarios (500 RPD).
 */
async function generateContentWithFailover(prompt, manager) {
  let minuteRetries = 0;
  const MAX_MINUTE_RETRIES = 3;

  while (true) {
    try {
      const model = manager.getModel();
      const result = await model.generateContent(prompt);
      minuteRetries = 0; // Reiniciar contador de reintentos tras éxito
      return result;
    } catch (apiError) {
      const errorMsg = apiError?.message || '';
      const lowerMsg = errorMsg.toLowerCase();
      const status = apiError?.status || apiError?.statusCode;

      const is429 =
        status === 429 ||
        lowerMsg.includes('429') ||
        lowerMsg.includes('quota') ||
        lowerMsg.includes('resourceexhausted') ||
        lowerMsg.includes('resource_exhausted');

      if (is429) {
        // 1. Identificar si es claramente el límite diario o se agotaron los reintentos del minuto
        const isDailyLimit =
          errorMsg.includes('PerDay') ||
          lowerMsg.includes('perday') ||
          errorMsg.includes('limit: 500') ||
          lowerMsg.includes('limit: 500') ||
          lowerMsg.includes('requests per day') ||
          minuteRetries >= MAX_MINUTE_RETRIES;

        // 2. Identificar si es límite por minuto (RPM) o solicitud de espera
        const isMinuteLimit =
          errorMsg.includes('PerMinute') ||
          lowerMsg.includes('perminute') ||
          errorMsg.includes('limit: 15') ||
          lowerMsg.includes('limit: 15') ||
          lowerMsg.includes('requests per minute') ||
          lowerMsg.includes('retry in') ||
          lowerMsg.includes('retry after') ||
          !isDailyLimit; // Fallback: si no es diario, asumimos límite temporal de minuto

        if (!isDailyLimit && isMinuteLimit) {
          minuteRetries++;
          // Log en color amarillo
          console.warn('\x1b[33m⚠️ Límite por minuto alcanzado. Pausando 60 segundos...\x1b[0m');
          await new Promise((resolve) => setTimeout(resolve, 60000));
          // Reintentar el mismo producto con la misma llave
          continue;
        }

        // Límite diario alcanzado: Rotación de llave
        manager.rotateKey('Cuota diaria agotada');
        minuteRetries = 0;
        // Reintentar el producto con la nueva llave activa
        continue;
      }

      // Manejo de sobrecargas temporales del servicio (503)
      const isTransient = lowerMsg.includes('503') || lowerMsg.includes('overloaded') || lowerMsg.includes('econnreset');
      if (isTransient) {
        console.warn('⚠️ Sobrecarga transitoria del servicio (503). Esperando 3s antes de reintentar...');
        await sleep(3000);
        continue;
      }

      throw apiError;
    }
  }
}

async function run() {
  console.log('🧪 Iniciando Fase 4B: Resolución Bromatológica con IA (USDA / Argenfoods INTA)...');

  const PAGE_SIZE = 100;
  let totalEvaluated = 0;
  let totalResolved = 0;
  let totalErrors = 0;

  while (true) {
    // -------------------------------------------------------------
    // PASO 1: Consulta DB de canonical_foods con calories_100g = 0 o NULL
    // Excluyendo los ya resueltos por este script (classification_reason)
    // -------------------------------------------------------------
    const { data: canonicalList, error: fetchError } = await supabase
      .from('canonical_foods')
      .select('id, canonical_name, display_name, category, calories_100g')
      .or('calories_100g.eq.0,calories_100g.is.null')
      .neq('classification_reason', 'Fallback bromatológico USDA/Argenfoods (INTA)')
      .limit(PAGE_SIZE);

    if (fetchError) {
      console.error('❌ Error consultando canonical_foods:', fetchError.message);
      process.exit(1);
    }

    if (!canonicalList || canonicalList.length === 0) {
      console.log('\n✅ No hay más alimentos pendientes de resolución de macros.');
      break;
    }

    console.log(`\n📦 Procesando lote de ${canonicalList.length} alimentos canónicos pendientes...`);

    for (let i = 0; i < canonicalList.length; i++) {
      const canonical = canonicalList[i];
      totalEvaluated++;

      // -----------------------------------------------------------
      // PASO 2: Prompt de IA exacto solicitado
      // -----------------------------------------------------------
      const prompt = `Sos un experto en bromatología. Usando como referencia la base de datos oficial del USDA y Argenfoods (INTA), determiná los macronutrientes cada 100g de la porción comestible de este alimento genérico: '${canonical.canonical_name}'. Respondé ÚNICAMENTE con un JSON válido con esta estructura exacta y sin formato markdown: {"calories": 0, "protein": 0.0, "carbs": 0.0, "fats": 0.0}`;

      try {
        const response = await generateContentWithFailover(prompt, keyManager);
        const rawText = response.response.text();
        const parsed = safeParseJson(rawText);

        if (!parsed || parsed.calories === undefined) {
          throw new Error(`Respuesta inválida de Gemini: ${rawText}`);
        }

        // Mapeo numérico seguro
        const calories = Math.round(Number(parsed.calories || 0));
        const protein = Number(Number(parsed.protein || 0).toFixed(1));
        const carbs = Number(Number(parsed.carbs || 0).toFixed(1));
        const fats = Number(Number(parsed.fats || 0).toFixed(1));

        // -----------------------------------------------------------
        // PASO 3: Actualización en canonical_foods
        // El constraint CHECK de la DB acepta ('official_table', 'label_ocr', 'off_barcode', 'ai_estimated', 'legacy_heuristic')
        // Usamos 'ai_estimated' con classification_reason para trazabilidad
        // -----------------------------------------------------------
        const updatePayload = {
          calories_100g: calories,
          protein_100g: protein,
          carbs_100g: carbs,
          fats_100g: fats,
          macro_source: 'ai_estimated',
          classification_reason: 'Fallback bromatológico USDA/Argenfoods (INTA)',
          updated_at: new Date().toISOString(),
        };

        const { error: updateError } = await supabase
          .from('canonical_foods')
          .update(updatePayload)
          .eq('id', canonical.id);

        if (updateError) {
          throw new Error(`Error de base de datos al actualizar: ${updateError.message}`);
        }

        totalResolved++;
        console.log(`✅ Macros USDA para "${canonical.canonical_name}" resueltos (Kcal: ${calories}, P: ${protein}, C: ${carbs}, G: ${fats})`);

      } catch (err) {
        totalErrors++;
        console.error(`❌ Error procesando "${canonical.canonical_name}":`, err.message);
      }

      // Delay de 1500ms entre llamadas para respetar el rate limit de 15 RPM
      await sleep(1500);
    }
  }

  console.log('\n----------------------------------------------------');
  console.log('🎉 Resolución de Macros con IA Finalizada.');
  console.log(`📊 Total evaluados: ${totalEvaluated}`);
  console.log(`✅ Total resueltos exitosamente: ${totalResolved}`);
  console.log(`⚠️ Total errores: ${totalErrors}`);
  console.log('----------------------------------------------------');
}

run().catch((err) => {
  console.error('❌ Error global de ejecución:', err.message);
  process.exit(1);
});
