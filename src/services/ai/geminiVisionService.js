import { GoogleGenerativeAI } from '@google/generative-ai';
import { z } from 'zod';

const API_KEY = process.env.EXPO_PUBLIC_GEMINI_API_KEY || "TU_API_KEY_AQUI"; 
const genAI = new GoogleGenerativeAI(API_KEY);

// Schemas Zod (igual que antes)
const BoundingBoxSchema = z.tuple([z.number(), z.number(), z.number(), z.number()]);
const MaskPointSchema = z.tuple([z.number(), z.number()]);

export const FoodDetectionSchema = z.object({
  id: z.string(),
  label: z.string(),
  type: z.enum(['plate', 'food', 'ingredient']),
  confidence: z.number().min(0).max(1),
  box_2d: BoundingBoxSchema,
  mask: z.array(MaskPointSchema).optional(),
});

export const FoodAnalysisResultSchema = z.object({
  mealName: z.string(),
  totalCalories: z.number(),
  totalProtein: z.number(),
  totalCarbs: z.number(),
  totalFat: z.number(),
  objects: z.array(FoodDetectionSchema),
});

const SYSTEM_PROMPT = `
You are an expert computer vision AI specialized in food analysis and spatial segmentation.
Analyze the provided image and return ONLY a valid JSON object matching the exact structure requested.

SPATIAL COORDINATE SYSTEM:
You must use a normalized coordinate system from 0 to 1000.
[0, 0] is the top-left corner of the image.
[1000, 1000] is the bottom-right corner of the image.

REQUIREMENTS:
1. Identify the main container/plate ("type": "plate").
2. Identify the primary foods inside the plate ("type": "food").
3. For each object, provide a "box_2d" bounding box in the format: [ymin, xmin, ymax, xmax].
4. For the "plate", you MUST attempt to provide a "mask", which is an array of at least 8 [y, x] coordinate points tracing its outer contour. 
5. Provide accurate nutritional estimates for the entire meal.

JSON STRUCTURE:
{
  "mealName": "String",
  "totalCalories": Number,
  "totalProtein": Number,
  "totalCarbs": Number,
  "totalFat": Number,
  "objects": [
    {
      "id": "unique_string",
      "label": "name of object",
      "type": "plate" | "food" | "ingredient",
      "confidence": Number (0.0 to 1.0),
      "box_2d": [ymin, xmin, ymax, xmax],
      "mask": [[y, x], [y, x], ...]
    }
  ]
}
`;

// Función auxiliar para reintentar en caso de errores temporales (como 503)
const retryAsync = async (fn, retries = 3, delay = 1500) => {
  try {
    return await fn();
  } catch (error) {
    if (retries > 0 && (error.message?.includes('503') || error.message?.includes('overloaded') || error.message?.includes('high demand'))) {
      console.warn(`⚠️ Servidor ocupado (503). Reintentando en ${delay}ms... (Intentos restantes: ${retries})`);
      await new Promise(resolve => setTimeout(resolve, delay));
      return retryAsync(fn, retries - 1, delay * 1.5);
    }
    throw error;
  }
};

export const analyzeFoodImage = async (base64Image) => {
  return retryAsync(async () => {
    const model = genAI.getGenerativeModel({ 
        model: 'gemini-3.6-flash',
        generationConfig: {
            responseMimeType: "application/json",
            temperature: 0.2,
        }
    });

    const imagePart = {
      inlineData: {
        data: base64Image,
        mimeType: 'image/jpeg',
      },
    };

    console.log("🚀 Enviando imagen a Gemini Vision...");
    const result = await model.generateContent([SYSTEM_PROMPT, imagePart]);
    const responseText = result.response.text();
    
    const cleanedText = responseText.replace(/```json\n?|```/g, '').trim();
    const rawData = JSON.parse(cleanedText);
    
    console.log("🛡️ Validando estructura espacial con Zod...");
    const validatedData = FoodAnalysisResultSchema.parse(rawData);
    
    console.log("✅ Análisis completado con éxito:", validatedData.mealName);
    return validatedData;
  });
};