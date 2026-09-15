import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

const getTodayDateString = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const useUserStore = create(
  persist(
    (set, get) => ({
      // 1. Estados
      isOnboarded: false,
      name: 'Nacho',
      goal: 'Ganar Músculo',
      createdAt: null, // Vital para bloquear fechas anteriores en el calendario
      targetMacros: { calories: 0, protein: 0, carbs: 0, fats: 0 },
      consumedMacros: { calories: 0, protein: 0, carbs: 0, fats: 0 },
      meals: [], // Lista de comidas registradas hoy
      avoidedCalories: 0, // Kcal ahorradas por decisiones conscientes
      avoidedCount: 0, // Cantidad de tentaciones evitadas

      // Cuota de escaneos diarios con IA (Límite: 8 fotos/día)
      dailyScans: {
        date: '',
        count: 0
      },
      
      // 2. Historial de días pasados
      // Formato: { "2026-09-03": { status: "success", macros: {...} } }
      history: {},

      // 3. Acción para guardar al terminar el onboarding (Solo se usa una vez)
      saveOnboardingData: (macros, profile = {}) => set((state) => ({
        targetMacros: macros,
        name: profile.name || state.name || 'Nacho',
        goal: profile.goal || state.goal || 'Ganar Músculo',
        isOnboarded: true,
        createdAt: new Date().toISOString(), 
        consumedMacros: { calories: 0, protein: 0, carbs: 0, fats: 0 },
        meals: []
      })),

      // --- Acción para editar macros desde el Home ---
      updateMacros: (newMacros) => set({
        targetMacros: newMacros
      }),

      // 4. Acción para la cámara de Gemini (sumar comida y guardar en lista)
      addConsumedFood: (foodItem) => set((state) => {
        const cals = Number(foodItem.calories) || 0;
        const prot = Number(foodItem.protein) || 0;
        const carbs = Number(foodItem.carbs) || 0;
        const fats = Number(foodItem.fats) || 0;

        const newMeal = {
          id: Date.now().toString(),
          name: foodItem.name || 'Comida escaneada',
          calories: cals,
          protein: prot,
          carbs: carbs,
          fats: fats,
          imageUri: foodItem.imageUri || null,
          ingredients: foodItem.ingredients || [],
          timestamp: new Date().toISOString(),
        };

        return {
          consumedMacros: {
            calories: state.consumedMacros.calories + cals,
            protein: state.consumedMacros.protein + prot,
            carbs: state.consumedMacros.carbs + carbs,
            fats: state.consumedMacros.fats + fats,
          },
          meals: [...state.meals, newMeal]
        };
      }),

      // 5. Acción cuando el usuario decide evitar una tentación (Victoria de disciplina)
      recordAvoidedFood: (foodItem) => set((state) => ({
        avoidedCalories: (state.avoidedCalories || 0) + (Number(foodItem?.calories) || 0),
        avoidedCount: (state.avoidedCount || 0) + 1,
      })),

      // 6. Acción para guardar el resultado de un día en el historial
      saveDailyResult: (dateString, status, finalMacros) => set((state) => ({
        history: {
          ...state.history,
          [dateString]: {
            status: status, // 'success' o 'danger'
            macros: finalMacros
          }
        }
      })),
      
      // 7. Acciones para cuota diaria de escaneos (8 al día)
      getRemainingScans: (maxScans = 8) => {
        const today = getTodayDateString();
        const daily = get().dailyScans;
        if (!daily || daily.date !== today) {
          return maxScans;
        }
        return Math.max(0, maxScans - (Number(daily.count) || 0));
      },

      incrementDailyScans: () => {
        const today = getTodayDateString();
        set((state) => {
          const isSameDay = state.dailyScans?.date === today;
          const currentCount = isSameDay ? (Number(state.dailyScans?.count) || 0) : 0;
          return {
            dailyScans: {
              date: today,
              count: currentCount + 1,
            }
          };
        });
      },

      resetDailyScans: () => set({ dailyScans: { date: '', count: 0 } }),

      // 8. Resetear la cuenta (Logout / Debug)
      resetStore: () => set({ 
        isOnboarded: false, 
        createdAt: null,
        consumedMacros: { calories: 0, protein: 0, carbs: 0, fats: 0 },
        meals: [],
        avoidedCalories: 0,
        avoidedCount: 0,
        dailyScans: { date: '', count: 0 },
        history: {}
      })
    }),
    {
      name: 'zenit-user-storage', 
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);