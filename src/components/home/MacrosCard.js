import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import Animated, { FadeInDown, withRepeat, withTiming, withSequence, useAnimatedStyle, useSharedValue, Easing } from 'react-native-reanimated';
import { Edit3, Flame, Sparkles, Plus } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { PremiumRing } from '../ui/PremiumRing';
import { ZENIT_GRADIENT } from '../../constants/theme'; 

const getDynamicColors = (status, isReadOnly, isUnlogged) => {
    if (isUnlogged) return ['#D1D5DB', '#9CA3AF']; // Anillos grises apagados
    if (status === 'danger') return ['#EF4444', '#DC2626']; 
    if (status === 'success') return ['#22C55E', '#16A34A']; 
    if (status === 'warning') return ['#F59E0B', '#D97706']; 
    return isReadOnly ? ['#FBBF24', '#EA580C'] : ZENIT_GRADIENT; 
};

const getTextColor = (status, isUnlogged) => {
    if (isUnlogged) return 'text-gray-400';
    if (status === 'danger') return 'text-red-500';
    if (status === 'success') return 'text-green-500';
    if (status === 'warning') return 'text-amber-500';
    return 'text-zenitBlack';
};

const getSmartCoachMessage = (stats, isReadOnly, pastStatus, dateKey) => {
    if (pastStatus === 'unlogged') return "Día sin registrar. Podés cargar tus macros manualmente para no perder el control.";

    const { calories, protein, carbs, fats, target, consumed } = stats;
    const proteinDeficit = protein.remaining > (target.protein * 0.15);
    const successPhrases = ["¡Día impecable! La constancia es tu mejor arma.", "¡Objetivo clavado! Estás en tu mejor nivel.", "Día perfecto. Tu disciplina está dando frutos."];
    const dateHash = dateKey ? dateKey.charCodeAt(dateKey.length - 1) : 0;
    const defaultSuccessMsg = successPhrases[dateHash % successPhrases.length];

    if (isReadOnly) {
        if (pastStatus === 'success') {
            if (proteinDeficit) return "Calorías en meta, pero faltó proteína. Recordá que sin ella, el músculo no se recupera.";
            if (carbs.status === 'danger') return "Calorías logradas, pero hubo exceso de carbohidratos. Ojo con los picos de insulina.";
            if (fats.status === 'danger') return "Día cumplido, pero excediste las grasas. Recordá que son muy densas en calorías.";
            return defaultSuccessMsg;
        }
        if (pastStatus === 'danger') return "Un tropiezo calórico no es caída. Lo importante es retomar la disciplina.";
        if (pastStatus === 'warning') return "Faltó energía. Tu cuerpo necesita combustible de calidad para rendir.";
        return "Historial de macros del día.";
    }

    const consumedPct = consumed.calories / (target.calories || 1);
    const hour = new Date().getHours();
    if (calories.status === 'danger') return "¡Límite superado! Tratá de mantenerte ligero en lo que queda del día.";
    if (hour >= 19) {
        if (proteinDeficit) return "Cierre del día: ideal para una cena ligera que sume esa proteína que te falta.";
        if (carbs.status === 'danger') return "Carbohidratos al límite. Elegí una cena magra con pura proteína y vegetales.";
        if (fats.status === 'danger') return "Grasas excedidas. Asegurá una cena bien magra para compensar.";
        if (calories.status === 'success') return "¡Calorías en meta! Si cenás algo más, intentá que sea pura proteína.";
        return "Cerrando el día... Estás en la recta final, prepará una buena cena.";
    } 
    if (calories.status === 'success') return "¡Objetivo calórico clavado! Excelente ritmo hoy.";
    if (hour < 12) {
        if (consumedPct < 0.1) return "Buen día. Un buen desayuno proteico define tu energía de hoy.";
        return "Excelente ritmo matutino. A mantener el enfoque.";
    } else {
        if (proteinDeficit && protein.remaining > (target.protein * 0.5)) return "Tarde ideal para un snack alto en proteínas.";
        if (carbs.status === 'danger') return "Agotaste tus carbohidratos temprano. Priorizá carnes magras hoy.";
        if (carbs.remaining < (target.carbs * 0.2)) return "Guardate un margen de carbohidratos para la cena.";
        return "Tarde dominada. El equilibrio es la clave hoy.";
    }
};

export const MacrosCard = ({ stats, onOpenModal, isReadOnly, pastStatus, streak = 0, dateKey }) => {
    const [showConsumed, setShowConsumed] = useState(false);
    const isUnlogged = pastStatus === 'unlogged';
    
    const calColors  = getDynamicColors(stats.calories.status, isReadOnly, isUnlogged); 
    const protColors = getDynamicColors(stats.protein.status, isReadOnly, isUnlogged); 
    const carbColors = getDynamicColors(stats.carbs.status, isReadOnly, isUnlogged); 
    const fatColors  = getDynamicColors(stats.fats.status, isReadOnly, isUnlogged); 

    const handleToggle = () => {
        if (isUnlogged) return; // Si no hay datos, no hace falta alternar
        Haptics.selectionAsync();
        setShowConsumed(!showConsumed);
    };

    const scale = useSharedValue(1);
    const rotation = useSharedValue(0);
    const translateY = useSharedValue(0);

    useEffect(() => {
        scale.value = withRepeat(withTiming(1.35, { duration: 350, easing: Easing.inOut(Easing.ease) }), -1, true);
        translateY.value = withRepeat(withTiming(-4, { duration: 350, easing: Easing.inOut(Easing.ease) }), -1, true);
        rotation.value = withRepeat(withSequence(
            withTiming(-25, { duration: 120 }), withTiming(25, { duration: 120 }),
            withTiming(-15, { duration: 120 }), withTiming(15, { duration: 120 }),
            withTiming(0, { duration: 120 }), withTiming(0, { duration: 600 }) 
        ), -1, false);
    }, []);

    const flameStyle = useAnimatedStyle(() => ({
        transform: [{ scale: scale.value }, { rotate: `${rotation.value}deg` }, { translateY: translateY.value }]
    }));

    return (
        <Animated.View entering={FadeInDown.delay(100).duration(500)} className="py-2">
            <TouchableOpacity 
                activeOpacity={isUnlogged ? 1 : 0.9} 
                onPress={handleToggle} 
                className="bg-white rounded-[32px] p-5 shadow-xl shadow-gray-200/40 border border-gray-100 relative"
            >
                {/* ETIQUETA SUPERIOR IZQUIERDA */}
                {isReadOnly && pastStatus ? (
                    <View className={`absolute top-5 left-5 px-3 py-1.5 rounded-full border z-10 ${
                        pastStatus === 'success' ? 'bg-green-50 border-green-100' :
                        pastStatus === 'danger' ? 'bg-red-50 border-red-100' : 
                        pastStatus === 'warning' ? 'bg-amber-50 border-amber-100' : 
                        'bg-gray-100 border-gray-200' // Gris para Unlogged
                    }`}>
                        <Text className={`font-bold uppercase tracking-widest text-[10px] ${
                            pastStatus === 'success' ? 'text-green-600' :
                            pastStatus === 'danger' ? 'text-red-600' : 
                            pastStatus === 'warning' ? 'text-amber-600' : 
                            'text-gray-500' // Texto gris para Unlogged
                        }`}>
                            {pastStatus === 'success' ? '🎯 CUMPLIDO' : 
                             pastStatus === 'danger' ? '⚠️ EXCEDIDO' : 
                             pastStatus === 'warning' ? '🔋 INSUFICIENTE' : 
                             '⚪ SIN REGISTRO'}
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

                {/* BOTÓN SUPERIOR DERECHO (Disponible si es hoy O si está sin registro) */}
                {(!isReadOnly || isUnlogged) && (
                    <TouchableOpacity 
                        onPress={onOpenModal}
                        activeOpacity={0.7}
                        className="absolute top-4 right-4 bg-gray-50 p-2.5 rounded-full border border-gray-100 z-20"
                        hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }} 
                    >
                        {isUnlogged ? <Plus size={18} color="#9CA3AF" /> : <Edit3 size={18} color="#9CA3AF" />}
                    </TouchableOpacity>
                )}
                
                <View className="items-center mt-5">
                    <PremiumRing 
                        size={200} strokeWidth={14} gradientColors={calColors} 
                        percentage={isUnlogged ? 0.001 : (showConsumed ? (stats.consumed.calories / stats.target.calories) : stats.calories.pct)} 
                        id="calories"
                    >
                        <View className="items-center">
                            <Text className={`text-5xl font-black tracking-tighter ${getTextColor(stats.calories.status, isUnlogged)}`}>
                                {isUnlogged ? '?' : (showConsumed ? Math.round(stats.consumed.calories) : stats.calories.remaining)}
                            </Text>
                            <Text className={`text-xl font-bold ${isUnlogged ? 'text-gray-300' : 'text-gray-400'}`}> Kcal</Text>
                            <Text className={`text-[9px] font-black uppercase tracking-widest mt-1 ${isUnlogged ? 'text-gray-400' : 'text-orange-500'}`}>
                                {isUnlogged ? 'Sin Datos' : (showConsumed ? 'Consumidas' : 'Restantes')}
                            </Text>
                        </View>
                    </PremiumRing>

                    <View className="flex-row justify-between w-full mt-5 px-2">
                        <MacroSubRing 
                            value={isUnlogged ? '?' : (showConsumed ? Math.round(stats.consumed.protein) : stats.protein.remaining)} 
                            pct={isUnlogged ? 0.001 : (showConsumed ? (stats.consumed.protein / stats.target.protein) : stats.protein.pct)} 
                            label="PROT" gradientColors={protColors} id="prot" status={stats.protein.status} showConsumed={showConsumed} isUnlogged={isUnlogged}
                        />
                        <MacroSubRing 
                            value={isUnlogged ? '?' : (showConsumed ? Math.round(stats.consumed.carbs) : stats.carbs.remaining)} 
                            pct={isUnlogged ? 0.001 : (showConsumed ? (stats.consumed.carbs / stats.target.carbs) : stats.carbs.pct)} 
                            label="CARB" gradientColors={carbColors} id="carb" status={stats.carbs.status} showConsumed={showConsumed} isUnlogged={isUnlogged}
                        />
                        <MacroSubRing 
                            value={isUnlogged ? '?' : (showConsumed ? Math.round(stats.consumed.fats) : stats.fats.remaining)} 
                            pct={isUnlogged ? 0.001 : (showConsumed ? (stats.consumed.fats / stats.target.fats) : stats.fats.pct)} 
                            label="GRASA" gradientColors={fatColors} id="fat" status={stats.fats.status} showConsumed={showConsumed} isUnlogged={isUnlogged}
                        />
                    </View>

                    <View className="mt-5 flex-row items-center bg-[#0A0A0A] p-3 rounded-2xl w-full shadow-lg shadow-gray-200/50">
                        <View className={`${isUnlogged ? 'bg-gray-800' : 'bg-orange-500/20'} p-1.5 rounded-full mr-3`}>
                            <Sparkles size={16} color={isUnlogged ? "#9CA3AF" : "#F97316"} />
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

const MacroSubRing = ({ value, pct, label, gradientColors, id, status, showConsumed, isUnlogged }) => {
    return (
        <View className="items-center">
            <PremiumRing size={80} strokeWidth={7} gradientColors={gradientColors} percentage={pct} id={id}>
                <View className="items-center justify-center pt-1">
                    <Text className={`text-base font-black leading-5 ${getTextColor(status, isUnlogged)}`}>
                        {value}<Text className={`text-[9px] font-bold ${isUnlogged ? 'text-gray-300' : 'text-gray-400'}`}>g</Text>
                    </Text>
                    {!showConsumed && <Text className={`font-black text-[8px] uppercase ${isUnlogged ? 'text-gray-400' : 'text-orange-500'}`}>DISPO</Text>}
                </View>
            </PremiumRing>
            <Text className="text-gray-400 font-bold text-[10px] mt-2 tracking-widest">{label}</Text>
        </View>
    );
};