import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const useUserStore = create(
  persist(
    (set) => ({
      // 1. Estados
      isOnboarded: false,
      createdAt: null, // Vital para bloquear fechas anteriores en el calendario
      targetMacros: { calories: 0, protein: 0, carbs: 0, fats: 0 },
      consumedMacros: { calories: 0, protein: 0, carbs: 0, fats: 0 },
      
      // 2. Historial de días pasados
      // Formato: { "2026-09-03": { status: "success", macros: {...} } }
      history: {},

      // 3. Acción para guardar al terminar el onboarding (Solo se usa una vez)
      saveOnboardingData: (macros) => set({
        targetMacros: macros,
        isOnboarded: true,
        createdAt: new Date().toISOString(), 
        consumedMacros: { calories: 0, protein: 0, carbs: 0, fats: 0 } 
      }),

      // --- NUEVO: Acción para editar macros desde el Home ---
      updateMacros: (newMacros) => set({
        targetMacros: newMacros
      }),

      // 4. Acción para la cámara de Gemini (sumar comida)
      addConsumedFood: (foodMacros) => set((state) => ({
        consumedMacros: {
          calories: state.consumedMacros.calories + foodMacros.calories,
          protein: state.consumedMacros.protein + foodMacros.protein,
          carbs: state.consumedMacros.carbs + foodMacros.carbs,
          fats: state.consumedMacros.fats + foodMacros.fats,
        }
      })),

      // 5. Acción para guardar el resultado de un día en el historial
      saveDailyResult: (dateString, status, finalMacros) => set((state) => ({
        history: {
          ...state.history,
          [dateString]: {
            status: status, // 'success' o 'danger'
            macros: finalMacros
          }
        }
      })),
      
      // 6. Resetear la cuenta (Logout / Debug)
      resetStore: () => set({ 
        isOnboarded: false, 
        createdAt: null,
        consumedMacros: { calories: 0, protein: 0, carbs: 0, fats: 0 },
        history: {}
      })
    }),
    {
      name: 'zenit-user-storage', 
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);