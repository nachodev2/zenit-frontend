import { GoogleGenerativeAI } from '@google/generative-ai';
import { z } from 'zod';

const API_KEY = process.env.EXPO_PUBLIC_GEMINI_API_KEY || "TU_API_KEY_AQUI"; 
const genAI = new GoogleGenerativeAI(API_KEY);

// Schema limpio y directo
export const FoodAnalysisResultSchema = z.object({
  mealName: z.string(),
  totalCalories: z.number(),
  totalProtein: z.number(),
  totalCarbs: z.number(),
  totalFat: z.number(),
  ingredients: z.array(z.string()),
});

const SYSTEM_PROMPT = `
You are an expert AI nutrition assistant.
Analyze the provided image of food and return ONLY a valid JSON object with the nutritional breakdown.
Do not use markdown wrappers.

CRITICAL RULES:
1. PORTION SIZE: Calculate calories and macros strictly for the EXACT QUANTITY of food visible in the image. 
   - If the image shows 3 slices of pizza, calculate for 3 slices, NOT the whole pizza.
   - If the image shows a bitten apple, calculate for one apple.
   - Estimate the weight/volume visually and provide the most accurate real-world macros for that specific amount.
2. LANGUAGE: The "mealName" and all items in the "ingredients" array MUST be in Spanish (Argentina). 

JSON STRUCTURE:
{
  "mealName": "String (e.g., 'Pizza de Muzzarella (3 porciones)', 'Pera fresca')",
  "totalCalories": Number,
  "totalProtein": Number,
  "totalCarbs": Number,
  "totalFat": Number,
  "ingredients": ["String", "String"]
}
`;

export const analyzeFoodImage = async (base64Image) => {
  try {
    // Usamos Flash, que ahora volará porque no tiene que calcular polígonos
    const model = genAI.getGenerativeModel({ 
        model: 'gemini-3.5-flash-lite',
        generationConfig: {
            responseMimeType: "application/json",
            temperature: 0.2,
        }  
    });

    const imagePart = {
      inlineData: { data: base64Image, mimeType: 'image/jpeg' },
    };

    console.log("🚀 Enviando a Gemini...");
    const result = await model.generateContent([SYSTEM_PROMPT, imagePart]);
    const cleanedText = result.response.text().replace(/```json\n?|```/g, '').trim();
    
    const parsedData = JSON.parse(cleanedText);
    return FoodAnalysisResultSchema.parse(parsedData);
  } catch (error) {
    console.error("❌ Error en la IA:", error);
    throw error;
  }
};