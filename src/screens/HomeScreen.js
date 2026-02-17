import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Image } from 'react-native';
import { Calendar as CalendarIcon, ChevronDown, Camera, Flame, Plus, Edit3 } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useRoute } from '@react-navigation/native';
import { ZENIT_GRADIENT } from '../constants/theme';

// --- COMPONENTES ---
import { PremiumRing } from '../components/ui/PremiumRing';
import { WeekCalendar } from '../components/home/WeekCalendar';
import { MacroAdjustmentModal } from '../components/home/MacroAdjustmentModal';

export default function HomeScreen({ navigation }) {
    const route = useRoute();
    
    // 1. ESTADO
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [isModalVisible, setModalVisible] = useState(false);

    // 2. ESTADO: DATOS (MACROS)
    const [stats, setStats] = useState({
        calories: { current: 0, target: 2652 },
        protein: { current: 0, target: 239 },
        carbs: { current: 0, target: 204 },
        fats: { current: 0, target: 98 },
    });

    // 3. RECIBIR DATOS DEL ONBOARDING
    useEffect(() => {
        if (route.params?.plan) {
            const { calories, protein, carbs, fats } = route.params.plan;
            setStats({
                calories: { current: 0, target: calories }, 
                protein: { current: 0, target: protein },
                carbs: { current: 0, target: carbs },
                fats: { current: 0, target: fats },
            });
        }
    }, [route.params]);

    // 4. ACTUALIZAR OBJETIVOS (MODAL)
    const handleManualUpdate = (newTargets) => {
        setStats(prev => ({
            calories: { ...prev.calories, target: newTargets.calories },
            protein: { ...prev.protein, target: newTargets.protein },
            carbs: { ...prev.carbs, target: newTargets.carbs },
            fats: { ...prev.fats, target: newTargets.fats },
        }));
    };

    // --- NUEVA LÓGICA: "TANQUE DE COMBUSTIBLE" ---
    // Calculamos los RESTANTES
    const calRemaining = Math.max(0, stats.calories.target - stats.calories.current);
    const protRemaining = Math.max(0, stats.protein.target - stats.protein.current);
    const carbRemaining = Math.max(0, stats.carbs.target - stats.carbs.current);
    const fatRemaining = Math.max(0, stats.fats.target - stats.fats.current);

    // Calculamos el porcentaje INVERSO (Lleno al principio, vacío al final)
    // Si current es 0 -> (target - 0) / target = 1 (100% Lleno)
    const getReversePercentage = (remaining, target) => {
        if (!target || target === 0) return 0;
        return Math.min(1, Math.max(0, remaining / target));
    };

    const calPct = getReversePercentage(calRemaining, stats.calories.target);
    const protPct = getReversePercentage(protRemaining, stats.protein.target);
    const carbPct = getReversePercentage(carbRemaining, stats.carbs.target);
    const fatPct = getReversePercentage(fatRemaining, stats.fats.target);

    return (
        <View className="flex-1 bg-white">
            
            <WeekCalendar 
                selectedDate={selectedDate}
                onSelectDate={setSelectedDate} 
                onOpenCalendar={() => console.log("Abrir Modal de Calendario Completo")}
            />

            <MacroAdjustmentModal 
                visible={isModalVisible}
                onClose={() => setModalVisible(false)}
                currentStats={stats}
                onSave={handleManualUpdate}
            />

            <ScrollView 
                className="flex-1 px-6" 
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ paddingBottom: 120 }}
            >
                
                {/* --- SECCIÓN 1: DASHBOARD CARD --- */}
                <Animated.View entering={FadeInDown.delay(100).duration(500)} className="py-2">
                    <TouchableOpacity 
                        activeOpacity={0.9}
                        onPress={() => setModalVisible(true)}
                        className="bg-white rounded-[32px] p-6 shadow-xl shadow-gray-200/40 border border-gray-100 relative"
                    >
                        <View className="absolute top-6 right-6 bg-gray-50 p-2 rounded-full border border-gray-100 z-10">
                            <Edit3 size={16} color="#9CA3AF" />
                        </View>
                        
                        <View className="items-center mt-2">
                            {/* ANILLO GRANDE (CALORÍAS) */}
                            <PremiumRing 
                                size={225} 
                                strokeWidth={15} 
                                gradientColors={['#3B82F6', '#2563EB']} 
                                percentage={calPct} // Usamos el % Inverso
                                id="calories"
                            >
                                <View className="items-center">
                                    <Text className="text-5xl font-black text-zenitBlack tracking-tighter">
                                        {calRemaining}
                                    </Text>
                                    <Text className="text-2xl font-bold text-gray-400"> Kcal</Text>
                                </View>
                            </PremiumRing>

                            {/* FILA DE MACROS (Ahora muestran RESTANTES) */}
                            <View className="flex-row justify-between w-full mt-8 px-2">
                                
                                {/* PROTEÍNA */}
                                <View className="items-center">
                                    <PremiumRing size={90} strokeWidth={8} gradientColors={['#F97316', '#EA580C']} percentage={protPct} id="prot">
                                        <View className="items-center justify-center pt-1">
                                            {/* Número Grande = Lo que te queda */}
                                            <Text className="text-lg font-black text-zenitBlack leading-5">
                                                {protRemaining}<Text className="text-xs font-bold text-gray-400">g</Text>
                                            </Text>
                                        </View>
                                    </PremiumRing>
                                    <Text className="text-gray-400 font-bold text-[10px] mt-2 tracking-widest">PROT</Text>
                                </View>

                                {/* CARBOS */}
                                <View className="items-center">
                                    <PremiumRing size={90} strokeWidth={8} gradientColors={['#EAB308', '#CA8A04']} percentage={carbPct} id="carb">
                                        <View className="items-center justify-center pt-1">
                                            <Text className="text-lg font-black text-zenitBlack leading-5">
                                                {carbRemaining}<Text className="text-xs font-bold text-gray-400">g</Text>
                                            </Text>
                                            <Text className="text-gray-400 font-bold text-[9px] uppercase">
                                                DISPO
                                            </Text>
                                        </View>
                                    </PremiumRing>
                                    <Text className="text-gray-400 font-bold text-[10px] mt-2 tracking-widest">CARB</Text>
                                </View>

                                {/* GRASAS */}
                                <View className="items-center">
                                    <PremiumRing size={90} strokeWidth={8} gradientColors={['#22C55E', '#16A34A']} percentage={fatPct} id="fat">
                                        <View className="items-center justify-center pt-1">
                                            <Text className="text-lg font-black text-zenitBlack leading-5">
                                                {fatRemaining}<Text className="text-xs font-bold text-gray-400">g</Text>
                                            </Text>
                                            <Text className="text-gray-400 font-bold text-[9px] uppercase">
                                                DISPO
                                            </Text>
                                        </View>
                                    </PremiumRing>
                                    <Text className="text-gray-400 font-bold text-[10px] mt-2 tracking-widest">GRASA</Text>
                                </View>
                            </View>
                        </View>
                    </TouchableOpacity>
                </Animated.View>

                {/* --- SECCIÓN 2: TARJETA IA --- */}
                <Animated.View entering={FadeInDown.delay(200).duration(500)} className="mt-6">
                    <TouchableOpacity 
                        activeOpacity={0.9}
                        onPress={() => console.log("Lanzar cámara")}
                        className="bg-white rounded-[32px] p-1 border border-gray-100 shadow-xl shadow-gray-200/40"
                    >
                        <View className="rounded-[28px] p-6 flex-row justify-between items-center">
                            <View className="flex-1 pr-4">
                                <View className="flex-row items-center mb-2">
                                    <Flame size={16} color="#F97316" fill="#F97316" />
                                    <Text className="text-orange-500 font-bold ml-2 text-[10px] uppercase tracking-wider">
                                        Powered by Gemini
                                    </Text>
                                </View>
                                <Text className="text-xl font-black text-zenitBlack leading-6 mb-1">
                                    Foto-Registro
                                </Text>
                                <Text className="text-gray-400 font-medium text-xs leading-4">
                                    Saca una foto y deja que Zenit analice tus macros.
                                </Text>
                            </View>

                            <LinearGradient 
                                colors={ZENIT_GRADIENT} 
                                className="w-14 h-14 rounded-full items-center justify-center shadow-lg shadow-orange-200"
                            >
                                <Camera size={24} color="white" />
                            </LinearGradient>
                        </View>
                    </TouchableOpacity>
                </Animated.View>

                {/* --- SECCIÓN 3: GALERÍA VISUAL --- */}
                <Animated.View entering={FadeInDown.delay(300).duration(500)} className="mt-8">
                    <Text className="text-lg font-black text-zenitBlack mb-4 ml-2">Tu Progreso Visual</Text>
                    <View className="flex-row flex-wrap justify-between">
                        <View className="w-[48%] h-64 bg-gray-50 rounded-[28px] mb-4 border border-gray-100 items-center justify-center overflow-hidden relative shadow-sm">
                            <Camera color="#E5E7EB" size={32} />
                            <Text className="text-gray-300 font-bold text-xs mt-2">ALMUERZO</Text>
                        </View>
                        <View className="w-[48%] justify-between h-64 mb-4">
                            <View className="w-full h-[48%] bg-gray-50 rounded-[28px] border border-gray-100 items-center justify-center shadow-sm">
                                <Text className="text-gray-300 font-bold text-xs">DESAYUNO</Text>
                            </View>
                            <TouchableOpacity className="w-full h-[48%] bg-white border-2 border-dashed border-gray-200 rounded-[28px] items-center justify-center active:bg-gray-50">
                                <View className="w-8 h-8 bg-gray-50 rounded-full items-center justify-center shadow-sm mb-2 border border-gray-100">
                                    <Plus size={16} color="#D4D4D8" />
                                </View>
                                <Text className="text-gray-400 font-bold text-[10px] uppercase">Cena</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </Animated.View>
            </ScrollView>
        </View>
    );
}