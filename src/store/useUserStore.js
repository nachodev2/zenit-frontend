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

      // Hidratación diaria
      dailyWater: {
        date: '',
        amountMl: 0,
        targetMl: 2500,
      },

      // Configuración de recordatorios de agua
      waterReminder: {
        enabled: true,
        intervalMinutes: 90,
        startHour: 8,
        endHour: 22,
      },

      // Registro de Peso & Biometría
      weightTracker: {
        currentWeightKg: 74.8,
        muscleMassKg: 35.2,
        bodyFatPct: 15.4,
        bmi: 22.8,
        targetWeightKg: 78.0,
        lastUpdated: getTodayDateString(),
        history: [
          { date: '2026-09-08', weightKg: 75.6, muscleMassKg: 34.9, bodyFatPct: 15.8, bmi: 23.0 },
          { date: '2026-09-01', weightKg: 76.2, muscleMassKg: 34.6, bodyFatPct: 16.2, bmi: 23.2 },
        ],
      },

      // Estado de conexión a dispositivos inteligentes (Bluetooth scale / smartwatch)
      smartDevice: {
        connected: false,
        deviceName: null,
        type: null,
      },

      // Alimentos Favoritos, Recetario Propio y Productos Custom (FoodScreen)
      favorites: [
        {
          id: 'fav-1',
          name: 'Pechuga de Pollo con Arroz y Palta',
          calories: 520,
          protein: 48,
          carbs: 55,
          fats: 12,
          isFavorite: true,
          timestamp: new Date().toISOString(),
        },
        {
          id: 'fav-2',
          name: 'Bowl de Yogur con Avena y Frutos Rojos',
          calories: 340,
          protein: 22,
          carbs: 45,
          fats: 8,
          isFavorite: true,
          timestamp: new Date().toISOString(),
        }
      ],
      recipes: [
        {
          id: 'rec-1',
          name: 'Tortilla de Avena y Claras',
          servings: 1,
          totalMacros: { calories: 380, protein: 32, carbs: 42, fats: 6 },
          ingredients: [
            { name: 'Claras de huevo', amount: '4 unidades', calories: 68, protein: 14, carbs: 1, fats: 0 },
            { name: 'Huevo entero', amount: '1 unidad', calories: 72, protein: 6, carbs: 0.5, fats: 5 },
            { name: 'Avena instantánea', amount: '60g', calories: 240, protein: 12, carbs: 40.5, fats: 1 },
          ]
        },
        {
          id: 'rec-2',
          name: 'Batido Proteico Post-Entreno',
          servings: 1,
          totalMacros: { calories: 310, protein: 35, carbs: 36, fats: 3 },
          ingredients: [
            { name: 'Proteína Whey', amount: '30g (1 scoop)', calories: 120, protein: 24, carbs: 2, fats: 1.5 },
            { name: 'Leche descremada', amount: '250ml', calories: 85, protein: 8, carbs: 12, fats: 0.5 },
            { name: 'Banana madura', amount: '1 mediana', calories: 105, protein: 1.3, carbs: 27, fats: 0.3 },
          ]
        }
      ],
      customProducts: [],
      // Carrito de compras para armar recetas
      recipeCart: [],
      
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

      getDailyScansCount: () => {
        const today = getTodayDateString();
        const daily = get().dailyScans;
        if (!daily || daily.date !== today) {
          return 0;
        }
        return Number(daily.count) || 0;
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

      // 8. Acciones de Hidratación
      getDailyWater: () => {
        const today = getTodayDateString();
        const water = get().dailyWater;
        if (!water || water.date !== today) {
          const prevDate = water?.date;
          const prevAmount = Number(water?.amountMl) || 0;
          const target = water?.targetMl || 2500;

          // Si cambió el día (ej: medianoche), archivamos el agua en el historial y reseteamos el estado a 0 ml para hoy
          if (prevDate && prevDate !== today) {
            set((state) => {
              const existingDay = state.history?.[prevDate] || {};
              return {
                history: {
                  ...state.history,
                  [prevDate]: {
                    ...existingDay,
                    waterMl: prevAmount,
                  },
                },
                dailyWater: {
                  date: today,
                  amountMl: 0,
                  targetMl: target,
                },
              };
            });
          } else {
            set(() => ({
              dailyWater: {
                date: today,
                amountMl: 0,
                targetMl: target,
              },
            }));
          }

          return { date: today, amountMl: 0, targetMl: target };
        }
        return water;
      },

      addWater: (amountMl = 250) => {
        const today = getTodayDateString();
        set((state) => {
          const isSameDay = state.dailyWater?.date === today;
          const current = isSameDay ? (Number(state.dailyWater?.amountMl) || 0) : 0;
          const target = state.dailyWater?.targetMl || 2500;
          return {
            dailyWater: {
              date: today,
              amountMl: Math.max(0, current + amountMl),
              targetMl: target,
            }
          };
        });
      },

      setWater: (amountMl) => {
        const today = getTodayDateString();
        set((state) => ({
          dailyWater: {
            date: today,
            amountMl: Math.max(0, Number(amountMl) || 0),
            targetMl: state.dailyWater?.targetMl || 2500,
          }
        }));
      },

      setWaterTarget: (targetMl) => {
        set((state) => ({
          dailyWater: {
            ...state.dailyWater,
            targetMl: Math.max(500, Number(targetMl) || 2500),
          }
        }));
      },

      setWaterReminder: (reminderConfig) => {
        set((state) => ({
          waterReminder: {
            ...state.waterReminder,
            ...reminderConfig,
          }
        }));
      },

      // 9. Acciones de Peso & Biometría
      logWeight: (weightKg, muscleMassKg = null, bodyFatPct = null, bmi = null) => {
        const today = getTodayDateString();
        const numWeight = Number(weightKg) || 0;
        const numMuscle = muscleMassKg !== null ? Number(muscleMassKg) : null;
        const numFat = bodyFatPct !== null ? Number(bodyFatPct) : null;
        const numBmi = bmi !== null ? Number(bmi) : null;
        if (numWeight <= 0) return;

        set((state) => {
          const newEntry = {
            date: today,
            weightKg: numWeight,
            muscleMassKg: numMuscle !== null ? numMuscle : state.weightTracker?.muscleMassKg,
            bodyFatPct: numFat !== null ? numFat : state.weightTracker?.bodyFatPct,
            bmi: numBmi !== null ? numBmi : state.weightTracker?.bmi,
          };
          const existingHistory = state.weightTracker?.history || [];
          const filteredHistory = existingHistory.filter(h => h.date !== today);

          return {
            weightTracker: {
              ...state.weightTracker,
              currentWeightKg: numWeight,
              muscleMassKg: newEntry.muscleMassKg,
              bodyFatPct: newEntry.bodyFatPct,
              bmi: newEntry.bmi,
              lastUpdated: today,
              history: [newEntry, ...filteredHistory].slice(0, 30),
            }
          };
        });
      },

      setSmartDevice: (device) => set({ smartDevice: device }),

      // 10. Acciones de FoodScreen (Favoritos, Recetas, Productos)
      toggleFavorite: (mealItem) => {
        set((state) => {
          const existingFavorites = state.favorites || [];
          const exists = existingFavorites.some((f) => f.id === mealItem.id || f.name.toLowerCase() === mealItem.name.toLowerCase());
          if (exists) {
            return {
              favorites: existingFavorites.filter((f) => f.id !== mealItem.id && f.name.toLowerCase() !== mealItem.name.toLowerCase())
            };
          } else {
            const newFav = {
              id: mealItem.id || Date.now().toString(),
              name: mealItem.name,
              calories: Number(mealItem.calories) || 0,
              protein: Number(mealItem.protein) || 0,
              carbs: Number(mealItem.carbs) || 0,
              fats: Number(mealItem.fats) || 0,
              imageUri: mealItem.imageUri || null,
              isFavorite: true,
              timestamp: new Date().toISOString(),
            };
            return {
              favorites: [newFav, ...existingFavorites]
            };
          }
        });
      },

      addRecipe: (recipe) => {
        set((state) => ({
          recipes: [
            {
              id: Date.now().toString(),
              ...recipe,
            },
            ...(state.recipes || [])
          ]
        }));
      },

      deleteRecipe: (recipeId) => {
        set((state) => ({
          recipes: (state.recipes || []).filter((r) => r.id !== recipeId)
        }));
      },

      addCustomProduct: (product) => {
        set((state) => ({
          customProducts: [
            {
              id: Date.now().toString(),
              ...product,
            },
            ...(state.customProducts || [])
          ]
        }));
      },

      // Carrito de compras para recetas (E-commerce style)
      addToRecipeCart: (product, grams = 100) => {
        set((state) => {
          const currentCart = state.recipeCart || [];
          const existingIndex = currentCart.findIndex((item) => item.id === product.id);

          // Cálculo proporcional de macros según gramos seleccionados
          // Base: si product.servingSize o product.calories está basado en 100g
          const baseCalories = Number(product.calories) || 0;
          const baseProtein = Number(product.protein) || 0;
          const baseCarbs = Number(product.carbs) || 0;
          const baseFats = Number(product.fats) || 0;

          const ratio = grams / 100;
          const itemCalories = Math.round(baseCalories * ratio);
          const itemProtein = Number((baseProtein * ratio).toFixed(1));
          const itemCarbs = Number((baseCarbs * ratio).toFixed(1));
          const itemFats = Number((baseFats * ratio).toFixed(1));

          if (existingIndex >= 0) {
            const updated = [...currentCart];
            const currentItem = updated[existingIndex];
            const newGrams = (currentItem.grams || 100) + grams;
            const newRatio = newGrams / 100;
            updated[existingIndex] = {
              ...currentItem,
              grams: newGrams,
              calories: Math.round(baseCalories * newRatio),
              protein: Number((baseProtein * newRatio).toFixed(1)),
              carbs: Number((baseCarbs * newRatio).toFixed(1)),
              fats: Number((baseFats * newRatio).toFixed(1)),
            };
            return { recipeCart: updated };
          } else {
            const cartItem = {
              id: product.id || Date.now().toString(),
              name: product.name,
              brand: product.brand || '',
              image: product.image || null,
              baseCalories,
              baseProtein,
              baseCarbs,
              baseFats,
              grams,
              calories: itemCalories,
              protein: itemProtein,
              carbs: itemCarbs,
              fats: itemFats,
            };
            return { recipeCart: [...currentCart, cartItem] };
          }
        });
      },

      updateRecipeCartGrams: (itemId, newGrams) => {
        if (newGrams <= 0) {
          set((state) => ({
            recipeCart: (state.recipeCart || []).filter((item) => item.id !== itemId),
          }));
          return;
        }
        set((state) => ({
          recipeCart: (state.recipeCart || []).map((item) => {
            if (item.id === itemId) {
              const ratio = newGrams / 100;
              return {
                ...item,
                grams: newGrams,
                calories: Math.round(item.baseCalories * ratio),
                protein: Number((item.baseProtein * ratio).toFixed(1)),
                carbs: Number((item.baseCarbs * ratio).toFixed(1)),
                fats: Number((item.baseFats * ratio).toFixed(1)),
              };
            }
            return item;
          }),
        }));
      },

      removeFromRecipeCart: (itemId) => {
        set((state) => ({
          recipeCart: (state.recipeCart || []).filter((item) => item.id !== itemId),
        }));
      },

      clearRecipeCart: () => {
        set({ recipeCart: [] });
      },

      saveRecipeFromCart: (recipeName = 'Mi Receta', servings = 1) => {
        const state = useUserStore.getState();
        const cart = state.recipeCart || [];
        if (cart.length === 0) return null;

        const totalCals = cart.reduce((sum, item) => sum + (Number(item.calories) || 0), 0);
        const totalProt = cart.reduce((sum, item) => sum + (Number(item.protein) || 0), 0);
        const totalCarbs = cart.reduce((sum, item) => sum + (Number(item.carbs) || 0), 0);
        const totalFats = cart.reduce((sum, item) => sum + (Number(item.fats) || 0), 0);

        const newRecipe = {
          id: Date.now().toString(),
          name: recipeName.trim() || 'Mi Receta Zenit',
          servings: Math.max(1, Number(servings) || 1),
          totalMacros: {
            calories: totalCals,
            protein: Number(totalProt.toFixed(1)),
            carbs: Number(totalCarbs.toFixed(1)),
            fats: Number(totalFats.toFixed(1)),
          },
          ingredients: cart.map((item) => ({
            name: item.name,
            amount: `${item.grams}g`,
            calories: item.calories,
            protein: item.protein,
            carbs: item.carbs,
            fats: item.fats,
          })),
        };

        set((prev) => ({
          recipes: [newRecipe, ...(prev.recipes || [])],
          recipeCart: [],
        }));

        return newRecipe;
      },

      // 11. Resetear la cuenta (Logout / Debug)
      resetStore: () => set({ 
        isOnboarded: false, 
        createdAt: null,
        consumedMacros: { calories: 0, protein: 0, carbs: 0, fats: 0 },
        meals: [],
        avoidedCalories: 0,
        avoidedCount: 0,
        dailyScans: { date: '', count: 0 },
        dailyWater: { date: '', amountMl: 0, targetMl: 2500 },
        waterReminder: { enabled: true, intervalMinutes: 90, startHour: 8, endHour: 22 },
        weightTracker: { currentWeightKg: 74.8, muscleMassKg: 35.2, bodyFatPct: 15.4, bmi: 22.8, targetWeightKg: 78.0, lastUpdated: '', history: [] },
        smartDevice: { connected: false, deviceName: null, type: null },
        history: {}
      })
    }),
    {
      name: 'zenit-user-storage', 
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);