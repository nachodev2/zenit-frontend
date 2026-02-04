import React, { useState, useEffect, useRef } from 'react';
import { 
    View, 
    Text, 
    TouchableOpacity, 
    Platform, 
    StatusBar as RNStatusBar, 
    Dimensions, 
    ScrollView, 
    TextInput 
} from 'react-native';
import { 
    ChevronLeft, 
    Play, 
    Calendar, 
    Users, 
    ArrowRight, 
    Check, 
    Flame, 
    Move, 
    Zap, 
    Trophy, 
    Delete 
} from 'lucide-react-native';
import { StatusBar } from 'expo-status-bar';
import * as Haptics from 'expo-haptics';
import { GestureHandlerRootView, GestureDetector, Gesture } from 'react-native-gesture-handler'; 
import Animated, { 
    useSharedValue, 
    useAnimatedStyle, 
    runOnJS, 
    withSpring, 
    useAnimatedProps, 
    withTiming, 
    Easing 
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient'; 
import Svg, { Circle, G } from 'react-native-svg';

import GesturePicker from '../components/ui/GesturePicker'; 
import ProcessingScreen from '../components/onboarding/ProcessingScreen';

// --- CONFIGURACIÓN ESTRATÉGICA ---
const AnimatedCircle = Animated.createAnimatedComponent(Circle);
const { width } = Dimensions.get('window');
const STATUSBAR_HEIGHT = Platform.OS === 'android' ? RNStatusBar.currentHeight + 20 : 0;

const ZENIT_GRADIENT = ['#DC2626', '#F97316'];
const COLORS = {
    blue: '#2563EB', orange: '#F97316', yellow: '#FACC15', green: '#22C55E',
};

// RANGOS LÓGICOS (Guardrails)
const LIMITS = {
    calories: { min: 500, max: 8000 },
    protein: { min: 20, max: 500 },
    carbs: { min: 20, max: 1000 },
    fats: { min: 10, max: 300 }
};

// --- COMPONENTE: ZENIT SLIDER (ANTI-CRASH SYSTEM) ---
const ZenitSlider = ({ value, onChange, min, max, step = 0.1 }) => {
    const SLIDER_WIDTH = width - 48; 
    const KNOB_SIZE = 32;
    const MAX_X = SLIDER_WIDTH - KNOB_SIZE;
    
    // [IMPORTANTE] Ref para bloquear actualizaciones externas mientras se arrastra
    // Esto evita el "Crash por Loop de Renderizado"
    const isDragging = useRef(false);

    const translateX = useSharedValue(0);
    const context = useSharedValue(0);
    const scale = useSharedValue(1);

    // Efecto Inteligente: Solo actualiza visualmente si NO estás tocando
    useEffect(() => {
        if (!isDragging.current) {
            const safeValue = Math.max(min, Math.min(max, value));
            const percentage = (safeValue - min) / (max - min);
            translateX.value = withSpring(percentage * MAX_X, { damping: 20, stiffness: 150 });
        }
    }, [value, min, max]);

    const pan = Gesture.Pan()
        .onBegin(() => {
            isDragging.current = true; // BLOQUEAR EXTERNOS
            context.value = translateX.value;
            scale.value = withSpring(1.2);
        })
        .onUpdate((e) => {
            let newX = context.value + e.translationX;
            newX = Math.max(0, Math.min(MAX_X, newX));
            translateX.value = newX;

            const percentage = newX / MAX_X;
            const rawValue = min + (percentage * (max - min));
            
            // Redondeo matemático preciso
            const rounded = Math.round(rawValue / step) * step;
            const finalValue = Number(rounded.toFixed(1));
            
            // Enviar cambio al padre (State Update)
            runOnJS(onChange)(finalValue);
        })
        .onFinalize(() => {
            scale.value = withSpring(1);
            isDragging.current = false; // LIBERAR BLOQUEO
        });

    const knobStyle = useAnimatedStyle(() => ({
        transform: [{ translateX: translateX.value }, { scale: scale.value }]
    }));
    
    const progressStyle = useAnimatedStyle(() => ({
        width: translateX.value + KNOB_SIZE / 2
    }));

    return (
        <View style={{ width: SLIDER_WIDTH }} className="h-12 justify-center">
            {/* Track Fondo */}
            <View className="absolute left-0 right-0 h-2 bg-gray-100 rounded-full" />
            
            {/* Track Progreso (Gradiente) */}
            <Animated.View className="absolute left-0 h-2 rounded-full overflow-hidden" style={progressStyle}>
                <LinearGradient colors={ZENIT_GRADIENT} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={{ flex: 1 }} />
            </Animated.View>

            {/* Knob (Botón) */}
            <GestureDetector gesture={pan}>
                <Animated.View style={knobStyle} className="absolute bg-white w-8 h-8 rounded-full shadow-md border border-gray-100 items-center justify-center">
                    <View className="w-2 h-2 bg-gray-300 rounded-full" />
                </Animated.View>
            </GestureDetector>
        </View>
    );
};

// --- COMPONENTE: ANILLO PREMIUM ---
const PremiumRing = ({ size = 100, strokeWidth = 8, color = COLORS.blue, percentage = 0.75, children }) => {
    const progress = useSharedValue(0);
    const radius = (size - strokeWidth) / 2;
    const circumference = radius * 2 * Math.PI;
    const center = size / 2;

    useEffect(() => {
        progress.value = withTiming(percentage, { duration: 2000, easing: Easing.out(Easing.exp) });
    }, [percentage]);

    const animatedProps = useAnimatedProps(() => ({
        strokeDashoffset: circumference * (1 - progress.value),
    }));

    return (
        <View style={{ width: size, height: size }} className="items-center justify-center">
            <Svg width={size} height={size} style={{ position: 'absolute' }}>
                <G origin={`${center}, ${center}`}>
                    <Circle cx={center} cy={center} r={radius} stroke="#F3F4F6" strokeWidth={strokeWidth / 2} fill="transparent" />
                    <AnimatedCircle
                        stroke={color} cx={center} cy={center} r={radius} strokeWidth={strokeWidth} fill="transparent"
                        strokeDasharray={circumference} animatedProps={animatedProps} strokeLinecap="round" transform={`rotate(-90 ${center} ${center})`}
                    />
                </G>
            </Svg>
            <View className="items-center justify-center w-full h-full">{children}</View>
        </View>
    );
};

// --- COMPONENTE: BOTÓN DESLIZAR (SWIPE) ---
const SwipeButton = ({ onConfirm }) => {
    const BUTTON_HEIGHT = 60;
    const PADDING = 4;
    const BUTTON_WIDTH = width - 48; 
    const SWIPEABLE_DIMENSIONS = BUTTON_HEIGHT - 2 * PADDING;
    const H_SWIPE_RANGE = BUTTON_WIDTH - 2 * PADDING - SWIPEABLE_DIMENSIONS;

    const X = useSharedValue(0);
    const [toggled, setToggled] = useState(false);

    const animatedStyles = useAnimatedStyle(() => ({
        transform: [{ translateX: X.value }],
    }));

    const AnimatedLinearGradient = Animated.createAnimatedComponent(LinearGradient);
    const fillStyle = useAnimatedStyle(() => ({
        width: X.value + SWIPEABLE_DIMENSIONS,
    }));

    const textOpacityStyle = useAnimatedStyle(() => ({
        opacity: 1 - (X.value / H_SWIPE_RANGE) * 1.5,
    }));

    const panGesture = Gesture.Pan()
        .onUpdate((e) => {
            if (toggled) return;
            let newValue = e.translationX;
            if (newValue >= 0 && newValue <= H_SWIPE_RANGE) {
                X.value = newValue;
            }
        })
        .onEnd(() => {
            if (toggled) return;
            if (X.value > H_SWIPE_RANGE * 0.75) {
                X.value = withSpring(H_SWIPE_RANGE, { damping: 20 });
                runOnJS(setToggled)(true);
                runOnJS(Haptics.notificationAsync)(Haptics.NotificationFeedbackType.Success);
                runOnJS(onConfirm)();
            } else {
                X.value = withSpring(0, { damping: 20 });
            }
        });

    return (
        <View className="bg-gray-100 rounded-full justify-center m-0 relative" style={{ width: BUTTON_WIDTH, height: BUTTON_HEIGHT }}>
            <AnimatedLinearGradient
                colors={ZENIT_GRADIENT}
                start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                style={[{ height: BUTTON_HEIGHT, borderRadius: 99, position: 'absolute', left: 0 }, fillStyle]}
            />
            <View className="absolute w-full items-center justify-center">
                <Animated.Text style={[{ fontSize: 14, fontWeight: '800', letterSpacing: 1, color: '#A1A1AA', textTransform: 'uppercase' }, textOpacityStyle]}>
                    Desliza para comenzar
                </Animated.Text>
            </View>
            <GestureDetector gesture={panGesture}>
                <Animated.View style={[animatedStyles, { width: SWIPEABLE_DIMENSIONS, height: SWIPEABLE_DIMENSIONS, borderRadius: 99, backgroundColor: 'white', marginLeft: PADDING, alignItems: 'center', justifyContent: 'center', shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.15, shadowRadius: 3.84, elevation: 5 }]}>
                    <ArrowRight size={24} color="#F97316" strokeWidth={3} />
                </Animated.View>
            </GestureDetector>
        </View>
    );
};

const GradientButton = ({ onPress, disabled, text, icon: Icon }) => (
    <TouchableOpacity onPress={onPress} disabled={disabled} activeOpacity={0.9} className={`w-full ${disabled ? 'opacity-50' : ''} shadow-lg shadow-orange-500/40`}>
        <LinearGradient colors={ZENIT_GRADIENT} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} className="w-full py-5 rounded-full items-center flex-row justify-center">
            <Text className="text-white font-bold text-lg tracking-wide mr-2">{text}</Text>
            {Icon && <Icon size={20} color="white" strokeWidth={3} />}
        </LinearGradient>
    </TouchableOpacity>
);

// ==========================================
// PASOS DEL ONBOARDING
// ==========================================

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
                <Text className="text-zenitBlack text-6xl font-black tracking-tighter text-center mb-1">ZENIT.</Text>
                <Text className="text-zenitTextMuted text-2xl font-medium tracking-tight text-center">No hay techo.</Text>
           </View>
      </View>
      <View className="bg-white px-6 py-8 pb-12 rounded-t-3xl shadow-sm">
          <GradientButton text="INICIAR CALIBRACIÓN" onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); onNext(); }} />
          <TouchableOpacity className="mt-6">
            <Text className="text-center text-gray-400 font-medium text-sm">¿Ya tienes cuenta? <Text className="text-zenitBlack font-bold">Inicia sesión</Text></Text>
          </TouchableOpacity>
      </View>
  </View>
);

const GenderStep = ({ value, onChange }) => {
  const options = ['Masculino', 'Femenino', 'Otro'];
  return (
    <View className="flex-1 px-6 pt-8">
      <Text className="text-zenitBlack text-4xl font-black tracking-tight mb-2">Elegí tu género</Text>
      <Text className="text-gray-500 text-lg mb-12 font-medium">Para calibrar tu metabolismo basal.</Text>
      <View className="gap-y-4">
        {options.map((opt) => (
            <TouchableOpacity key={opt} onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); onChange(opt); }} activeOpacity={0.9}>
                {value === opt ? (
                    <LinearGradient colors={ZENIT_GRADIENT} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} className="py-6 rounded-3xl items-center shadow-lg shadow-orange-500/30">
                        <Text className="text-xl font-bold text-white">{opt}</Text>
                    </LinearGradient>
                ) : (
                    <View className="py-6 rounded-3xl border-2 items-center bg-white border-gray-100">
                        <Text className="text-xl font-bold text-zenitBlack">{opt}</Text>
                    </View>
                )}
            </TouchableOpacity>
        ))}
      </View>
    </View>
  );
};

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
            <View className="mb-4"><Text className="text-zenitBlack text-4xl font-black tracking-tight mb-2">Tu Edad</Text><Text className="text-gray-500 text-lg font-medium">Define tu etapa vital.</Text></View>
            <View className="items-center justify-center flex-1 max-h-32 mb-8"><Text className={`text-7xl font-bold tracking-tight ${!value ? 'text-gray-300' : 'text-zenitBlack'}`}>{value || '0'}</Text><Text className="text-zenitRed text-sm font-bold tracking-widest uppercase mt-2">AÑOS</Text></View>
            <View className="flex-row flex-wrap justify-center gap-x-6 gap-y-4 px-2">
                {keys.map((k, i) => (k === '.' ? <View key={i} className="w-[80px] h-[80px]" /> : <TouchableOpacity key={i} onPress={() => handlePress(k)} className={`w-[80px] h-[80px] rounded-full items-center justify-center ${k === 'del' ? 'bg-transparent' : 'bg-gray-100 active:bg-gray-200'}`}>{k === 'del' ? <Delete size={28} color="#0A0A0A" /> : <Text className="text-3xl font-medium text-zenitBlack">{k}</Text>}</TouchableOpacity>))}
            </View>
        </View>
    );
};

const ActivityStep = ({ value, onChange }) => {
    const levels = [{ id:1.2, title: 'Sedentario', desc: 'Poco o nada de ejercicio', icon: Move }, { id:1.375, title: 'Ligero', desc: 'Ejercicio ligero 1-3 días/sem', icon: Zap }, { id:1.55, title: 'Moderado', desc: 'Ejercicio moderado 3-5 días/sem', icon: Flame }, { id:1.725, title: 'Intenso', desc: 'Ejercicio intenso 6-7 días/sem', icon: Trophy }];
    return (
        <View className="flex-1 px-6 pt-4">
            <View className="mb-6"><Text className="text-zenitBlack text-4xl font-black tracking-tight mb-2">Tu Ritmo</Text><Text className="text-gray-500 text-lg font-medium">¿Cuánto te mueves hoy?</Text></View>
            <View className="gap-y-4">
                {levels.map((lvl) => (
                    <TouchableOpacity key={lvl.id} onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); onChange(lvl.id); }} activeOpacity={0.9}>
                        {value === lvl.id ? (
                            <LinearGradient colors={ZENIT_GRADIENT} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} className="flex-row items-center p-5 rounded-3xl shadow-lg shadow-orange-500/30">
                                <View className="w-12 h-12 rounded-full items-center justify-center mr-4 bg-white/20"><lvl.icon size={24} color="#fff" /></View>
                                <View className="flex-1"><Text className="text-xl font-bold mb-0.5 text-white">{lvl.title}</Text><Text className="text-sm font-medium text-white/80">{lvl.desc}</Text></View>
                                <View className="w-6 h-6 rounded-full items-center justify-center ml-2 bg-white"><Check size={14} color="#F97316" strokeWidth={4} /></View>
                            </LinearGradient>
                        ) : (
                            <View className="flex-row items-center p-5 rounded-3xl border bg-white border-gray-100 shadow-sm"><View className="w-12 h-12 rounded-full items-center justify-center mr-4 bg-gray-50"><lvl.icon size={24} color="#0A0A0A" /></View><View className="flex-1"><Text className="text-xl font-bold mb-0.5 text-zenitBlack">{lvl.title}</Text><Text className="text-sm font-medium text-gray-400">{lvl.desc}</Text></View></View>
                        )}
                    </TouchableOpacity>
                ))}
            </View>
        </View>
    );
};

const GoalStep = ({ value, onChange }) => {
    const options = [{ title: 'Perder Grasa', desc: 'Déficit calórico controlado' }, { title: 'Mantenimiento', desc: 'Rendimiento y energía estable' }, { title: 'Ganar Músculo', desc: 'Superávit estratégico' }];
    return (
        <View className="flex-1 px-6 pt-8">
            <Text className="text-zenitBlack text-4xl font-black tracking-tight mb-2">Tu Objetivo</Text>
            <Text className="text-gray-500 text-lg mb-12 font-medium">El algoritmo se ajustará a esto.</Text>
            <View className="gap-y-4">
                {options.map((opt) => (
                    <TouchableOpacity key={opt.title} onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); onChange(opt.title); }} activeOpacity={0.9}>
                        {value === opt.title ? (
                            <LinearGradient colors={ZENIT_GRADIENT} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} className="p-6 rounded-3xl items-start shadow-lg shadow-orange-500/30"><Text className="text-xl font-bold mb-1 text-white">{opt.title}</Text><Text className="text-sm font-medium text-white/80">{opt.desc}</Text></LinearGradient>
                        ) : (
                            <View className="p-6 rounded-3xl border-2 items-start bg-white border-gray-100"><Text className="text-xl font-bold mb-1 text-zenitBlack">{opt.title}</Text><Text className="text-sm font-medium text-gray-500">{opt.desc}</Text></View>
                        )}
                    </TouchableOpacity>
                ))}
            </View>
        </View>
    );
};

const TargetWeightStep = ({ targetWeight, setTargetWeight, currentWeight, goal }) => {
    let minLimit, maxLimit;
    const SAFETY_MARGIN = 0.3; 
    if (goal === 'Perder Grasa') { maxLimit = currentWeight; minLimit = Math.round(currentWeight * (1 - SAFETY_MARGIN)); }
    else if (goal === 'Ganar Músculo') { minLimit = currentWeight; maxLimit = Math.round(currentWeight * (1 + SAFETY_MARGIN)); }
    else { minLimit = Math.round(currentWeight - 3); maxLimit = Math.round(currentWeight + 3); }

    return (
        <GestureHandlerRootView style={{ flex: 1 }}>
            <View className="flex-1 pt-4 px-6 justify-between pb-10">
                <View><Text className="text-zenitBlack text-4xl font-black tracking-tight mb-2">Tu Meta</Text><Text className="text-gray-500 text-lg font-medium">{goal === 'Perder Grasa' ? '¿Hasta dónde quieres bajar?' : goal === 'Ganar Músculo' ? '¿Hasta dónde quieres subir?' : 'Ajuste fino de mantenimiento.'}</Text></View>
                <View className="items-center justify-center flex-1">
                    <View className="items-center mb-12"><Text className="text-gray-400 font-bold uppercase tracking-widest text-xs mb-2">DIFERENCIA</Text><Text className={`text-5xl font-black ${Math.abs(targetWeight - currentWeight) < 0.1 ? 'text-gray-300' : 'text-zenitRed'}`}>{targetWeight > currentWeight ? '+' : ''}{(targetWeight - currentWeight).toFixed(1)} <Text className="text-2xl text-zenitBlack">kg</Text></Text><Text className="text-zenitBlack font-bold text-xl mt-2">Meta: {targetWeight.toFixed(1)} kg</Text></View>
                    <ZenitSlider value={targetWeight} onChange={setTargetWeight} min={minLimit} max={maxLimit} step={0.1} />
                    <View className="flex-row justify-between w-full px-2 mt-4"><Text className="text-gray-400 font-bold text-xs">{minLimit}kg</Text><Text className="text-gray-400 font-bold text-xs">{maxLimit}kg</Text></View>
                </View>
                <View className="bg-gray-50 p-4 rounded-2xl border border-gray-100"><Text className="text-gray-500 text-xs font-medium text-center leading-5"><Text className="text-zenitBlack font-bold">Nota:</Text> Limitamos el rango por seguridad. Para cambios mayores, te sugerimos ir por etapas.</Text></View>
            </View>
        </GestureHandlerRootView>
    );
};

const PaceStep = ({ value, onChange, goal }) => {
    const isLosing = goal === 'Perder Grasa';
    const options = [{ id: 'relaxed', title: isLosing ? 'Sostenible' : 'Volumen Limpio', desc: isLosing ? '-0.5 kg / semana' : '+0.2 kg / semana', emoji: '🌱' }, { id: 'normal', title: isLosing ? 'Exigente' : 'Híbrido', desc: isLosing ? '-1.0 kg / semana' : '+0.4 kg / semana', emoji: '⚡' }, { id: 'aggressive', title: 'MODO ZENIT', desc: isLosing ? '-1.5 kg / semana' : '+0.6 kg / semana', emoji: '🔥' }];
    return (
        <View className="flex-1 px-6 pt-8">
            <Text className="text-zenitBlack text-4xl font-black tracking-tight mb-2">Intensidad</Text><Text className="text-gray-500 text-lg mb-8 font-medium">Define la agresividad del plan.</Text>
            <View className="gap-y-4">
                {options.map((opt) => (
                    <TouchableOpacity key={opt.id} onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); onChange(opt.id); }} activeOpacity={0.9}>
                        {value === opt.id ? (
                            <LinearGradient colors={ZENIT_GRADIENT} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} className="p-6 rounded-3xl flex-row items-center justify-between shadow-lg shadow-orange-500/30"><View><Text className="text-xl font-bold mb-1 text-white">{opt.title}</Text><Text className="text-sm font-medium text-white/80">{opt.desc}</Text></View><Text className="text-4xl">{opt.emoji}</Text></LinearGradient>
                        ) : (
                            <View className="p-6 rounded-3xl border-2 flex-row items-center justify-between bg-white border-gray-100"><View><Text className="text-xl font-bold mb-1 text-zenitBlack">{opt.title}</Text><Text className="text-sm font-medium text-gray-500">{opt.desc}</Text></View><Text className="text-4xl">{opt.emoji}</Text></View>
                        )}
                    </TouchableOpacity>
                ))}
            </View>
        </View>
    );
};

const ProjectionStep = ({ currentWeight, targetWeight, pace, onNext, goal }) => {
    const diff = Math.abs(currentWeight - targetWeight);
    const isLosing = goal === 'Perder Grasa';
    let weeklyRate = isLosing ? (pace === 'aggressive' ? 1.5 : pace === 'normal' ? 1.0 : 0.5) : (pace === 'aggressive' ? 0.6 : pace === 'normal' ? 0.4 : 0.2);
    const weeksNeeded = weeklyRate > 0 ? diff / weeklyRate : 0;
    const daysNeeded = Math.round(weeksNeeded * 7);
    const date = new Date(); date.setDate(date.getDate() + daysNeeded);
    const dateString = date.toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' });

    return (
        <View className="flex-1 px-6 pt-10 bg-white justify-between pb-10">
            <View><View className="flex-row items-center mb-4"><Calendar size={24} color="#EF4444" className="mr-2" /><Text className="text-zenitRed font-bold uppercase tracking-widest text-xs">DEADLINE ESTIMADO</Text></View><Text className="text-zenitBlack text-5xl font-black mb-2 py-1">Llegarás el</Text><Text className="text-zenitRed text-4xl font-black leading-tight mb-8 uppercase">{dateString}</Text><Text className="text-gray-500 text-lg font-medium leading-relaxed">A este ritmo <Text className="text-zenitBlack font-bold">({weeklyRate}kg/sem)</Text>, alcanzarás tu meta de <Text className="text-zenitBlack font-bold">{targetWeight}kg</Text> en solo <Text className="text-zenitBlack font-bold">{daysNeeded} días</Text>.</Text></View>
            <View className="h-40 flex-row items-end justify-between px-2 mb-8"><View className="items-center"><Text className="text-gray-400 font-bold mb-2 text-xs">HOY</Text><View className="w-4 h-16 bg-gray-200 rounded-full" /><Text className="text-zenitBlack font-bold mt-2">{currentWeight}</Text></View><View className="flex-1 h-32 border-t-2 border-dashed border-gray-200 mx-4 mt-10 relative"><View className="absolute -top-3 left-[40%] bg-zenitBlack px-3 py-1 rounded-full shadow-lg shadow-black/30"><Text className="text-xs font-bold text-white">Zenit 🚀</Text></View></View><View className="items-center"><Text className="text-gray-400 font-bold mb-2 text-xs">META</Text><LinearGradient colors={ZENIT_GRADIENT} start={{ x: 0, y: 0 }} end={{ x: 0, y: 1 }} className="w-4 h-32 rounded-full shadow-lg shadow-orange-500/30" /><Text className="text-zenitBlack font-bold mt-2">{targetWeight}</Text></View></View>
            <GradientButton text="ESTADÍSTICAS" icon={ArrowRight} onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); onNext(); }} />
        </View>
    );
};

const SocialProofStep = ({ onNext }) => (
    <View className="flex-1 px-6 pt-10 bg-white justify-between pb-10">
        <View><View className="w-16 h-16 bg-gray-50 rounded-2xl items-center justify-center mb-6"><Users size={32} color="#0A0A0A" /></View><Text className="text-zenitBlack text-4xl font-black mb-4 leading-tight">El Efecto Zenit.</Text><Text className="text-gray-500 text-lg font-medium leading-relaxed mb-10">Analizamos 10,000 casos. Las personas que siguen un plan adaptativo llegan a su meta <Text className="text-zenitBlack font-bold">3.5x veces más rápido</Text> que con dietas estáticas.</Text><View className="gap-y-6"><View><View className="flex-row justify-between mb-2"><Text className="font-bold text-zenitBlack">Usuario Zenit AI</Text><Text className="font-bold text-zenitRed">3 Meses</Text></View><View className="h-4 bg-gray-100 rounded-full overflow-hidden w-full"><LinearGradient colors={ZENIT_GRADIENT} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} className="h-full w-[30%] rounded-full" /></View></View><View><View className="flex-row justify-between mb-2"><Text className="font-bold text-gray-400">Dieta Promedio</Text><Text className="font-bold text-gray-400">9 Meses</Text></View><View className="h-4 bg-gray-50 rounded-full overflow-hidden w-full"><View className="h-full bg-gray-300 w-[80%] rounded-full" /></View></View></View></View>
        <GradientButton text="CREAR MI PLAN" onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); onNext(); }} />
    </View>
);

// PASO 11: RESULTADO FINAL (FIX LAYOUT + VALIDACIONES)
const FinalResultStep = ({ onFinish, data, calculations, setResults }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [errors, setErrors] = useState({});
    const [editValues, setEditValues] = useState({
        calories: calculations.calories.toString(),
        protein: calculations.protein.toString(),
        carbs: calculations.carbs.toString(),
        fats: calculations.fats.toString(),
    });

    const validate = (key, val) => {
        const num = parseInt(val) || 0;
        const isInvalid = num < LIMITS[key].min || num > LIMITS[key].max;
        setErrors(prev => ({ ...prev, [key]: isInvalid }));
        return !isInvalid;
    };

    const handleSave = () => {
        const isValid = Object.keys(LIMITS).every(key => validate(key, editValues[key]));
        if (isValid) {
            setResults({
                calories: parseInt(editValues.calories), protein: parseInt(editValues.protein),
                carbs: parseInt(editValues.carbs), fats: parseInt(editValues.fats),
            });
            setIsEditing(false);
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        } else {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        }
    };

    return (
        <View className="flex-1 px-6 pt-10 bg-white justify-between pb-10">
            <ScrollView showsVerticalScrollIndicator={false}>
                <View className="items-center">
                    <Text className="text-zenitBlack text-4xl font-black mb-2">Tu Meta Zenit</Text>
                    <View className="bg-amber-50 p-4 rounded-2xl border border-amber-100 mb-8 w-full">
                        <Text className="text-amber-800 text-xs font-medium text-center">
                            <Text className="font-bold">Aviso:</Text> Ajusta con responsabilidad. Los valores fuera de rango se marcarán en rojo.
                        </Text>
                    </View>

                    {!isEditing ? (
                        <>
                            <PremiumRing size={200} strokeWidth={14} color={COLORS.blue} percentage={0.85}>
                                <Text numberOfLines={1} adjustsFontSizeToFit className="text-6xl font-black text-zenitBlack tracking-tighter">{calculations.calories}</Text>
                                <Text className="text-gray-400 text-sm font-bold tracking-[3px]">KCAL</Text>
                            </PremiumRing>
                            <View className="flex-row justify-between w-full mt-10 mb-8">
                                <MacroRingItem value={calculations.protein} label="PROT" color={COLORS.orange} />
                                <MacroRingItem value={calculations.carbs} label="CARB" color={COLORS.yellow} />
                                <MacroRingItem value={calculations.fats} label="GRASA" color={COLORS.green} />
                            </View>
                            <TouchableOpacity onPress={() => setIsEditing(true)}><Text className="text-zenitRed font-bold text-sm uppercase tracking-widest">Personalizar Valores</Text></TouchableOpacity>
                        </>
                    ) : (
                        <View className="w-full gap-y-6">
                            <EditField label={`Calorías (${LIMITS.calories.min}-${LIMITS.calories.max})`} value={editValues.calories} error={errors.calories} onChange={(v) => {setEditValues(p=>({...p, calories:v})); validate('calories',v);}} big />
                            
                            {/* LAYOUT FIX: gap reducido */}
                            <View className="flex-row gap-x-2 w-full">
                                <EditField label="Proteína" value={editValues.protein} error={errors.protein} color={COLORS.orange} onChange={(v)=>{setEditValues(p=>({...p, protein:v})); validate('protein',v);}} />
                                <EditField label="Carbos" value={editValues.carbs} error={errors.carbs} color={COLORS.yellow} onChange={(v)=>{setEditValues(p=>({...p, carbs:v})); validate('carbs',v);}} />
                                <EditField label="Grasas" value={editValues.fats} error={errors.fats} color={COLORS.green} onChange={(v)=>{setEditValues(p=>({...p, fats:v})); validate('fats',v);}} />
                            </View>
                            
                            <GradientButton text="CONFIRMAR AJUSTES" onPress={handleSave} />
                        </View>
                    )}
                </View>
            </ScrollView>
            
            {!isEditing && <SwipeButton onConfirm={onFinish} />}
        </View>
    );
};

// COMPONENTES AUXILIARES
const MacroRingItem = ({ value, label, color }) => (
    <View className="items-center">
        <PremiumRing size={85} strokeWidth={8} color={color} percentage={0.6}>
            <Text numberOfLines={1} adjustsFontSizeToFit className="text-xl font-black text-zenitBlack">{value}g</Text>
        </PremiumRing>
        <Text className="text-gray-400 text-[10px] font-black tracking-widest mt-3">{label}</Text>
    </View>
);

const EditField = ({ label, value, color, error, onChange, big }) => (
    <View className={`flex-1 bg-gray-50 p-3 rounded-3xl border-2 ${error ? 'border-red-500' : 'border-gray-100'}`}>
        <Text style={{ color: color || '#A1A1AA' }} className="font-bold text-[10px] uppercase mb-2" numberOfLines={1} adjustsFontSizeToFit>{label}</Text>
        <TextInput value={value} onChangeText={onChange} keyboardType="numeric" className={`${big ? 'text-5xl' : 'text-2xl'} font-black text-zenitBlack p-0`} />
    </View>
);

// --- CONTROLADOR PRINCIPAL ---
export default function OnboardingScreen({ navigation }) {
    const [step, setStep] = useState(0);
    const [formData, setFormData] = useState({ gender: null, goal: null, weight: 75.0, height: 175, age: '', activityFactor: null, pace: null });
    const [results, setResults] = useState({ calories: 0, protein: 0, carbs: 0, fats: 0 });

    const advanceStep = () => setStep(p => p + 1);
    const goBack = () => setStep(p => p - 1);

    const handleGoalSelection = (goal) => {
        let smartTarget = formData.weight;
        if (goal === 'Perder Grasa') smartTarget = formData.weight - 5;
        if (goal === 'Ganar Músculo') smartTarget = formData.weight + 3;
        setFormData(prev => ({ ...prev, goal, targetWeight: smartTarget }));
    };

    const calculatePlan = () => {
        let bmr;
        const w = formData.weight; const h = formData.height; const a = formData.age || 25; const activity = formData.activityFactor || 1.2;
        if (formData.gender === 'Femenino') bmr = 447.593 + (9.247 * w) + (3.098 * h) - (4.330 * a);
        else bmr = 88.362 + (13.397 * w) + (4.799 * h) - (5.677 * a);
        let tdee = bmr * activity; 
        if (formData.goal === 'Perder Grasa') tdee -= 500;
        if (formData.goal === 'Ganar Músculo') tdee += 300;
        const calories = Math.round(tdee);
        let pRatio = 0.3, cRatio = 0.4, fRatio = 0.3;
        if (formData.goal === 'Perder Grasa') { pRatio = 0.4; cRatio = 0.3; fRatio = 0.3; }
        if (formData.goal === 'Ganar Músculo') { pRatio = 0.3; cRatio = 0.5; fRatio = 0.2; }
        setResults({ calories, protein: Math.round((calories * pRatio) / 4), carbs: Math.round((calories * cRatio) / 4), fats: Math.round((calories * fRatio) / 9) });
        advanceStep();
    };

    const renderContent = () => {
        switch(step) {
            case 0: return <HeroStep onNext={advanceStep} />;
            case 1: return <GenderStep value={formData.gender} onChange={(val) => setFormData(p => ({...p, gender: val}))} />;
            case 2: return <BiometricsStep weight={formData.weight} setWeight={(val) => setFormData(prev => ({...prev, weight: val}))} height={formData.height} setHeight={(val) => setFormData(prev => ({...prev, height: val}))} />;
            case 3: return <AgeStep value={formData.age} onChange={(val) => setFormData(prev => ({...prev, age: val}))} />;
            case 4: return <ActivityStep value={formData.activityFactor} onChange={(val) => setFormData(prev => ({...prev, activityFactor: val}))} />;
            case 5: return <GoalStep value={formData.goal} onChange={handleGoalSelection} />;
            case 6: return <TargetWeightStep targetWeight={formData.targetWeight} setTargetWeight={(val) => setFormData(prev => ({...prev, targetWeight: val}))} currentWeight={formData.weight} goal={formData.goal} />;
            case 7: return <PaceStep value={formData.pace} onChange={(val) => setFormData(prev => ({...prev, pace: val}))} goal={formData.goal} />;
            case 8: return <ProjectionStep currentWeight={formData.weight} targetWeight={formData.targetWeight} pace={formData.pace} goal={formData.goal} onNext={advanceStep} />;
            case 9: return <SocialProofStep onNext={advanceStep} />;
            case 10: return <ProcessingScreen onFinish={calculatePlan} pace={formData.pace} goal={formData.goal} />;
            case 11: return <FinalResultStep data={formData} calculations={results} setResults={setResults} onFinish={() => navigation.replace('Home')} />;
            default: return null;
        }
    };

    const isNextEnabled = () => {
        if (step === 1) return formData.gender !== null;
        if (step === 3) return formData.age > 10 && formData.age < 120; 
        if (step === 4) return formData.activityFactor !== null; 
        if (step === 5) return formData.goal !== null;
        if (step === 7) return formData.pace !== null;
        return [2, 6].includes(step); 
    };

    const showContinueButton = [1, 2, 3, 4, 5, 6, 7].includes(step);

    return (
        <View className="flex-1 bg-white">
            <StatusBar style="dark" />
            <View style={{ flex: 1, paddingTop: STATUSBAR_HEIGHT }}>
                {step > 0 && step < 10 && (
                  <View className="px-4 py-2 flex-row items-center mb-2">
                    <TouchableOpacity onPress={goBack} className="w-10 h-10 bg-gray-50 rounded-full items-center justify-center border border-gray-100"><ChevronLeft size={24} color="#0A0A0A" /></TouchableOpacity>
                    <View className="flex-1 mx-4 h-2 bg-gray-100 rounded-full overflow-hidden"><Animated.View className="h-full rounded-full w-full bg-gray-100"><LinearGradient colors={ZENIT_GRADIENT} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={{ height: '100%', width: `${(step / 10) * 100}%` }} /></Animated.View></View>
                    <View className="w-10" /> 
                  </View>
                )}
                {renderContent()}
                {showContinueButton && (
                    <View className="px-6 pb-8 pt-2 bg-white">
                        <GradientButton text="CONTINUAR" disabled={!isNextEnabled()} onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); advanceStep(); }} />
                    </View>
                )}
            </View>
        </View>
    );
}