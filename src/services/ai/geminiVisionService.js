import { GoogleGenerativeAI } from '@google/generative-ai';
import { z } from 'zod';

const API_KEY = process.env.EXPO_PUBLIC_GEMINI_API_KEY || "TU_API_KEY_AQUI"; 
const genAI = new GoogleGenerativeAI(API_KEY);

export const FoodAnalysisResultSchema = z.object({
  isFood: z.boolean(),
  mealName: z.string(),
  totalCalories: z.number(),
  totalProtein: z.number(),
  totalCarbs: z.number(),
  totalFat: z.number(),
  ingredients: z.array(z.string()),
  servingType: z.enum(['unit_or_dish', 'container_or_bulk']).catch('unit_or_dish'),
  containerDescription: z.string().optional().catch(''),
  defaultServingLabel: z.string().optional().catch(''),
  portionPresets: z.array(z.object({
    label: z.string(),
    multiplier: z.number(),
  })).optional().catch([]),
});

const SYSTEM_PROMPT = `
Sos un nutricionista experto y un sistema de análisis de alimentos de altísima precisión.
Analiza la imagen proporcionada y devuelve ÚNICAMENTE un objeto JSON válido.
No uses envoltorios markdown.

REGLAS CRÍTICAS PARA MAXIMIZAR LA PRECISIÓN:
1. ¿ES COMIDA?: Primero, determina si la imagen contiene comida o bebida. Si NO contiene, setea "isFood" en false y llena el resto con 0s y un "mealName" como "Not Food". No analices laptops, personas ni escritorios.
2. RECONOCIMIENTO COMERCIAL (PRIORIDAD ABSOLUTA): Si la imagen muestra un producto empaquetado, una marca reconocible o un producto ultraprocesado famoso (ej. Alfajor Havanna, Oreo, Coca-Cola, barra de proteína), NO inventes promedios genéricos. BUSCÁ en tu base de conocimientos los valores nutricionales oficiales de la etiqueta de esa marca y variante específica, y devolvé esos números exactos.
3. DENSIDAD Y REGIONALISMO (ARGENTINA): Si ves panadería, pastelería o repostería de Sudamérica (alfajores, facturas, empanadas, tartas), asumí una MUY ALTA densidad calórica. Contemplá el peso del dulce de leche repostero y la "grasa invisible" (manteca, grasa de pella, margarina en las masas).
4. COMIDA CASERA Y GRASAS OCULTAS: Si es comida casera o de restaurante, asumí el uso de aceites de cocción. Añadí siempre un margen de grasas (y por ende calorías) que suelen estar ocultas en salsas, salteados o frituras.
5. TAMAÑO DE PORCIÓN: Si es comida casera servida, calcula los macros ESTRICTAMENTE para la CANTIDAD EXACTA visible en la imagen.
6. IDIOMA: El "mealName" y todos los items en el array "ingredients" DEBEN estar en Español (Argentina).
7. CLASIFICACIÓN DE ENVASE vs PLATO SERVIDO (FRACCIONAMIENTO INTELIGENTE):
   - 'unit_or_dish': Platos servidos, frutas individuales (naranja, manzana, banana), una taza de café, o comida para consumir en el momento. En este caso "portionPresets" debe contener: [{"label": "Todo (100%)", "multiplier": 1.0}, {"label": "3/4 (75%)", "multiplier": 0.75}, {"label": "Mitad (50%)", "multiplier": 0.5}, {"label": "1/4 (25%)", "multiplier": 0.25}].
   - 'container_or_bulk': Envases multiporción, potes (ej. pote de dulce de leche de 400g, tarro de helado de 1kg, paquete de galletitas, bolsa de frutos secos). En este caso, calcula "totalCalories", "totalProtein", etc. para TODO EL ENVASE VISIBLE. Proporciona "containerDescription" (ej. "Pote de 400g"), "defaultServingLabel" (ej. "1 Cucharada (~25g)") y "portionPresets" con multiplicadores reales respecto al total (ej. [{"label": "1 Cuch. (~25g)", "multiplier": 0.0625}, {"label": "2 Cuch. (~50g)", "multiplier": 0.125}, {"label": "1/4 Envase", "multiplier": 0.25}, {"label": "Envase Entero", "multiplier": 1.0}]).

ESTRUCTURA JSON OBLIGATORIA:
{
  "isFood": Boolean,
  "mealName": "String",
  "totalCalories": Number,
  "totalProtein": Number,
  "totalCarbs": Number,
  "totalFat": Number,
  "ingredients": ["String", "String"],
  "servingType": "unit_or_dish" | "container_or_bulk",
  "containerDescription": "String",
  "defaultServingLabel": "String",
  "portionPresets": [
    { "label": "String", "multiplier": Number }
  ]
}
`;

const retryAsync = async (fn, retries = 3, delay = 1500) => {
  try {
    return await fn();
  } catch (error) {
    if (retries > 0 && (error.message?.includes('503') || error.message?.includes('overloaded'))) {
      await new Promise(resolve => setTimeout(resolve, delay));
      return retryAsync(fn, retries - 1, delay * 1.5);
    }
    throw error;
  }
};

export const analyzeFoodImage = async (base64Image) => {
  return retryAsync(async () => {
    const model = genAI.getGenerativeModel({ 
        model: 'gemini-3.5-flash-lite', 
        generationConfig: { responseMimeType: "application/json", temperature: 0.1 }
    });

    const imagePart = { inlineData: { data: base64Image, mimeType: 'image/jpeg' } };
    const result = await model.generateContent([SYSTEM_PROMPT, imagePart]);
    const cleanedText = result.response.text().replace(/```json\n?|```/g, '').trim();
    return FoodAnalysisResultSchema.parse(JSON.parse(cleanedText));
  });
};

export const generateInitialCoachWidgets = async (foodData, userData) => {
    return retryAsync(async () => {
        const model = genAI.getGenerativeModel({ 
            model: 'gemini-3.5-flash-lite',
            generationConfig: { responseMimeType: "application/json", temperature: 0.1 }
        });

        const prompt = `
        Sos Zenit Coach, un nutricionista deportivo de Argentina.
        Evaluá este alimento contra los macros restantes del atleta y devolvé un JSON estricto.

        ATLETA: ${userData.name}, Objetivo: ${userData.goal}
        MACROS RESTANTES HOY: Calorías: ${userData.macros.calories} | Proteínas: ${userData.macros.protein}g | Carbos: ${userData.macros.carbs}g | Grasas: ${userData.macros.fats}g
        ALIMENTO ESCANEADO: ${foodData.mealName} (Calorías: ${foodData.totalCalories}, Prot: ${foodData.totalProtein}g, Carbo: ${foodData.totalCarbs}g, Grasa: ${foodData.totalFat}g)

        Reglas del JSON:
        - nutritionalScore: 1 a 5 (Calidad del alimento en sí mismo, fibra, tipo de grasa, etc).
        - nutritionalDesc: Breve análisis del alimento (máximo 2 líneas).
        - impactScore: 1 a 5 (Qué tan bien encaja en sus macros RESTANTES actuales).
        - impactDesc: Cómo afecta a sus macros de hoy, mencionando proteínas, carbos o grasas, no solo calorías.
        - welcomeMessage: Un saludo inicial analítico ("Qué tal ${userData.name}. Mirá, este alimento...") de 2 líneas.

        FORMATO EXACTO:
        {
          "nutritionalScore": 2,
          "nutritionalDesc": "...",
          "impactScore": 3,
          "impactDesc": "...",
          "welcomeMessage": "..."
        }
        `;

        const result = await model.generateContent(prompt);
        const text = result.response.text().replace(/```json\n?|```/g, '').trim();
        return JSON.parse(text);
    });
};

// ==========================================
// ACTUALIZADO: EL CHAT DEL COACH (CERO TOLERANCIA)
// ==========================================
export const chatWithCoach = async (foodData, userMessage, chatHistory = [], userData = {}) => {
    return retryAsync(async () => {
        const model = genAI.getGenerativeModel({ 
            model: 'gemini-3.5-flash-lite', 
            generationConfig: { temperature: 0.1 } // Bajamos aún más la temperatura para evitar alucinaciones
        });

        const transcript = chatHistory.length > 0 
            ? chatHistory.map(msg => `${msg.role === 'user' ? 'Usuario' : 'Coach'}: ${msg.text}`).join('\n')
            : "No hay mensajes previos.";

        const prompt = `
        Sos una IA asistente integrada dentro de la app "Zenit". Tu función es EXCLUSIVA y TEMPORAL: asistir al usuario evaluando el alimento que acaba de escanear y cómo encaja en su día. NO SOS UN CHATBOT ILIMITADO.

        DATOS EN TIEMPO REAL PROVISTOS POR LA APP (Sistema automatizado):
        - Usuario: ${userData.name} | Objetivo: ${userData.goal}
        - MACROS RESTANTES EN SU DÍA: Kcal: ${userData.macros.calories} | Prot: ${userData.macros.protein}g | Carbos: ${userData.macros.carbs}g | Grasas: ${userData.macros.fats}g
        
        ALIMENTO EN PANTALLA AHORA:
        ${foodData.mealName} (Kcal: ${foodData.totalCalories} | Prot: ${foodData.totalProtein}g | Carbos: ${foodData.totalCarbs}g | Grasas: ${foodData.totalFat}g)

        HISTORIAL DEL CHAT:
        ${transcript}

        MENSAJE DEL USUARIO: "${userMessage}"

        REGLAS ESTRICTAS E INQUEBRANTABLES:
        1. CONCIENCIA DE LOS DATOS: Vos YA SABÉS cuáles son los macros restantes del usuario. La app te los está pasando arriba en "MACROS RESTANTES EN SU DÍA". NUNCA le pidas al usuario que te pase planillas, registros, ni le digas que "no podés adivinar". Si te pregunta cómo viene o qué le queda, leé esos números y respondéle directo.
        2. FUERA DE TÓPICO (GUARDRAIL): Si el usuario te pregunta cosas que NO tienen que ver con nutrición, fitness, su objetivo actual o el alimento en pantalla (ej: clima, historia, escribir código, chistes), respondé EXACTAMENTE esto: "Solo puedo asesorarte sobre el alimento que escaneaste y tus macros diarios."
        3. FOCO INTEGRAL: Analizá cómo el alimento afecta Proteínas, Carbohidratos y Grasas respecto a su Objetivo. No mires solo las calorías.
        4. TONO: Prohibido saludar ("Hola", "Buenas"). Sé cortante, analítico, argentino ("vos") y máximo 3 oraciones.
        `;

        const result = await model.generateContent(prompt);
        return result.response.text().trim();
    });
};

// Paso 1: Transcribe el audio rapidísimo con el modelo más liviano posible
const transcribeAudio = async (base64Audio, mimeType) => {
    const model = genAI.getGenerativeModel({ 
        model: 'gemini-3.5-flash-lite',
        generationConfig: { temperature: 0 }
    });

    const audioPart = { inlineData: { data: base64Audio, mimeType } };
    const result = await model.generateContent([
        'Transcribí exactamente lo que dice el audio. Solo devolvé el texto, sin comentarios ni explicaciones.',
        audioPart
    ]);
    return result.response.text().trim();
};

// Paso 2: Usa el transcripto como mensaje de texto normal (instantáneo)
export const chatWithCoachAudio = async (foodData, base64Audio, mimeType, chatHistory = [], userData = {}) => {
    return retryAsync(async () => {
        // Primero transcribimos el audio a texto
        const userText = await transcribeAudio(base64Audio, mimeType);

        // Luego lo mandamos al chat de texto normal (mucho más rápido)
        return chatWithCoach(foodData, userText, chatHistory, userData);
    });
};