import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, Platform, StatusBar as RNStatusBar, Dimensions } from 'react-native';
import { ChevronLeft, Play, Calendar, Users, ArrowRight } from 'lucide-react-native';
import { StatusBar } from 'expo-status-bar';
import { Check, Flame, Move, Zap, Trophy, Delete } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { GestureHandlerRootView, GestureDetector, Gesture } from 'react-native-gesture-handler'; 
import Animated, { useSharedValue, useAnimatedStyle, runOnJS, withSpring } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient'; // <--- LA MAGIA

import GesturePicker from '../components/ui/GesturePicker'; 
import ProcessingScreen from '../components/onboarding/ProcessingScreen';

const STATUSBAR_HEIGHT = Platform.OS === 'android' ? RNStatusBar.currentHeight + 20 : 0;
const { width } = Dimensions.get('window');

// --- CONSTANTES DE COLOR ---
const ZENIT_GRADIENT = ['#DC2626', '#F97316']; // Rojo a Naranja

// --- COMPONENTE HELPER: BOTÓN CON GRADIENTE ---
const GradientButton = ({ onPress, disabled, text, icon: Icon }) => {
    if (disabled) {
        return (
            <View className="w-full py-5 rounded-full items-center bg-gray-200">
                <Text className="font-bold text-lg tracking-wide text-gray-400">{text}</Text>
            </View>
        );
    }
    return (
        <TouchableOpacity 
            onPress={onPress}
            activeOpacity={0.9}
            className="w-full shadow-lg shadow-orange-500/40"
        >
            <LinearGradient
                colors={ZENIT_GRADIENT}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                className="w-full py-5 rounded-full items-center flex-row justify-center"
            >
                <Text className="text-white font-bold text-lg tracking-wide mr-2">{text}</Text>
                {Icon && <Icon size={20} color="white" strokeWidth={3} />}
            </LinearGradient>
        </TouchableOpacity>
    );
};

// --- COMPONENTE: ZENIT SLIDER (CON GRADIENTE) ---
const ZenitSlider = ({ value, onChange, min, max, step = 0.1 }) => {
    const SLIDER_WIDTH = width - 48; 
    const KNOB_SIZE = 32;
    const MAX_X = SLIDER_WIDTH - KNOB_SIZE;

    const initialPercentage = Math.max(0, Math.min(1, (value - min) / (max - min)));
    
    const translateX = useSharedValue(initialPercentage * MAX_X);
    const scale = useSharedValue(1);
    const context = useSharedValue(0);
    const lastValue = useRef(value);

    const pan = Gesture.Pan()
        .onBegin(() => {
            scale.value = withSpring(1.2);
            context.value = translateX.value;
        })
        .onUpdate((e) => {
            let newX = context.value + e.translationX;
            newX = Math.max(0, Math.min(MAX_X, newX));
            translateX.value = newX;

            const percentage = newX / MAX_X;
            const rawValue = min + (percentage * (max - min));
            const rounded = Math.round(rawValue / step) * step;
            const finalValue = Number(rounded.toFixed(1));

            if (finalValue !== lastValue.current) {
                runOnJS(Haptics.impactAsync)(Haptics.ImpactFeedbackStyle.Light);
                runOnJS(onChange)(finalValue);
                lastValue.current = finalValue;
            }
        })
        .onFinalize(() => {
            scale.value = withSpring(1);
        });

    const knobStyle = useAnimatedStyle(() => ({
        transform: [{ translateX: translateX.value }, { scale: scale.value }],
    }));

    const progressStyle = useAnimatedStyle(() => ({
        width: translateX.value + KNOB_SIZE / 2,
    }));

    useEffect(() => {
        const newPercentage = Math.max(0, Math.min(1, (value - min) / (max - min)));
        translateX.value = withSpring(newPercentage * MAX_X);
    }, [min, max]);

    return (
        <View className="h-12 justify-center" style={{ width: SLIDER_WIDTH }}>
            <View className="absolute left-0 right-0 h-2 bg-gray-100 rounded-full overflow-hidden" />
            
            {/* Track con Gradiente */}
            <Animated.View className="absolute left-0 h-2 rounded-full overflow-hidden" style={progressStyle}>
                <LinearGradient
                    colors={ZENIT_GRADIENT}
                    start={{ x: 0, y: 0 }} 
                    end={{ x: 1, y: 0 }}
                    style={{ flex: 1 }}
                />
            </Animated.View>

            <GestureDetector gesture={pan}>
                <Animated.View 
                    style={[knobStyle]} 
                    className="absolute bg-white w-8 h-8 rounded-full shadow-md shadow-black/30 items-center justify-center border border-gray-100"
                >
                    <View className="w-2 h-2 bg-gray-300 rounded-full" />
                </Animated.View>
            </GestureDetector>
        </View>
    );
};

// --- PASO 0: HERO ---
const HeroStep = ({ onNext }) => (
  <View className="flex-1 bg-white">
      <View className="flex-1 bg-white items-center justify-center relative overflow-hidden">
           <View className="absolute items-center justify-center">
                <View className="w-20 h-20 bg-gray-50 rounded-full items-center justify-center mb-4">
                    <Play size={32} color="#0A0A0A" fill="#0A0A0A" />
                </View>
                <Text className="text-gray-400 text-xs uppercase tracking-widest">Video Loop Demo</Text>
           </View>
           <View className="absolute bottom-10 left-0 right-0 px-6">
                <Text className="text-zenitBlack text-6xl font-black tracking-tighter text-center mb-1">
                    ZENIT.
                </Text>
                <Text className="text-zenitTextMuted text-2xl font-medium tracking-tight text-center">
                    No hay techo.
                </Text>
           </View>
      </View>
      <View className="bg-white px-6 py-8 pb-12 rounded-t-3xl shadow-sm">
          <GradientButton text="INICIAR CALIBRACIÓN" onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              onNext();
          }} />
          <TouchableOpacity className="mt-6">
            <Text className="text-center text-gray-400 font-medium text-sm">
                ¿Ya tienes cuenta? <Text className="text-zenitBlack font-bold">Inicia sesión</Text>
            </Text>
          </TouchableOpacity>
      </View>
  </View>
);

// --- PASO 1: GÉNERO ---
const GenderStep = ({ value, onChange }) => {
  const options = ['Masculino', 'Femenino', 'Otro'];
  return (
    <View className="flex-1 px-6 pt-8">
      <Text className="text-zenitBlack text-4xl font-black tracking-tight mb-2">Elegí tu género</Text>
      <Text className="text-gray-500 text-lg mb-12 font-medium">Para calibrar tu metabolismo basal.</Text>
      <View className="gap-y-4">
        {options.map((opt) => {
            const isActive = value === opt;
            
            // Renderizado Condicional: Gradiente si está activo, View normal si no
            if (isActive) {
                return (
                    <TouchableOpacity key={opt} onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); onChange(opt); }} activeOpacity={0.9}>
                        <LinearGradient
                            colors={ZENIT_GRADIENT}
                            start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                            className="py-6 rounded-3xl border-0 items-center shadow-lg shadow-orange-500/30"
                        >
                            <Text className="text-xl font-bold text-white">{opt}</Text>
                        </LinearGradient>
                    </TouchableOpacity>
                );
            }

            return (
                <TouchableOpacity
                    key={opt}
                    onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); onChange(opt); }}
                    className="py-6 rounded-3xl border-2 items-center bg-white border-gray-100"
                >
                    <Text className="text-xl font-bold text-zenitBlack">{opt}</Text>
                </TouchableOpacity>
            )
        })}
      </View>
    </View>
  );
};

// --- PASO 2: MEDIDAS ---
const BiometricsStep = ({ weight, setWeight, height, setHeight }) => (
    <GestureHandlerRootView style={{ flex: 1 }}>
        <View className="flex-1 pt-4 px-6">
            <View className="mb-6">
                 <Text className="text-zenitBlack text-4xl font-black tracking-tight mb-2">Tus Medidas</Text>
                 <Text className="text-gray-500 text-lg font-medium">Toca el número y desliza para ajustar.</Text>
            </View>
            <View className="flex-1 justify-center gap-y-6">
                <GesturePicker label="Altura" value={height} onChange={setHeight} min={100} max={250} step={1} unit="cm" orientation="vertical" />
                <GesturePicker label="Peso" value={weight} onChange={setWeight} min={30} max={300} step={0.1} unit="kg" orientation="horizontal" />
            </View>
        </View>
    </GestureHandlerRootView>
);

// --- PASO 3: EDAD ---
const AgeStep = ({ value, onChange }) => {
    const handlePress = (num) => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        if (num === 'del') {
            const newVal = Math.floor(value / 10);
            onChange(newVal === 0 ? '' : newVal);
            return;
        }
        const numericValue = value === '' ? 0 : value;
        const newValue = numericValue * 10 + num;
        if (newValue <= 120) onChange(newValue);
    };
    const keys = [1, 2, 3, 4, 5, 6, 7, 8, 9, '.', 0, 'del'];
    return (
        <View className="flex-1 px-6 pt-4">
            <View className="mb-4">
                <Text className="text-zenitBlack text-4xl font-black tracking-tight mb-2">Tu Edad</Text>
                <Text className="text-gray-500 text-lg font-medium">Define tu etapa vital.</Text>
            </View>
            <View className="items-center justify-center flex-1 max-h-32 mb-8">
                <Text className={`text-7xl font-bold tracking-tight ${!value ? 'text-gray-300' : 'text-zenitBlack'}`}>
                    {value || '0'}
                </Text>
                <Text className="text-zenitRed text-sm font-bold tracking-widest uppercase mt-2">AÑOS</Text>
            </View>
            <View className="flex-row flex-wrap justify-center gap-x-6 gap-y-4 px-2">
                {keys.map((k, i) => {
                    if (k === '.') return <View key={i} className="w-[80px] h-[80px]" />; 
                    const isDel = k === 'del';
                    return (
                        <TouchableOpacity
                            key={i} onPress={() => handlePress(k)}
                            className={`w-[80px] h-[80px] rounded-full items-center justify-center ${isDel ? 'bg-transparent' : 'bg-gray-100 active:bg-gray-200'}`}
                        >
                            {isDel ? <Delete size={28} color="#0A0A0A" /> : <Text className="text-3xl font-medium text-zenitBlack">{k}</Text>}
                        </TouchableOpacity>
                    );
                })}
            </View>
        </View>
    );
};

// --- PASO 4: ACTIVIDAD ---
const ActivityStep = ({ value, onChange }) => {
    const levels = [
        { id:1.2, title: 'Sedentario', desc: 'Poco o nada de ejercicio', icon: Move },
        { id:1.375, title: 'Ligero', desc: 'Ejercicio ligero 1-3 días/sem', icon: Zap },
        { id:1.55, title: 'Moderado', desc: 'Ejercicio moderado 3-5 días/sem', icon: Flame },
        { id:1.725, title: 'Intenso', desc: 'Ejercicio intenso 6-7 días/sem', icon: Trophy },
    ];
    return (
        <View className="flex-1 px-6 pt-4">
            <View className="mb-6">
                <Text className="text-zenitBlack text-4xl font-black tracking-tight mb-2">Tu Ritmo</Text>
                <Text className="text-gray-500 text-lg font-medium">¿Cuánto te mueves hoy?</Text>
            </View>
            <View className="gap-y-4">
                {levels.map((lvl) => {
                    const isActive = value === lvl.id;
                    const Icon = lvl.icon;

                    if (isActive) {
                        return (
                            <TouchableOpacity key={lvl.id} onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); onChange(lvl.id); }} activeOpacity={0.9}>
                                <LinearGradient
                                    colors={ZENIT_GRADIENT}
                                    start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                                    className="flex-row items-center p-5 rounded-3xl shadow-lg shadow-orange-500/30 border-0"
                                >
                                    <View className="w-12 h-12 rounded-full items-center justify-center mr-4 bg-white/20">
                                        <Icon size={24} color="#fff" />
                                    </View>
                                    <View className="flex-1">
                                        <Text className="text-xl font-bold mb-0.5 text-white">{lvl.title}</Text>
                                        <Text className="text-sm font-medium text-white/80">{lvl.desc}</Text>
                                    </View>
                                    <View className="w-6 h-6 rounded-full items-center justify-center ml-2 bg-white">
                                        <Check size={14} color="#F97316" strokeWidth={4} />
                                    </View>
                                </LinearGradient>
                            </TouchableOpacity>
                        );
                    }

                    return (
                        <TouchableOpacity
                            key={lvl.title}
                            onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); onChange(lvl.id); }}
                            className="flex-row items-center p-5 rounded-3xl border transition-all active:scale-[0.98] bg-white border-gray-100 shadow-sm"
                        >
                            <View className="w-12 h-12 rounded-full items-center justify-center mr-4 bg-gray-50">
                                <Icon size={24} color="#0A0A0A" />
                            </View>
                            <View className="flex-1">
                                <Text className="text-xl font-bold mb-0.5 text-zenitBlack">{lvl.title}</Text>
                                <Text className="text-sm font-medium text-gray-400">{lvl.desc}</Text>
                            </View>
                            <View className="w-6 h-6 rounded-full items-center justify-center ml-2 bg-transparent">
                            </View>
                        </TouchableOpacity>
                    )
                })}
            </View>
        </View>
    );
};

// --- PASO 5: OBJETIVO ---
const GoalStep = ({ value, onChange }) => {
    const options = [
        { title: 'Perder Grasa', desc: 'Déficit calórico controlado' },
        { title: 'Mantenimiento', desc: 'Rendimiento y energía estable' },
        { title: 'Ganar Músculo', desc: 'Superávit estratégico' }
    ];
    return (
        <View className="flex-1 px-6 pt-8">
            <Text className="text-zenitBlack text-4xl font-black tracking-tight mb-2">Tu Objetivo</Text>
            <Text className="text-gray-500 text-lg mb-12 font-medium">El algoritmo se ajustará a esto.</Text>
            <View className="gap-y-4">
                {options.map((opt) => {
                    const isActive = value === opt.title;
                    
                    if (isActive) {
                        return (
                             <TouchableOpacity key={opt.title} onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); onChange(opt.title); }} activeOpacity={0.9}>
                                <LinearGradient
                                    colors={ZENIT_GRADIENT}
                                    start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                                    className="p-6 rounded-3xl items-start shadow-lg shadow-orange-500/30 border-0"
                                >
                                    <Text className="text-xl font-bold mb-1 text-white">{opt.title}</Text>
                                    <Text className="text-sm font-medium text-white/80">{opt.desc}</Text>
                                </LinearGradient>
                             </TouchableOpacity>
                        );
                    }

                    return (
                        <TouchableOpacity
                        key={opt.title}
                        onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); onChange(opt.title); }}
                        className="p-6 rounded-3xl border-2 items-start transition-all active:scale-[0.98] bg-white border-gray-100"
                        >
                            <Text className="text-xl font-bold mb-1 text-zenitBlack">{opt.title}</Text>
                            <Text className="text-sm font-medium text-gray-500">{opt.desc}</Text>
                        </TouchableOpacity>
                    )
                })}
            </View>
        </View>
    );
};

// --- PASO 6: PESO OBJETIVO ---
const TargetWeightStep = ({ targetWeight, setTargetWeight, currentWeight, goal }) => {
    let minLimit, maxLimit;
    const SAFETY_MARGIN = 0.3; 

    if (goal === 'Perder Grasa') {
        maxLimit = currentWeight; 
        minLimit = Math.round(currentWeight * (1 - SAFETY_MARGIN));
    } else if (goal === 'Ganar Músculo') {
        minLimit = currentWeight;
        maxLimit = Math.round(currentWeight * (1 + SAFETY_MARGIN));
    } else {
        minLimit = Math.round(currentWeight - 3);
        maxLimit = Math.round(currentWeight + 3);
    }

    return (
        <GestureHandlerRootView style={{ flex: 1 }}>
            <View className="flex-1 pt-4 px-6 justify-between pb-10">
                <View>
                    <Text className="text-zenitBlack text-4xl font-black tracking-tight mb-2">Tu Meta</Text>
                    <Text className="text-gray-500 text-lg font-medium">
                        {goal === 'Perder Grasa' ? '¿Hasta dónde quieres bajar?' 
                        : goal === 'Ganar Músculo' ? '¿Hasta dónde quieres subir?' 
                        : 'Ajuste fino de mantenimiento.'}
                    </Text>
                </View>
                
                <View className="items-center justify-center flex-1">
                    <View className="items-center mb-12">
                        <Text className="text-gray-400 font-bold uppercase tracking-widest text-xs mb-2">DIFERENCIA</Text>
                        <Text className={`text-5xl font-black ${
                            Math.abs(targetWeight - currentWeight) < 0.1 ? 'text-gray-300' : 'text-zenitRed'
                        }`}>
                            {targetWeight > currentWeight ? '+' : ''}
                            {(targetWeight - currentWeight).toFixed(1)} <Text className="text-2xl text-zenitBlack">kg</Text>
                        </Text>
                        <Text className="text-zenitBlack font-bold text-xl mt-2">
                             Meta: {targetWeight.toFixed(1)} kg
                        </Text>
                    </View>

                    <ZenitSlider value={targetWeight} onChange={setTargetWeight} min={minLimit} max={maxLimit} step={0.1} />
                    
                    <View className="flex-row justify-between w-full px-2 mt-4">
                        <Text className="text-gray-400 font-bold text-xs">{minLimit}kg</Text>
                        <Text className="text-gray-400 font-bold text-xs">{maxLimit}kg</Text>
                    </View>
                </View>

                <View className="bg-gray-50 p-4 rounded-2xl border border-gray-100">
                    <Text className="text-gray-500 text-xs font-medium text-center leading-5">
                        <Text className="text-zenitBlack font-bold">Nota:</Text> Limitamos el rango por seguridad. 
                        Para cambios mayores, te sugerimos ir por etapas.
                    </Text>
                </View>
            </View>
        </GestureHandlerRootView>
    );
};

// --- PASO 7: VELOCIDAD ---
const PaceStep = ({ value, onChange, goal }) => {
    const isLosing = goal === 'Perder Grasa';
    const options = [
        { id: 'relaxed', title: isLosing ? 'Sostenible' : 'Volumen Limpio', desc: isLosing ? '-0.5 kg / semana' : '+0.2 kg / semana', emoji: '🌱' },
        { id: 'normal', title: isLosing ? 'Exigente' : 'Híbrido', desc: isLosing ? '-1.0 kg / semana' : '+0.4 kg / semana', emoji: '⚡' },
        { id: 'aggressive', title: 'MODO ZENIT', desc: isLosing ? '-1.5 kg / semana' : '+0.6 kg / semana', emoji: '🔥' },
    ];

    return (
        <View className="flex-1 px-6 pt-8">
            <Text className="text-zenitBlack text-4xl font-black tracking-tight mb-2">Intensidad</Text>
            <Text className="text-gray-500 text-lg mb-8 font-medium">Define la agresividad del plan.</Text>
            
            <View className="gap-y-4">
                {options.map((opt) => {
                    const isActive = value === opt.id;
                    if (isActive) {
                        return (
                            <TouchableOpacity key={opt.id} onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); onChange(opt.id); }} activeOpacity={0.9}>
                                <LinearGradient
                                    colors={ZENIT_GRADIENT}
                                    start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                                    className="p-6 rounded-3xl flex-row items-center justify-between shadow-lg shadow-orange-500/30 border-0"
                                >
                                    <View>
                                        <Text className="text-xl font-bold mb-1 text-white">{opt.title}</Text>
                                        <Text className="text-sm font-medium text-white/80">{opt.desc}</Text>
                                    </View>
                                    <Text className="text-4xl">{opt.emoji}</Text>
                                </LinearGradient>
                            </TouchableOpacity>
                        );
                    }
                    return (
                        <TouchableOpacity
                            key={opt.id}
                            onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); onChange(opt.id); }}
                            className="p-6 rounded-3xl border-2 flex-row items-center justify-between transition-all active:scale-[0.98] bg-white border-gray-100"
                        >
                            <View>
                                <Text className="text-xl font-bold mb-1 text-zenitBlack">{opt.title}</Text>
                                <Text className="text-sm font-medium text-gray-500">{opt.desc}</Text>
                            </View>
                            <Text className="text-4xl">{opt.emoji}</Text>
                        </TouchableOpacity>
                    )
                })}
            </View>
        </View>
    );
};

// --- PASO 8: PROYECCIÓN ---
const ProjectionStep = ({ currentWeight, targetWeight, pace, onNext, goal }) => {
    const diff = Math.abs(currentWeight - targetWeight);
    const isLosing = goal === 'Perder Grasa';

    let weeklyRate;
    if (isLosing) {
        if (pace === 'aggressive') weeklyRate = 1.5;
        else if (pace === 'normal') weeklyRate = 1.0;
        else weeklyRate = 0.5;
    } else {
        if (pace === 'aggressive') weeklyRate = 0.6;
        else if (pace === 'normal') weeklyRate = 0.4;
        else weeklyRate = 0.2;
    }

    const weeksNeeded = weeklyRate > 0 ? diff / weeklyRate : 0;
    const daysNeeded = Math.round(weeksNeeded * 7);
    const date = new Date();
    date.setDate(date.getDate() + daysNeeded);
    const dateString = date.toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' });

    return (
        <View className="flex-1 px-6 pt-10 bg-white justify-between pb-10">
            <View>
                <View className="flex-row items-center mb-4">
                    <Calendar size={24} color="#EF4444" className="mr-2" />
                    <Text className="text-zenitRed font-bold uppercase tracking-widest text-xs">DEADLINE ESTIMADO</Text>
                </View>
                <Text className="text-zenitBlack text-5xl font-black mb-2 py-1">Llegarás el</Text>
                <Text className="text-zenitRed text-4xl font-black leading-tight mb-8 uppercase">{dateString}</Text>
                <Text className="text-gray-500 text-lg font-medium leading-relaxed">
                    A este ritmo <Text className="text-zenitBlack font-bold">({weeklyRate}kg/sem)</Text>, alcanzarás tu meta de <Text className="text-zenitBlack font-bold">{targetWeight}kg</Text> en solo <Text className="text-zenitBlack font-bold">{daysNeeded} días</Text>.
                </Text>
            </View>

            <View className="h-40 flex-row items-end justify-between px-2 mb-8">
                <View className="items-center">
                    <Text className="text-gray-400 font-bold mb-2 text-xs">HOY</Text>
                    <View className="w-4 h-16 bg-gray-200 rounded-full" />
                    <Text className="text-zenitBlack font-bold mt-2">{currentWeight}</Text>
                </View>
                <View className="flex-1 h-32 border-t-2 border-dashed border-gray-200 mx-4 mt-10 relative">
                     <View className="absolute -top-3 left-[40%] bg-zenitBlack px-3 py-1 rounded-full shadow-lg shadow-black/30">
                        <Text className="text-xs font-bold text-white">Zenit 🚀</Text>
                     </View>
                </View>
                <View className="items-center">
                    <Text className="text-gray-400 font-bold mb-2 text-xs">META</Text>
                    
                    {/* Barra Meta con Gradiente */}
                    <LinearGradient
                        colors={ZENIT_GRADIENT}
                        start={{ x: 0, y: 0 }} end={{ x: 0, y: 1 }}
                        className="w-4 h-32 rounded-full shadow-lg shadow-orange-500/30"
                    />
                    <Text className="text-zenitBlack font-bold mt-2">{targetWeight}</Text>
                </View>
            </View>
            
            <GradientButton text="ESTADÍSTICAS" icon={ArrowRight} onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                onNext();
            }} />
        </View>
    );
};

// --- PASO 9: SOCIAL PROOF ---
const SocialProofStep = ({ onNext }) => (
    <View className="flex-1 px-6 pt-10 bg-white justify-between pb-10">
        <View>
            <View className="w-16 h-16 bg-gray-50 rounded-2xl items-center justify-center mb-6">
                <Users size={32} color="#0A0A0A" />
            </View>
            <Text className="text-zenitBlack text-4xl font-black mb-4 leading-tight">El Efecto Zenit.</Text>
            <Text className="text-gray-500 text-lg font-medium leading-relaxed mb-10">
                Analizamos 10,000 casos. Las personas que siguen un plan adaptativo llegan a su meta <Text className="text-zenitBlack font-bold">3.5x veces más rápido</Text> que con dietas estáticas.
            </Text>
            <View className="gap-y-6">
                <View>
                    <View className="flex-row justify-between mb-2">
                        <Text className="font-bold text-zenitBlack">Usuario Zenit AI</Text>
                        <Text className="font-bold text-zenitRed">3 Meses</Text>
                    </View>
                    <View className="h-4 bg-gray-100 rounded-full overflow-hidden w-full">
                         {/* Barra Progreso con Gradiente */}
                        <LinearGradient
                             colors={ZENIT_GRADIENT}
                             start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                             className="h-full w-[30%] rounded-full"
                         />
                    </View>
                </View>
                <View>
                    <View className="flex-row justify-between mb-2">
                        <Text className="font-bold text-gray-400">Dieta Promedio</Text>
                        <Text className="font-bold text-gray-400">9 Meses</Text>
                    </View>
                    <View className="h-4 bg-gray-50 rounded-full overflow-hidden w-full">
                        <View className="h-full bg-gray-300 w-[80%] rounded-full" />
                    </View>
                </View>
            </View>
        </View>
        <GradientButton text="CREAR MI PLAN" onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            onNext();
        }} />
    </View>
);

// --- PASO 11: RESULTADO ---
const FinalResultStep = ({ onFinish, data, calculations }) => (
    <View className="flex-1 px-6 pt-10 items-center justify-center bg-white">
        <Text className="text-zenitRed text-sm font-bold tracking-widest uppercase mb-4">
            ANÁLISIS COMPLETADO
        </Text>
        <Text className="text-zenitBlack text-5xl font-black text-center mb-4 leading-tight">
            Tu Plan Zenit
        </Text>
        <Text className="text-gray-500 text-center text-lg mb-10 px-4 font-medium">
            Para <Text className="text-zenitRed font-bold">{data.goal.toLowerCase()}</Text>, tu cuerpo necesita esta gasolina:
        </Text>
        
        {/* CARD PRINCIPAL CON BORDE GRADIENTE O SOMBRA ROJA */}
        <View className="w-full bg-white rounded-[40px] shadow-2xl shadow-orange-500/20 mb-8 border border-gray-100 overflow-hidden relative">
            {/* Decoración superior (Barra gradiente) */}
            <LinearGradient
                colors={ZENIT_GRADIENT}
                start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                className="h-2 w-full absolute top-0"
            />
            
            <View className="p-8 items-center">
                <Text className="text-zenitBlack text-8xl font-black tracking-tighter">
                    {calculations.calories}
                </Text>
                <Text className="text-zenitRed text-sm uppercase font-bold tracking-widest mt-[-5px] mb-8">
                    Calorías Diarias
                </Text>
                
                {/* Separador */}
                <View className="w-full h-[1px] bg-gray-100 mb-6" />

                <View className="flex-row w-full justify-between px-2">
                    <MacroStat value={calculations.protein} label="Prot" />
                    <View className="w-[1px] bg-gray-200 h-12 self-center" />
                    <MacroStat value={calculations.carbs} label="Carb" />
                    <View className="w-[1px] bg-gray-200 h-12 self-center" />
                    <MacroStat value={calculations.fats} label="Grasa" />
                </View>
            </View>
        </View>

        <GradientButton 
            text="GUARDAR Y CONTINUAR" 
            onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                onFinish();
            }} 
        />
    </View>
);

const MacroStat = ({ value, label }) => (
    <View className="items-center">
        <Text className="text-2xl font-black text-zenitBlack">{value}g</Text>
        {/* Label con gradiente (truco usando texto rojo por ahora, 
            gradient text es complejo en React Native sin librerías extra) */}
        <Text className="text-zenitRed text-[10px] uppercase font-bold tracking-wider mt-1">{label}</Text>
    </View>
);

// --- CONTROLADOR PRINCIPAL ---
export default function OnboardingScreen({ navigation }) {
  const TOTAL_STEPS = 11; 
  const [step, setStep] = useState(0);
  
  const [formData, setFormData] = useState({
    gender: null,
    goal: null,
    weight: 75.0,
    targetWeight: 70.0,
    height: 175,
    age: '',          
    activityFactor: null, 
    pace: null,
  });
  
  const [results, setResults] = useState({ calories: 0, protein: 0, carbs: 0, fats: 0 });

  const advanceStep = () => setStep(prev => prev + 1);
  const goBack = () => setStep(prev => prev - 1);

  const handleGoalSelection = (goal) => {
      let smartTarget = formData.weight;
      if (goal === 'Perder Grasa') smartTarget = formData.weight - 5;
      if (goal === 'Ganar Músculo') smartTarget = formData.weight + 3;
      setFormData(prev => ({ ...prev, goal, targetWeight: smartTarget }));
  };

  const calculatePlan = () => {
    let bmr;
    const w = formData.weight;
    const h = formData.height;
    const a = formData.age || 25; 
    const activity = formData.activityFactor || 1.2;

    if (formData.gender === 'Femenino') bmr = 447.593 + (9.247 * w) + (3.098 * h) - (4.330 * a);
    else bmr = 88.362 + (13.397 * w) + (4.799 * h) - (5.677 * a);
    
    let tdee = bmr * activity; 
    if (formData.goal === 'Perder Grasa') tdee -= 500;
    if (formData.goal === 'Ganar Músculo') tdee += 300;

    const calories = Math.round(tdee);
    let pRatio = 0.3, cRatio = 0.4, fRatio = 0.3;
    if (formData.goal === 'Perder Grasa') { pRatio = 0.4; cRatio = 0.3; fRatio = 0.3; }
    if (formData.goal === 'Ganar Músculo') { pRatio = 0.3; cRatio = 0.5; fRatio = 0.2; }

    setResults({ 
        calories, 
        protein: Math.round((calories * pRatio) / 4), 
        carbs: Math.round((calories * cRatio) / 4), 
        fats: Math.round((calories * fRatio) / 9) 
    });
    advanceStep();
  };

  const renderContent = () => {
    switch(step) {
      case 0: return <HeroStep onNext={advanceStep} />;
      case 1: return <GenderStep value={formData.gender} onChange={(val) => setFormData(prev => ({...prev, gender: val}))} />;
      case 2: return <BiometricsStep weight={formData.weight} setWeight={(val) => setFormData(prev => ({...prev, weight: val}))} height={formData.height} setHeight={(val) => setFormData(prev => ({...prev, height: val}))} />;
      case 3: return <AgeStep value={formData.age} onChange={(val) => setFormData(prev => ({...prev, age: val}))} />;
      case 4: return <ActivityStep value={formData.activityFactor} onChange={(val) => setFormData(prev => ({...prev, activityFactor: val}))} />;
      case 5: return <GoalStep value={formData.goal} onChange={handleGoalSelection} />;
      case 6: return <TargetWeightStep targetWeight={formData.targetWeight} setTargetWeight={(val) => setFormData(prev => ({...prev, targetWeight: val}))} currentWeight={formData.weight} goal={formData.goal} />;
      case 7: return <PaceStep value={formData.pace} onChange={(val) => setFormData(prev => ({...prev, pace: val}))} goal={formData.goal} />;
      case 8: return <ProjectionStep currentWeight={formData.weight} targetWeight={formData.targetWeight} pace={formData.pace} goal={formData.goal} onNext={advanceStep} />;
      case 9: return <SocialProofStep onNext={advanceStep} />;
      case 10: return <ProcessingScreen onFinish={calculatePlan} pace={formData.pace} goal={formData.goal} />;
      case 11: return <FinalResultStep data={formData} calculations={results} onFinish={() => navigation.replace('Home')} />;
      default: return null;
    }
  };

  const isNextEnabled = () => {
      if (step === 1) return formData.gender !== null;
      if (step === 2) return true; 
      if (step === 3) return formData.age > 10 && formData.age < 120; 
      if (step === 4) return formData.activityFactor !== null; 
      if (step === 5) return formData.goal !== null;
      if (step === 6) return true;
      if (step === 7) return formData.pace !== null;
      return false; 
  };

  const showContinueButton = [1, 2, 3, 4, 5, 6, 7].includes(step);
  const showProgressBar = step > 0 && step < 10;

  return (
    <View className="flex-1 bg-white">
      <StatusBar style="dark" />
      <View style={{ flex: 1, paddingTop: STATUSBAR_HEIGHT }}>
        {showProgressBar && (
          <View className="px-4 py-2 flex-row items-center mb-2">
            <TouchableOpacity onPress={goBack} className="w-10 h-10 bg-gray-50 rounded-full items-center justify-center border border-gray-100">
              <ChevronLeft size={24} color="#0A0A0A" />
            </TouchableOpacity>
            <View className="flex-1 mx-4 h-2 bg-gray-100 rounded-full overflow-hidden">
                {/* BARRA DE PROGRESO CON GRADIENTE */}
                <Animated.View className="h-full rounded-full w-full bg-gray-100">
                     <LinearGradient
                        colors={ZENIT_GRADIENT}
                        start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                        style={{ height: '100%', width: `${(step / 10) * 100}%` }}
                    />
                </Animated.View>
            </View>
            <View className="w-10" /> 
          </View>
        )}
        
        {renderContent()}

        {showContinueButton && (
            <View className="px-6 pb-8 pt-2 bg-white">
                <GradientButton 
                    text="CONTINUAR" 
                    disabled={!isNextEnabled()} 
                    onPress={() => {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                        advanceStep();
                    }}
                />
            </View>
        )}
      </View>
    </View>
  );
}