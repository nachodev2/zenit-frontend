import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Image } from 'react-native';
import { Calendar as CalendarIcon, ChevronDown, Camera, Flame, Plus } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useRoute } from '@react-navigation/native';
import { ZENIT_GRADIENT } from '../constants/theme';

// --- COMPONENTES ---
import { PremiumRing } from '../components/ui/PremiumRing';
import { WeekCalendar } from '../components/home/WeekCalendar'; // Asegúrate de haber creado este archivo

export default function HomeScreen({ navigation }) {
    const route = useRoute();
    
    // 1. ESTADO DE FECHA
    const [selectedDate, setSelectedDate] = useState(new Date());

    // 2. ESTADO DE DATOS (MACROS)
    // Inicializamos con valores seguros para evitar crasheos si no hay params
    const [stats, setStats] = useState({
        calories: { current: 0, target: 2652 },
        protein: { current: 0, target: 239 },
        carbs: { current: 0, target: 204 },
        fats: { current: 0, target: 98 },
    });

    // 3. RECIBIR DATOS DEL ONBOARDING (Si existen)
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

    // 4. CÁLCULO DE PORCENTAJES (Safe Math)
    // Evitamos división por cero y aseguramos que el valor esté entre 0 y 1
    const getPercentage = (current, target) => {
        if (!target || target === 0) return 0;
        return Math.min(1, Math.max(0, current / target));
    };

    const calPct = getPercentage(stats.calories.current, stats.calories.target);
    const protPct = getPercentage(stats.protein.current, stats.protein.target);
    const carbPct = getPercentage(stats.carbs.current, stats.carbs.target);
    const fatPct = getPercentage(stats.fats.current, stats.fats.target);

    // Placeholder para abrir calendario completo
    const handleOpenCalendar = () => {
        console.log("Abrir Modal de Calendario Mensual");
    };

    return (
        <View className="flex-1 bg-white">
            
            {/* --- HEADER: CALENDARIO SEMANAL --- */}
            <WeekCalendar 
                selectedDate={selectedDate}
                onSelectDate={setSelectedDate} 
                onOpenCalendar={handleOpenCalendar}
            />

            <ScrollView 
                className="flex-1 px-6" 
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ paddingBottom: 120 }} // Espacio para toolbar flotante
            >
                
                {/* --- SECCIÓN 1: DASHBOARD PRINCIPAL --- */}
                <Animated.View entering={FadeInDown.delay(100).duration(500)} className="items-center py-4">
                    
                    {/* ANILLO GRANDE (CALORÍAS) */}
                    <PremiumRing 
                        size={260} 
                        strokeWidth={18} 
                        gradientColors={['#3B82F6', '#2563EB']} // Azul Zenit
                        percentage={calPct}
                        id="calories"
                    >
                        <View className="items-center">
                            {/* Cálculo de Restantes */}
                            <Text className="text-5xl font-black text-zenitBlack tracking-tighter">
                                {Math.max(0, stats.calories.target - stats.calories.current)}
                            </Text>
                            <Text className="text-gray-400 font-bold text-xs tracking-widest uppercase mt-1">
                                KCAL RESTANTES
                            </Text>
                        </View>
                    </PremiumRing>

                    {/* FILA DE MACROS (ANILLOS PEQUEÑOS) */}
                    <View className="flex-row justify-between w-full mt-8 px-2">
                        {/* PROTEÍNA */}
                        <View className="items-center">
                            <PremiumRing 
                                size={75} 
                                strokeWidth={6} 
                                gradientColors={['#F97316', '#EA580C']} // Naranja
                                percentage={protPct}
                                id="prot"
                            >
                                <Text className="text-xs font-black text-zenitBlack">{stats.protein.current}g</Text>
                            </PremiumRing>
                            <Text className="text-gray-400 font-bold text-[10px] mt-2 tracking-widest">PROT</Text>
                            <Text className="text-gray-300 font-bold text-[10px]">{stats.protein.target}g</Text>
                        </View>

                        {/* CARBOS */}
                        <View className="items-center">
                            <PremiumRing 
                                size={75} 
                                strokeWidth={6} 
                                gradientColors={['#EAB308', '#CA8A04']} // Amarillo
                                percentage={carbPct}
                                id="carb"
                            >
                                <Text className="text-xs font-black text-zenitBlack">{stats.carbs.current}g</Text>
                            </PremiumRing>
                            <Text className="text-gray-400 font-bold text-[10px] mt-2 tracking-widest">CARB</Text>
                            <Text className="text-gray-300 font-bold text-[10px]">{stats.carbs.target}g</Text>
                        </View>

                        {/* GRASAS */}
                        <View className="items-center">
                            <PremiumRing 
                                size={75} 
                                strokeWidth={6} 
                                gradientColors={['#22C55E', '#16A34A']} // Verde
                                percentage={fatPct}
                                id="fat"
                            >
                                <Text className="text-xs font-black text-zenitBlack">{stats.fats.current}g</Text>
                            </PremiumRing>
                            <Text className="text-gray-400 font-bold text-[10px] mt-2 tracking-widest">GRASA</Text>
                            <Text className="text-gray-300 font-bold text-[10px]">{stats.fats.target}g</Text>
                        </View>
                    </View>
                </Animated.View>

                {/* --- SECCIÓN 2: BOTÓN DE REGISTRO CON IA --- */}
                <Animated.View entering={FadeInDown.delay(200).duration(500)} className="mt-6">
                    <TouchableOpacity 
                        activeOpacity={0.9}
                        className="bg-gray-50 rounded-[32px] p-1 border border-gray-100 shadow-sm"
                        onPress={() => console.log("Lanzar cámara")}
                    >
                        <View className="bg-white rounded-[28px] p-6 flex-row justify-between items-center">
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
                                    Analiza tu plato en segundos.
                                </Text>
                            </View>

                            <LinearGradient 
                                colors={ZENIT_GRADIENT} 
                                className="w-14 h-14 rounded-full items-center justify-center shadow-md shadow-orange-200"
                            >
                                <Camera size={24} color="white" />
                            </LinearGradient>
                        </View>
                    </TouchableOpacity>
                </Animated.View>

                {/* --- SECCIÓN 3: GALERÍA VISUAL (BENTO GRID) --- */}
                <Animated.View entering={FadeInDown.delay(300).duration(500)} className="mt-8">
                    <Text className="text-lg font-black text-zenitBlack mb-4 ml-1">Tu Progreso Visual</Text>
                    <View className="flex-row flex-wrap justify-between pb-8">
                        {/* Foto Izquierda Grande (Almuerzo) */}
                        <View className="w-[48%] h-64 bg-gray-100 rounded-[28px] mb-4 overflow-hidden border border-gray-50 items-center justify-center relative">
                            {/* Placeholder para cuando no hay foto */}
                            <Camera color="#E5E7EB" size={32} />
                            <Text className="text-gray-300 font-bold text-xs mt-2">ALMUERZO</Text>
                            
                            {/* Aquí iría la imagen real con <Image ... /> si existiera */}
                        </View>
                        
                        {/* Columna Derecha */}
                        <View className="w-[48%] justify-between h-64 mb-4">
                            {/* Desayuno */}
                            <View className="w-full h-[48%] bg-gray-100 rounded-[28px] items-center justify-center border border-gray-50">
                                <Text className="text-gray-300 font-bold text-xs">DESAYUNO</Text>
                            </View>
                            
                            {/* Cena (Botón Agregar) */}
                            <TouchableOpacity className="w-full h-[48%] bg-gray-50 border-2 border-dashed border-gray-200 rounded-[28px] items-center justify-center active:bg-gray-100">
                                <View className="w-8 h-8 bg-white rounded-full items-center justify-center shadow-sm mb-2">
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