import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import Animated, { FadeInDown, withRepeat, withTiming, withSequence, useAnimatedStyle, useSharedValue, Easing } from 'react-native-reanimated';
import { Edit3, Flame, Sparkles } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { PremiumRing } from '../ui/PremiumRing';

// 1. GRADIENTES DE ALTO CONTRASTE (Volumen 3D y Efecto Luz)
const getDynamicColors = (status) => {
    // Alertas con degradados vivos (Claro -> Oscuro)
    if (status === 'danger') return ['#F87171', '#DC2626']; // De Rosa/Rojo claro a Rojo Sangre
    if (status === 'success') return ['#34D399', '#16A34A']; // De Verde Neón a Verde Esmeralda
    if (status === 'warning') return ['#FDE047', '#D97706']; // De Amarillo Patito a Ámbar Oscuro
    return ['#FBBF24', '#EA580C']; 
};

const getTextColor = (status) => {
    if (status === 'danger') return 'text-red-500';
    if (status === 'success') return 'text-green-500';
    if (status === 'warning') return 'text-amber-500';
    return 'text-zenitBlack';
};

const getSmartCoachMessage = (stats, isReadOnly, pastStatus, dateKey) => {
    const successPhrases = [
        "¡Día impecable! La constancia es tu mejor arma.",
        "¡Objetivo clavado! Estás en tu mejor nivel.",
        "Día perfecto. Tu disciplina está dando frutos.",
        "¡Magia pura! Macros cerrados con exactitud.",
        "Cierre de oro. Descansá con la misión cumplida."
    ];
    const dateHash = dateKey ? dateKey.charCodeAt(dateKey.length - 1) : 0;
    const successMsg = successPhrases[dateHash % successPhrases.length];

    if (isReadOnly) {
        if (pastStatus === 'success') return successMsg;
        if (pastStatus === 'danger') return "Un tropiezo no es caída. Lo importante es retomar.";
        if (pastStatus === 'warning') return "Faltó un poco de energía. Tu cuerpo necesita combustible.";
        return "Historial de macros del día.";
    }

    const { calories, protein, carbs, fats, target, consumed } = stats;

    if (calories.status === 'danger') return "¡Límite calórico superado! Ajustá tus porciones mañana.";
    if (carbs.status === 'danger') return "Carbohidratos al límite. Priorizá proteínas y grasas hoy.";
    if (fats.status === 'danger') return "Grasas excedidas. Buscá fuentes más magras hoy.";
    if (protein.status === 'danger') return "¡Demasiada proteína! Nivelá con carbohidratos.";

    if (calories.status === 'success') return successMsg;

    const hour = new Date().getHours();
    const consumedPct = consumed.calories / (target.calories || 1);

    if (hour < 12) {
        if (protein.remaining > (target.protein * 0.7)) return "Asegurate de incluir buena proteína en tu desayuno.";
        if (consumedPct < 0.1) return "Tu motor necesita arranque. ¡A desayunar fuerte!";
        return "Excelente ritmo matutino. A mantener el enfoque.";
    } else if (hour < 19) {
        if (protein.remaining > (target.protein * 0.5)) return "Tarde ideal para un snack alto en proteínas.";
        if (carbs.remaining < (target.carbs * 0.2)) return "Guardate un margen de carbohidratos para la cena.";
        if (consumedPct > 0.8) return "Te quedan pocas calorías. ¡Planificá una cena ligera!";
        return "Tarde dominada. El equilibrio es la clave hoy.";
    } else {
        if (protein.remaining > (target.protein * 0.3)) return "Cena enfocada: priorizá carnes magras o huevos.";
        if (consumedPct < 0.5) return "Comiste muy poco hoy. Tu cuerpo necesita energía.";
        return "Cerrando el día... Estás en la recta final.";
    }
};

export const MacrosCard = ({ stats, onOpenModal, isReadOnly, pastStatus, streak = 0, dateKey }) => {
    const [showConsumed, setShowConsumed] = useState(false);
    
    // Todos los anillos usan la misma lógica centralizada ahora
    const calColors  = getDynamicColors(stats.calories.status); 
    const protColors = getDynamicColors(stats.protein.status); 
    const carbColors = getDynamicColors(stats.carbs.status); 
    const fatColors  = getDynamicColors(stats.fats.status); 

    const handleToggle = () => {
        Haptics.selectionAsync();
        setShowConsumed(!showConsumed);
    };

    // 2. ANIMACIÓN DE FUEGO EXAGERADA (Para que no pase desapercibida)
    const scale = useSharedValue(1);
    const rotation = useSharedValue(0);
    const translateY = useSharedValue(0);

    useEffect(() => {
        // Latido más agresivo (crece 35%)
        scale.value = withRepeat(
            withTiming(1.35, { duration: 350, easing: Easing.inOut(Easing.ease) }), 
            -1, 
            true
        );
        // Saltito vertical
        translateY.value = withRepeat(
            withTiming(-4, { duration: 350, easing: Easing.inOut(Easing.ease) }),
            -1,
            true
        );
        // Temblor de izquierda a derecha más amplio y rápido
        rotation.value = withRepeat(
            withSequence(
                withTiming(-25, { duration: 120 }),
                withTiming(25, { duration: 120 }),
                withTiming(-15, { duration: 120 }),
                withTiming(15, { duration: 120 }),
                withTiming(0, { duration: 120 }),
                withTiming(0, { duration: 600 }) // Pausa antes de volver a moverse
            ),
            -1,
            false
        );
    }, []);

    const flameStyle = useAnimatedStyle(() => ({
        transform: [
            { scale: scale.value }, 
            { rotate: `${rotation.value}deg` },
            { translateY: translateY.value }
        ]
    }));

    return (
        <Animated.View entering={FadeInDown.delay(100).duration(500)} className="py-2">
            <TouchableOpacity 
                activeOpacity={0.9} 
                onPress={handleToggle} 
                className="bg-white rounded-[32px] p-5 shadow-xl shadow-gray-200/40 border border-gray-100 relative"
            >
                {/* ETIQUETA / RACHA (Mantenemos el fondo Negro que te gustó) */}
                {isReadOnly && pastStatus ? (
                    <View className={`absolute top-5 left-5 px-3 py-1.5 rounded-full border z-10 ${
                        pastStatus === 'success' ? 'bg-green-50 border-green-100' :
                        pastStatus === 'danger' ? 'bg-red-50 border-red-100' : 
                        pastStatus === 'warning' ? 'bg-amber-50 border-amber-100' : 'bg-gray-50 border-gray-100'
                    }`}>
                        <Text className={`font-bold uppercase tracking-widest text-[10px] ${
                            pastStatus === 'success' ? 'text-green-600' :
                            pastStatus === 'danger' ? 'text-red-600' : 
                            pastStatus === 'warning' ? 'text-amber-600' : 'text-gray-400'
                        }`}>
                            {pastStatus === 'success' ? '🎯 CUMPLIDO' : 
                             pastStatus === 'danger' ? '⚠️ EXCEDIDO' : 
                             '🔋 INSUFICIENTE'}
                        </Text>
                    </View>
                ) : (
                    streak >= 2 && (
                        <View className="absolute top-5 left-5 flex-row items-center bg-[#0A0A0A] px-4 py-2 rounded-full shadow-md shadow-gray-300 z-10">
                            <Animated.View style={flameStyle}>
                                <Flame size={16} color="#F97316" fill="#F97316" />
                            </Animated.View>
                            <Text className="text-white font-black text-xs ml-2 tracking-widest">{streak} DÍAS</Text>
                        </View>
                    )
                )}

                {/* BOTÓN EDITAR */}
                {!isReadOnly && (
                    <TouchableOpacity 
                        onPress={onOpenModal}
                        activeOpacity={0.7}
                        className="absolute top-4 right-4 bg-gray-50 p-2.5 rounded-full border border-gray-100 z-20"
                        hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }} 
                    >
                        <Edit3 size={18} color="#9CA3AF" />
                    </TouchableOpacity>
                )}
                
                <View className="items-center mt-5">
                    <PremiumRing 
                        size={200} strokeWidth={14} gradientColors={calColors} 
                        percentage={showConsumed ? (stats.consumed.calories / stats.target.calories) : stats.calories.pct} 
                        id="calories"
                    >
                        <View className="items-center">
                            <Text className={`text-5xl font-black tracking-tighter ${getTextColor(stats.calories.status)}`}>
                                {showConsumed ? Math.round(stats.consumed.calories) : stats.calories.remaining}
                            </Text>
                            <Text className="text-xl font-bold text-gray-400"> Kcal</Text>
                            <Text className="text-[9px] text-gray-300 font-bold uppercase tracking-widest mt-1">
                                {showConsumed ? 'Consumidas' : 'Restantes'}
                            </Text>
                        </View>
                    </PremiumRing>

                    <View className="flex-row justify-between w-full mt-5 px-2">
                        <MacroSubRing 
                            value={showConsumed ? Math.round(stats.consumed.protein) : stats.protein.remaining} 
                            pct={showConsumed ? (stats.consumed.protein / stats.target.protein) : stats.protein.pct} 
                            label="PROT" gradientColors={protColors} id="prot" status={stats.protein.status} showConsumed={showConsumed}
                        />
                        <MacroSubRing 
                            value={showConsumed ? Math.round(stats.consumed.carbs) : stats.carbs.remaining} 
                            pct={showConsumed ? (stats.consumed.carbs / stats.target.carbs) : stats.carbs.pct} 
                            label="CARB" gradientColors={carbColors} id="carb" status={stats.carbs.status} showConsumed={showConsumed}
                        />
                        <MacroSubRing 
                            value={showConsumed ? Math.round(stats.consumed.fats) : stats.fats.remaining} 
                            pct={showConsumed ? (stats.consumed.fats / stats.target.fats) : stats.fats.pct} 
                            label="GRASA" gradientColors={fatColors} id="fat" status={stats.fats.status} showConsumed={showConsumed}
                        />
                    </View>

                    {/* SMART COACH PILL (Fondo Negro) */}
                    <View className="mt-5 flex-row items-center bg-[#0A0A0A] p-3 rounded-2xl w-full shadow-lg shadow-gray-200/50">
                        <View className="bg-orange-500/20 p-1.5 rounded-full mr-3">
                            <Sparkles size={16} color="#F97316" />
                        </View>
                        <Text className="flex-1 text-white font-bold text-[11px] leading-4 pr-2">
                            {getSmartCoachMessage(stats, isReadOnly, pastStatus, dateKey)}
                        </Text>
                    </View>
                </View>
            </TouchableOpacity>
        </Animated.View>
    );
};

const MacroSubRing = ({ value, pct, label, gradientColors, id, status, showConsumed }) => {
    return (
        <View className="items-center">
            <PremiumRing size={80} strokeWidth={7} gradientColors={gradientColors} percentage={pct} id={id}>
                <View className="items-center justify-center pt-1">
                    <Text className={`text-base font-black leading-5 ${getTextColor(status)}`}>
                        {value}<Text className="text-[9px] font-bold text-gray-400">g</Text>
                    </Text>
                    {!showConsumed && <Text className="text-gray-300 font-bold text-[8px] uppercase">DISPO</Text>}
                </View>
            </PremiumRing>
            <Text className="text-gray-400 font-bold text-[10px] mt-2 tracking-widest">{label}</Text>
        </View>
    );
};