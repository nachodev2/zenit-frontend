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
    Delete,
    Mail,
    Lock,
    User
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
    Easing,
    FadeInDown,
    FadeInUp, 
    FadeInRight,
    ZoomIn,
    Layout
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient'; 
import Svg, { Circle, G, Defs, LinearGradient as SvgLinearGradient, Stop } from 'react-native-svg';

// Asegúrate de que las rutas sean correctas
import GesturePicker from '../components/ui/GesturePicker'; 
import ProcessingScreen from '../components/onboarding/ProcessingScreen';

// --- CONFIGURACIÓN ---
const AnimatedCircle = Animated.createAnimatedComponent(Circle);
const AnimatedTouchableOpacity = Animated.createAnimatedComponent(TouchableOpacity); 
const { width } = Dimensions.get('window');
const STATUSBAR_HEIGHT = Platform.OS === 'android' ? RNStatusBar.currentHeight + 20 : 0;

// PALETA DE GRADIENTES
const ZENIT_GRADIENT = ['#DC2626', '#F97316'];

const GRADIENTS = {
    blue:   ['#2563EB', '#60A5FA'],
    orange: ['#EA580C', '#FDBA74'],
    yellow: ['#CA8A04', '#FDE047'],
    green:  ['#16A34A', '#86EFAC'],
};

// CONSTANTES Y LÍMITES
const COLORS = {
    blue: '#2563EB', 
    orange: '#F97316', 
    yellow: '#FACC15', 
    green: '#22C55E',
};

const LIMITS = {
    calories: { min: 500, max: 8000 },
    protein: { min: 20, max: 500 },
    carbs: { min: 20, max: 1000 },
    fats: { min: 10, max: 300 }
};

// --- COMPONENTE: ANILLO PREMIUM CON GRADIENTE ---
const PremiumRing = ({ size = 100, strokeWidth = 8, gradientColors = GRADIENTS.blue, percentage = 0.75, id = "ring", children }) => {
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
                <Defs>
                    <SvgLinearGradient id={`grad_${id}`} x1="0%" y1="0%" x2="100%" y2="100%">
                        <Stop offset="0%" stopColor={gradientColors[0]} stopOpacity="1" />
                        <Stop offset="100%" stopColor={gradientColors[1]} stopOpacity="1" />
                    </SvgLinearGradient>
                </Defs>
                <G origin={`${center}, ${center}`} rotation="-90">
                    <Circle cx={center} cy={center} r={radius} stroke="#F3F4F6" strokeWidth={strokeWidth} fill="transparent" />
                    <AnimatedCircle
                        stroke={`url(#grad_${id})`} cx={center} cy={center} r={radius} 
                        strokeWidth={strokeWidth} fill="transparent"
                        strokeDasharray={circumference} animatedProps={animatedProps} strokeLinecap="round" 
                    />
                </G>
            </Svg>
            <View className="items-center justify-center w-full h-full">{children}</View>
        </View>
    );
};

// --- COMPONENTE: BOTÓN GRADIENTE ---
const GradientButton = ({ onPress, disabled, text, icon: Icon }) => (
    <TouchableOpacity onPress={onPress} disabled={disabled} activeOpacity={0.9} className={`w-full ${disabled ? 'opacity-50' : ''} shadow-lg shadow-orange-500/40`}>
        <LinearGradient colors={ZENIT_GRADIENT} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} className="w-full py-5 rounded-full items-center flex-row justify-center">
            <Text className="text-white font-bold text-lg tracking-wide mr-2">{text}</Text>
            {Icon && <Icon size={20} color="white" strokeWidth={3} />}
        </LinearGradient>
    </TouchableOpacity>
);

// --- COMPONENTE: BOTÓN SWIPE ---
const SwipeButton = ({ onConfirm }) => {
    const BUTTON_HEIGHT = 60;
    const PADDING = 4;
    const BUTTON_WIDTH = width - 48; 
    const SWIPEABLE_DIMENSIONS = BUTTON_HEIGHT - 2 * PADDING;
    const H_SWIPE_RANGE = BUTTON_WIDTH - 2 * PADDING - SWIPEABLE_DIMENSIONS;

    const X = useSharedValue(0);
    const [toggled, setToggled] = useState(false);

    const animatedStyles = useAnimatedStyle(() => ({ transform: [{ translateX: X.value }] }));
    const AnimatedLinearGradient = Animated.createAnimatedComponent(LinearGradient);
    const fillStyle = useAnimatedStyle(() => ({ width: X.value + SWIPEABLE_DIMENSIONS }));
    const textOpacityStyle = useAnimatedStyle(() => ({ opacity: 1 - (X.value / H_SWIPE_RANGE) * 1.5 }));

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
            <AnimatedLinearGradient colors={ZENIT_GRADIENT} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={[{ height: BUTTON_HEIGHT, borderRadius: 99, position: 'absolute', left: 0 }, fillStyle]} />
            <View className="absolute w-full items-center justify-center"><Animated.Text style={[{ fontSize: 14, fontWeight: '800', letterSpacing: 1, color: '#A1A1AA', textTransform: 'uppercase' }, textOpacityStyle]}>Desliza para comenzar</Animated.Text></View>
            <GestureDetector gesture={panGesture}>
                <Animated.View style={[animatedStyles, { width: SWIPEABLE_DIMENSIONS, height: SWIPEABLE_DIMENSIONS, borderRadius: 99, backgroundColor: 'white', marginLeft: PADDING, alignItems: 'center', justifyContent: 'center', shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.15, shadowRadius: 3.84, elevation: 5 }]}>
                    <ArrowRight size={24} color="#F97316" strokeWidth={3} />
                </Animated.View>
            </GestureDetector>
        </View>
    );
};

// --- COMPONENTE: ZENIT SLIDER (ANTI-CRASH) ---
const ZenitSlider = ({ value, onChange, min, max, step = 0.1 }) => {
    const SLIDER_WIDTH = width - 48; 
    const KNOB_SIZE = 32;
    const MAX_X = SLIDER_WIDTH - KNOB_SIZE;
    const isDragging = useRef(false);
    const translateX = useSharedValue(0);
    const context = useSharedValue(0);
    const scale = useSharedValue(1);

    useEffect(() => {
        if (!isDragging.current) {
            const safeValue = Math.max(min, Math.min(max, value));
            const percentage = (safeValue - min) / (max - min);
            translateX.value = withSpring(percentage * MAX_X, { damping: 20 });
        }
    }, [value, min, max]);

    const startDragging = () => { isDragging.current = true; };
    const stopDragging = () => { isDragging.current = false; };

    const pan = Gesture.Pan()
        .onBegin(() => {
            runOnJS(startDragging)(); 
            context.value = translateX.value;
            scale.value = withSpring(1.2);
        })
        .onUpdate((e) => {
            let newX = context.value + e.translationX;
            newX = Math.max(0, Math.min(MAX_X, newX));
            translateX.value = newX;
            const percentage = newX / MAX_X;
            const rawValue = min + (percentage * (max - min));
            const rounded = Math.round(rawValue / step) * step;
            runOnJS(onChange)(Number(rounded.toFixed(1)));
        })
        .onFinalize(() => {
            scale.value = withSpring(1);
            runOnJS(stopDragging)(); 
        });

    const knobStyle = useAnimatedStyle(() => ({ transform: [{ translateX: translateX.value }, { scale: scale.value }] }));
    const progressStyle = useAnimatedStyle(() => ({ width: translateX.value + KNOB_SIZE / 2 }));

    return (
        <View style={{ width: SLIDER_WIDTH }} className="h-12 justify-center">
            <View className="absolute left-0 right-0 h-2 bg-gray-100 rounded-full" />
            <Animated.View className="absolute left-0 h-2 rounded-full overflow-hidden" style={progressStyle}><LinearGradient colors={ZENIT_GRADIENT} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={{ flex: 1 }} /></Animated.View>
            <GestureDetector gesture={pan}><Animated.View style={knobStyle} className="absolute bg-white w-8 h-8 rounded-full shadow-md border border-gray-100 items-center justify-center"><View className="w-2 h-2 bg-gray-300 rounded-full" /></Animated.View></GestureDetector>
        </View>
    );
};

// ==========================================
// PASOS DEL ONBOARDING
// ==========================================

const HeroStep = ({ onNext }) => (
  <View className="flex-1 bg-white">
      <View className="flex-1 bg-white items-center justify-center relative overflow-hidden">
           <Animated.View entering={ZoomIn.duration(800).springify()} className="absolute items-center justify-center">
                <View className="w-20 h-20 bg-gray-50 rounded-full items-center justify-center mb-4">
                    <Play size={32} color="#0A0A0A" fill="#0A0A0A" />
                </View>
                <Text className="text-gray-400 text-xs uppercase tracking-widest">Video Loop Demo</Text>
           </Animated.View>
           <Animated.View entering={FadeInDown.delay(300).duration(800)} className="absolute bottom-10 left-0 right-0 px-6">
                <Text className="text-zenitBlack text-6xl font-black tracking-tighter text-center mb-1">ZENIT.</Text>
                <Text className="text-zenitTextMuted text-2xl font-medium tracking-tight text-center">No hay techo.</Text>
           </Animated.View>
      </View>
      <Animated.View entering={FadeInDown.delay(600).springify()} className="bg-white px-6 py-8 pb-12 rounded-t-3xl shadow-sm">
          <GradientButton text="INICIAR CALIBRACIÓN" onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); onNext(); }} />
          <TouchableOpacity className="mt-6">
            <Text className="text-center text-gray-400 font-medium text-sm">¿Ya tienes cuenta? <Text className="text-zenitBlack font-bold">Inicia sesión</Text></Text>
          </TouchableOpacity>
      </Animated.View>
  </View>
);

const GenderStep = ({ value, onChange }) => {
  const options = ['Masculino', 'Femenino', 'Otro'];
  return (
    <Animated.View entering={FadeInRight.duration(400)} className="flex-1 px-6 pt-8">
      <Animated.Text entering={FadeInDown.delay(100)} className="text-zenitBlack text-4xl font-black tracking-tight mb-2">Elegí tu género</Animated.Text>
      <Animated.Text entering={FadeInDown.delay(200)} className="text-gray-500 text-lg mb-12 font-medium">Para calibrar tu metabolismo basal.</Animated.Text>
      <View className="gap-y-4">
        {options.map((opt, index) => (
            <AnimatedTouchableOpacity 
                key={opt} 
                entering={FadeInUp.delay(300 + index * 100).duration(600).easing(Easing.out(Easing.quad))}
                onPress={() => { onChange(opt); }} 
                activeOpacity={0.9}
            >
                {value === opt ? (
                    <LinearGradient colors={ZENIT_GRADIENT} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} className="py-6 rounded-3xl items-center shadow-lg shadow-orange-500/30">
                        <Text className="text-xl font-bold text-white">{opt}</Text>
                    </LinearGradient>
                ) : (
                    <View className="py-6 rounded-3xl border-2 items-center bg-white border-gray-100">
                        <Text className="text-xl font-bold text-zenitBlack">{opt}</Text>
                    </View>
                )}
            </AnimatedTouchableOpacity>
        ))}
      </View>
    </Animated.View>
  );
};

const BiometricsStep = ({ weight, setWeight, height, setHeight }) => (
    <GestureHandlerRootView style={{ flex: 1 }}>
        <Animated.View entering={FadeInRight.duration(400)} className="flex-1 pt-4 px-6">
            <View className="mb-6">
                 <Animated.Text entering={FadeInDown.delay(100)} className="text-zenitBlack text-4xl font-black tracking-tight mb-2">Tus Medidas</Animated.Text>
                 <Animated.Text entering={FadeInDown.delay(200)} className="text-gray-500 text-lg font-medium">Toca el número y desliza para ajustar.</Animated.Text>
            </View>
            <View className="flex-1 justify-center gap-y-6">
                <Animated.View entering={FadeInUp.delay(300).duration(600).easing(Easing.out(Easing.quad))}>
                    <GesturePicker label="Altura" value={height} onChange={setHeight} min={100} max={250} step={1} unit="cm" orientation="vertical" />
                </Animated.View>
                <Animated.View entering={FadeInUp.delay(400).duration(600).easing(Easing.out(Easing.quad))}>
                    <GesturePicker label="Peso" value={weight} onChange={setWeight} min={30} max={300} step={0.1} unit="kg" orientation="horizontal" />
                </Animated.View>
            </View>
        </Animated.View>
    </GestureHandlerRootView>
);

// --- COMPONENTE OPTIMIZADO CON FIX DE INPUT ---
const BodyFatStep = ({ bodyType, setBodyType, preciseFat, setPreciseFat }) => {
    const [isPreciseMode, setIsPreciseMode] = useState(false);
    
    // Opciones visuales
    const options = [
        { id: 'low', title: 'Definido', desc: 'Venas visibles\n(8-12%)', emoji: '🦴' },
        { id: 'average', title: 'Promedio', desc: 'Normal\n(15-20%)', emoji: '⚖️' },
        { id: 'muscle', title: 'Muscular', desc: 'Atlético\n(12-18%)', emoji: '💪' },
        { id: 'high_fat', title: 'Sobrepeso', desc: 'Grasa extra\n(>25%)', emoji: '🍔' }
    ];

    return (
        <Animated.View entering={FadeInRight.duration(400)} className="flex-1 px-6 pt-4">
            <View className="mb-4">
                <Animated.Text entering={FadeInDown.delay(100)} className="text-zenitBlack text-3xl font-black tracking-tight mb-1">
                    {isPreciseMode ? 'Datos Precisos' : 'Tu Cuerpo'}
                </Animated.Text>
                <Animated.Text entering={FadeInDown.delay(200)} className="text-gray-500 text-base font-medium">
                    {isPreciseMode ? 'Ingresa tu porcentaje de grasa real.' : 'Selecciona tu composición actual.'}
                </Animated.Text>
            </View>

            {isPreciseMode ? (
                // MODO PRECISO: FIX DE INPUT CORTADO
                <Animated.View entering={FadeInUp.duration(500)} className="flex-1">
                    <View className="bg-gray-50 p-6 rounded-3xl border-2 border-orange-100 items-center mb-6">
                        <Text className="text-gray-400 font-bold uppercase tracking-widest text-xs mb-4">PORCENTAJE DE GRASA</Text>
                        <View className="flex-row items-end">
                            <TextInput 
                                value={preciseFat}
                                onChangeText={(text) => {
                                    if (/^\d*([.,]\d{0,1})?$/.test(text)) {
                                        const normalized = text.replace(',', '.');
                                        if (parseFloat(normalized) < 100 || text === '') {
                                            setPreciseFat(text);
                                        }
                                    }
                                }}
                                keyboardType="numeric"
                                placeholder="20"
                                // FIX: includeFontPadding y LineHeight específico para evitar cortes
                                style={{ includeFontPadding: false, lineHeight: 85, height: 90, textAlignVertical: 'center' }}
                                className="text-7xl font-black text-zenitBlack text-center p-0"
                                maxLength={4}
                            />
                            <Text className="text-3xl font-bold text-gray-400 mb-6 ml-1">%</Text>
                        </View>
                    </View>
                    <Text className="text-center text-gray-400 text-xs px-4">
                        Usaremos la fórmula <Text className="font-bold text-gray-500">Katch-McArdle</Text>, el estándar de oro.
                    </Text>
                </Animated.View>
            ) : (
                // MODO VISUAL GRID
                <View className="flex-row flex-wrap justify-between gap-y-3">
                    {options.map((opt, index) => (
                        <AnimatedTouchableOpacity 
                            key={opt.id} 
                            entering={FadeInUp.delay(300 + index * 50).duration(500)}
                            onPress={() => { 
                                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); 
                                setBodyType(opt.id); 
                            }} 
                            activeOpacity={0.9}
                            className="w-[48%]" 
                        >
                            {bodyType === opt.id ? (
                                <LinearGradient colors={ZENIT_GRADIENT} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} className="p-4 rounded-3xl h-40 justify-between shadow-lg shadow-orange-500/30">
                                    <Text className="text-4xl">{opt.emoji}</Text>
                                    <View><Text className="text-lg font-bold text-white mb-0.5">{opt.title}</Text><Text className="text-xs font-medium text-white/90 leading-4">{opt.desc}</Text></View>
                                </LinearGradient>
                            ) : (
                                <View className="p-4 rounded-3xl border-2 bg-white border-gray-100 h-40 justify-between">
                                    <Text className="text-4xl opacity-80">{opt.emoji}</Text>
                                    <View><Text className="text-lg font-bold text-zenitBlack mb-0.5">{opt.title}</Text><Text className="text-xs font-medium text-gray-400 leading-4">{opt.desc}</Text></View>
                                </View>
                            )}
                        </AnimatedTouchableOpacity>
                    ))}
                </View>
            )}

            <TouchableOpacity 
                onPress={() => {
                    Haptics.selectionAsync();
                    setIsPreciseMode(!isPreciseMode);
                    if (!isPreciseMode) setBodyType(null); 
                    else setPreciseFat('');
                }}
                className="mt-6 self-center p-2"
            >
                <Text className="text-zenitRed font-bold text-xs uppercase tracking-widest text-center">
                    {isPreciseMode ? 'Volver a selección visual' : 'Ingresar % exacto'}
                </Text>
            </TouchableOpacity>
        </Animated.View>
    );
};

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
        <Animated.View entering={FadeInRight.duration(400)} className="flex-1 px-6 pt-4">
            <View className="mb-4">
                <Animated.Text entering={FadeInDown.delay(100)} className="text-zenitBlack text-4xl font-black tracking-tight mb-2">Tu Edad</Animated.Text>
                <Animated.Text entering={FadeInDown.delay(200)} className="text-gray-500 text-lg font-medium">Define tu etapa vital.</Animated.Text>
            </View>
            <View className="items-center justify-center flex-1 max-h-32 mb-8">
                <Text className={`text-7xl font-bold tracking-tight ${!value ? 'text-gray-300' : 'text-zenitBlack'}`}>{value || '0'}</Text>
                <Text className="text-zenitRed text-sm font-bold tracking-widest uppercase mt-2">AÑOS</Text>
            </View>
            <View className="flex-row flex-wrap justify-center gap-x-6 gap-y-4 px-2">
                {keys.map((k, i) => (k === '.' ? <View key={i} className="w-[80px] h-[80px]" /> : 
                    <AnimatedTouchableOpacity 
                        key={i} 
                        entering={FadeInUp.delay(300 + i * 30).duration(500).easing(Easing.out(Easing.quad))}
                        onPress={() => handlePress(k)} 
                        className={`w-[80px] h-[80px] rounded-full items-center justify-center ${k === 'del' ? 'bg-transparent' : 'bg-gray-100 active:bg-gray-200'}`}
                    >
                        {k === 'del' ? <Delete size={28} color="#0A0A0A" /> : <Text className="text-3xl font-medium text-zenitBlack">{k}</Text>}
                    </AnimatedTouchableOpacity>
                ))}
            </View>
        </Animated.View>
    );
};

const ActivityStep = ({ value, onChange }) => {
    const levels = [{ id:1.2, title: 'Sedentario', desc: 'Poco o nada de ejercicio', icon: Move }, { id:1.375, title: 'Ligero', desc: 'Ejercicio ligero 1-3 días/sem', icon: Zap }, { id:1.55, title: 'Moderado', desc: 'Ejercicio moderado 3-5 días/sem', icon: Flame }, { id:1.725, title: 'Intenso', desc: 'Ejercicio intenso 6-7 días/sem', icon: Trophy }];
    return (
        <Animated.View entering={FadeInRight.duration(400)} className="flex-1 px-6 pt-4">
            <View className="mb-6">
                <Animated.Text entering={FadeInDown.delay(100)} className="text-zenitBlack text-4xl font-black tracking-tight mb-2">Tu Ritmo</Animated.Text>
                <Animated.Text entering={FadeInDown.delay(200)} className="text-gray-500 text-lg font-medium">¿Cuánto te mueves hoy?</Animated.Text>
            </View>
            <View className="gap-y-4">
                {levels.map((lvl, index) => (
                    <AnimatedTouchableOpacity 
                        key={lvl.id} 
                        entering={FadeInUp.delay(300 + index * 100).duration(600).easing(Easing.out(Easing.quad))}
                        onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); onChange(lvl.id); }} 
                        activeOpacity={0.9}
                    >
                        {value === lvl.id ? (
                            <LinearGradient colors={ZENIT_GRADIENT} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} className="flex-row items-center p-5 rounded-3xl shadow-lg shadow-orange-500/30">
                                <View className="w-12 h-12 rounded-full items-center justify-center mr-4 bg-white/20"><lvl.icon size={24} color="#fff" /></View>
                                <View className="flex-1"><Text className="text-xl font-bold mb-0.5 text-white">{lvl.title}</Text><Text className="text-sm font-medium text-white/80">{lvl.desc}</Text></View>
                                <View className="w-6 h-6 rounded-full items-center justify-center ml-2 bg-white"><Check size={14} color="#F97316" strokeWidth={4} /></View>
                            </LinearGradient>
                        ) : (
                            <View className="flex-row items-center p-5 rounded-3xl border bg-white border-gray-100 shadow-sm"><View className="w-12 h-12 rounded-full items-center justify-center mr-4 bg-gray-50"><lvl.icon size={24} color="#0A0A0A" /></View><View className="flex-1"><Text className="text-xl font-bold mb-0.5 text-zenitBlack">{lvl.title}</Text><Text className="text-sm font-medium text-gray-400">{lvl.desc}</Text></View></View>
                        )}
                    </AnimatedTouchableOpacity>
                ))}
            </View>
        </Animated.View>
    );
};

const GoalStep = ({ value, onChange }) => {
    const options = [{ title: 'Perder Grasa', desc: 'Déficit calórico controlado' }, { title: 'Mantenimiento', desc: 'Rendimiento y energía estable' }, { title: 'Ganar Músculo', desc: 'Superávit estratégico' }];
    return (
        <Animated.View entering={FadeInRight.duration(400)} className="flex-1 px-6 pt-8">
            <Animated.Text entering={FadeInDown.delay(100)} className="text-zenitBlack text-4xl font-black tracking-tight mb-2">Tu Objetivo</Animated.Text>
            <Animated.Text entering={FadeInDown.delay(200)} className="text-gray-500 text-lg mb-12 font-medium">El algoritmo se ajustará a esto.</Animated.Text>
            <View className="gap-y-4">
                {options.map((opt, index) => (
                    <AnimatedTouchableOpacity 
                        key={opt.title} 
                        entering={FadeInUp.delay(300 + index * 100).duration(600).easing(Easing.out(Easing.quad))}
                        onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); onChange(opt.title); }} 
                        activeOpacity={0.9}
                    >
                        {value === opt.title ? (
                            <LinearGradient colors={ZENIT_GRADIENT} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} className="p-6 rounded-3xl items-start shadow-lg shadow-orange-500/30"><Text className="text-xl font-bold mb-1 text-white">{opt.title}</Text><Text className="text-sm font-medium text-white/80">{opt.desc}</Text></LinearGradient>
                        ) : (
                            <View className="p-6 rounded-3xl border-2 items-start bg-white border-gray-100"><Text className="text-xl font-bold mb-1 text-zenitBlack">{opt.title}</Text><Text className="text-sm font-medium text-gray-500">{opt.desc}</Text></View>
                        )}
                    </AnimatedTouchableOpacity>
                ))}
            </View>
        </Animated.View>
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
            <Animated.View entering={FadeInRight.duration(400)} className="flex-1 pt-4 px-6 justify-between pb-10">
                <View>
                    <Animated.Text entering={FadeInDown.delay(100)} className="text-zenitBlack text-4xl font-black tracking-tight mb-2">Tu Meta</Animated.Text>
                    <Animated.Text entering={FadeInDown.delay(200)} className="text-gray-500 text-lg font-medium">{goal === 'Perder Grasa' ? '¿Hasta dónde quieres bajar?' : goal === 'Ganar Músculo' ? '¿Hasta dónde quieres subir?' : 'Ajuste fino de mantenimiento.'}</Animated.Text>
                </View>
                <Animated.View entering={FadeInUp.delay(300).duration(600).easing(Easing.out(Easing.quad))} className="items-center justify-center flex-1">
                    <View className="items-center mb-12"><Text className="text-gray-400 font-bold uppercase tracking-widest text-xs mb-2">DIFERENCIA</Text><Text className={`text-5xl font-black ${Math.abs(targetWeight - currentWeight) < 0.1 ? 'text-gray-300' : 'text-zenitRed'}`}>{targetWeight > currentWeight ? '+' : ''}{(targetWeight - currentWeight).toFixed(1)} <Text className="text-2xl text-zenitBlack">kg</Text></Text><Text className="text-zenitBlack font-bold text-xl mt-2">Meta: {targetWeight.toFixed(1)} kg</Text></View>
                    <ZenitSlider value={targetWeight} onChange={setTargetWeight} min={minLimit} max={maxLimit} step={0.1} />
                    <View className="flex-row justify-between w-full px-2 mt-4"><Text className="text-gray-400 font-bold text-xs">{minLimit}kg</Text><Text className="text-gray-400 font-bold text-xs">{maxLimit}kg</Text></View>
                </Animated.View>
                <View className="bg-gray-50 p-4 rounded-2xl border border-gray-100"><Text className="text-gray-500 text-xs font-medium text-center leading-5"><Text className="text-zenitBlack font-bold">Nota:</Text> Limitamos el rango por seguridad. Para cambios mayores, te sugerimos ir por etapas.</Text></View>
            </Animated.View>
        </GestureHandlerRootView>
    );
};

const PaceStep = ({ value, onChange, goal }) => {
    const isLosing = goal === 'Perder Grasa';
    const options = [{ id: 'relaxed', title: isLosing ? 'Sostenible' : 'Volumen Limpio', desc: isLosing ? '-0.5 kg / semana' : '+0.2 kg / semana', emoji: '🌱' }, { id: 'normal', title: isLosing ? 'Exigente' : 'Híbrido', desc: isLosing ? '-1.0 kg / semana' : '+0.4 kg / semana', emoji: '⚡' }, { id: 'aggressive', title: 'MODO ZENIT', desc: isLosing ? '-1.5 kg / semana' : '+0.6 kg / semana', emoji: '🔥' }];
    return (
        <Animated.View entering={FadeInRight.duration(400)} className="flex-1 px-6 pt-8">
            <Animated.Text entering={FadeInDown.delay(100)} className="text-zenitBlack text-4xl font-black tracking-tight mb-2">Intensidad</Animated.Text>
            <Animated.Text entering={FadeInDown.delay(200)} className="text-gray-500 text-lg mb-8 font-medium">Define la agresividad del plan.</Animated.Text>
            <View className="gap-y-4">
                {options.map((opt, index) => (
                    <AnimatedTouchableOpacity 
                        key={opt.id} 
                        entering={FadeInUp.delay(300 + index * 100).duration(600).easing(Easing.out(Easing.quad))}
                        onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); onChange(opt.id); }} 
                        activeOpacity={0.9}
                    >
                        {value === opt.id ? (
                            <LinearGradient colors={ZENIT_GRADIENT} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} className="p-6 rounded-3xl flex-row items-center justify-between shadow-lg shadow-orange-500/30"><View><Text className="text-xl font-bold mb-1 text-white">{opt.title}</Text><Text className="text-sm font-medium text-white/80">{opt.desc}</Text></View><Text className="text-4xl">{opt.emoji}</Text></LinearGradient>
                        ) : (
                            <View className="p-6 rounded-3xl border-2 flex-row items-center justify-between bg-white border-gray-100"><View><Text className="text-xl font-bold mb-1 text-zenitBlack">{opt.title}</Text><Text className="text-sm font-medium text-gray-500">{opt.desc}</Text></View><Text className="text-4xl">{opt.emoji}</Text></View>
                        )}
                    </AnimatedTouchableOpacity>
                ))}
            </View>
        </Animated.View>
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
        <Animated.View entering={FadeInRight.duration(400)} className="flex-1 px-6 pt-10 bg-white justify-between pb-10">
            <View><View className="flex-row items-center mb-4"><Calendar size={24} color="#EF4444" className="mr-2" /><Text className="text-zenitRed font-bold uppercase tracking-widest text-xs">DEADLINE ESTIMADO</Text></View><Text className="text-zenitBlack text-5xl font-black mb-2 py-1">Llegarás el</Text><Text className="text-zenitRed text-4xl font-black leading-tight mb-8 uppercase">{dateString}</Text><Text className="text-gray-500 text-lg font-medium leading-relaxed">A este ritmo <Text className="text-zenitBlack font-bold">({weeklyRate}kg/sem)</Text>, alcanzarás tu meta de <Text className="text-zenitBlack font-bold">{targetWeight}kg</Text> en solo <Text className="text-zenitBlack font-bold">{daysNeeded} días</Text>.</Text></View>
            <View className="h-40 flex-row items-end justify-between px-2 mb-8"><View className="items-center"><Text className="text-gray-400 font-bold mb-2 text-xs">HOY</Text><View className="w-4 h-16 bg-gray-200 rounded-full" /><Text className="text-zenitBlack font-bold mt-2">{currentWeight}</Text></View><View className="flex-1 h-32 border-t-2 border-dashed border-gray-200 mx-4 mt-10 relative"><View className="absolute -top-3 left-[40%] bg-zenitBlack px-3 py-1 rounded-full shadow-lg shadow-black/30"><Text className="text-xs font-bold text-white">Zenit 🚀</Text></View></View><View className="items-center"><Text className="text-gray-400 font-bold mb-2 text-xs">META</Text><LinearGradient colors={ZENIT_GRADIENT} start={{ x: 0, y: 0 }} end={{ x: 0, y: 1 }} className="w-4 h-32 rounded-full shadow-lg shadow-orange-500/30" /><Text className="text-zenitBlack font-bold mt-2">{targetWeight}</Text></View></View>
            <GradientButton text="ESTADÍSTICAS" icon={ArrowRight} onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); onNext(); }} />
        </Animated.View>
    );
};

const SocialProofStep = ({ onNext }) => (
    <Animated.View entering={FadeInRight.duration(400)} className="flex-1 px-6 pt-10 bg-white justify-between pb-10">
        <View><View className="w-16 h-16 bg-gray-50 rounded-2xl items-center justify-center mb-6"><Users size={32} color="#0A0A0A" /></View><Text className="text-zenitBlack text-4xl font-black mb-4 leading-tight">El Efecto Zenit.</Text><Text className="text-gray-500 text-lg font-medium leading-relaxed mb-10">Analizamos 10,000 casos. Las personas que siguen un plan adaptativo llegan a su meta <Text className="text-zenitBlack font-bold">3.5x veces más rápido</Text> que con dietas estáticas.</Text><View className="gap-y-6"><View><View className="flex-row justify-between mb-2"><Text className="font-bold text-zenitBlack">Usuario Zenit AI</Text><Text className="font-bold text-zenitRed">3 Meses</Text></View><View className="h-4 bg-gray-100 rounded-full overflow-hidden w-full"><LinearGradient colors={ZENIT_GRADIENT} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} className="h-full w-[30%] rounded-full" /></View></View><View><View className="flex-row justify-between mb-2"><Text className="font-bold text-gray-400">Dieta Promedio</Text><Text className="font-bold text-gray-400">9 Meses</Text></View><View className="h-4 bg-gray-50 rounded-full overflow-hidden w-full"><View className="h-full bg-gray-300 w-[80%] rounded-full" /></View></View></View></View>
        <GradientButton text="CREAR MI PLAN" onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); onNext(); }} />
    </Animated.View>
);

// --- PANTALLA DE RESULTADOS (PASO 12) ---
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
        <Animated.View entering={FadeInRight.duration(600)} className="flex-1 px-6 pt-10 bg-white justify-between pb-10">
            <ScrollView showsVerticalScrollIndicator={false}>
                <View className="items-center">
                    <Animated.Text entering={FadeInDown.delay(100)} className="text-zenitBlack text-4xl font-black text-center mb-2">Tu Meta Zenit</Animated.Text>
                    <Animated.View entering={FadeInDown.delay(200)} className="bg-amber-50 p-4 rounded-2xl border border-amber-100 mb-8 w-full">
                        <Text className="text-amber-800 text-xs font-medium text-center leading-5"><Text className="font-bold">Aviso:</Text> Ajusta con responsabilidad. Los valores fuera de rango se marcarán en rojo.</Text>
                    </Animated.View>
                    {!isEditing ? (
                        <>
                            <Animated.View entering={ZoomIn.delay(300).springify()}>
                                <PremiumRing size={220} strokeWidth={14} gradientColors={GRADIENTS.blue} percentage={0.85} id="cal">
                                    <Text numberOfLines={1} adjustsFontSizeToFit className="text-6xl font-black text-zenitBlack tracking-tighter">{calculations.calories}</Text>
                                    <Text className="text-gray-400 text-sm font-bold tracking-[3px]">KCAL</Text>
                                </PremiumRing>
                            </Animated.View>
                            <Animated.View entering={FadeInDown.delay(500)} className="flex-row justify-between w-full mt-10 mb-8 px-2">
                                <MacroRingItem value={calculations.protein} label="PROT" gradientColors={GRADIENTS.orange} id="prot" />
                                <MacroRingItem value={calculations.carbs} label="CARB" gradientColors={GRADIENTS.yellow} id="carb" />
                                <MacroRingItem value={calculations.fats} label="GRASA" gradientColors={GRADIENTS.green} id="fat" />
                            </Animated.View>
                            <TouchableOpacity onPress={() => setIsEditing(true)}><Text className="text-zenitRed font-bold text-sm uppercase tracking-widest">Personalizar Valores</Text></TouchableOpacity>
                        </>
                    ) : (
                        <View className="w-full gap-y-6">
                            <EditField label={`Calorías (${LIMITS.calories.min}-${LIMITS.calories.max})`} value={editValues.calories} error={errors.calories} onChange={(v) => {setEditValues(p=>({...p, calories:v})); validate('calories',v);}} big />
                            <View className="flex-row gap-x-2 w-full px-1">
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
        </Animated.View>
    );
};

// --- NUEVO PASO 13: MAQUETADO DE SIGN UP ---
const SignUpStep = ({ onFinish }) => {
    return (
        <Animated.View entering={FadeInRight.duration(600)} className="flex-1 px-6 pt-10 bg-white justify-between pb-10">
            <View>
                <Animated.Text entering={FadeInDown.delay(100)} className="text-zenitBlack text-4xl font-black mb-2">Crea tu Cuenta</Animated.Text>
                <Animated.Text entering={FadeInDown.delay(200)} className="text-gray-500 text-lg mb-8 font-medium">Guarda tu plan personalizado para siempre.</Animated.Text>
                
                <Animated.View entering={FadeInUp.delay(300).duration(600)} className="gap-y-4">
                    <View className="flex-row items-center bg-gray-50 rounded-2xl border border-gray-100 px-4 h-16">
                        <User size={20} color="#9CA3AF" className="mr-3" />
                        <TextInput placeholder="Nombre completo" className="flex-1 text-zenitBlack text-lg font-medium" placeholderTextColor="#9CA3AF" />
                    </View>
                    <View className="flex-row items-center bg-gray-50 rounded-2xl border border-gray-100 px-4 h-16">
                        <Mail size={20} color="#9CA3AF" className="mr-3" />
                        <TextInput placeholder="Correo electrónico" keyboardType="email-address" className="flex-1 text-zenitBlack text-lg font-medium" placeholderTextColor="#9CA3AF" />
                    </View>
                    <View className="flex-row items-center bg-gray-50 rounded-2xl border border-gray-100 px-4 h-16">
                        <Lock size={20} color="#9CA3AF" className="mr-3" />
                        <TextInput placeholder="Contraseña" secureTextEntry className="flex-1 text-zenitBlack text-lg font-medium" placeholderTextColor="#9CA3AF" />
                    </View>
                </Animated.View>
            </View>

            <Animated.View entering={FadeInUp.delay(600)}>
                <Text className="text-center text-gray-400 text-xs mb-4 px-4">
                    Al registrarte, aceptas nuestros <Text className="font-bold text-gray-600">Términos</Text> y <Text className="font-bold text-gray-600">Política de Privacidad</Text>.
                </Text>
                <GradientButton text="COMENZAR VIAJE" onPress={onFinish} />
            </Animated.View>
        </Animated.View>
    );
};

// COMPONENTES AUXILIARES
const MacroRingItem = ({ value, label, gradientColors, id }) => (
    <View className="items-center">
        <PremiumRing size={85} strokeWidth={8} gradientColors={gradientColors} percentage={0.6} id={id}>
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
    const [formData, setFormData] = useState({ 
        gender: null, 
        goal: null, 
        weight: 75.0, 
        height: 175, 
        age: '', 
        bodyFat: null, // Visual (low, average...)
        preciseFat: '', // Numérico ("20")
        activityFactor: null, 
        pace: null 
    });
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
        // 1. INPUTS
        const currentWeight = parseFloat(formData.weight);
        const targetWeight = parseFloat(formData.targetWeight);
        const heightCm = parseFloat(formData.height);
        const age = parseInt(formData.age) || 25;
        const gender = formData.gender;
        const activity = formData.activityFactor || 1.2;
        const pace = formData.pace;
        const goal = formData.goal;
        
        // INPUTS DE COMPOSICIÓN (CORREGIDO PARA DECIMALES)
        const bodyType = formData.bodyFat; 
        const preciseFatPercentage = formData.preciseFat ? parseFloat(formData.preciseFat.replace(',', '.')) : null;

        let bmr;
        let leanBodyMass; // Masa magra en kg

        // ============================================================
        // RAMA 1: CÁLCULO DE PRECISIÓN MILIMÉTRICA (KATCH-MCARDLE)
        // ============================================================
        if (preciseFatPercentage !== null) {
            console.log(`Usando Katch-McArdle con ${preciseFatPercentage}% de grasa.`);
            
            // LBM = Peso Total * (1 - %Grasa)
            leanBodyMass = currentWeight * (1 - (preciseFatPercentage / 100));
            
            // Fórmula Katch-McArdle
            bmr = 370 + (21.6 * leanBodyMass);

        } 
        // ============================================================
        // RAMA 2: ESTIMACIÓN INTELIGENTE (MIFFLIN-ST JEOR + PESO AJUSTADO)
        // ============================================================
        else {
            const heightM = heightCm / 100;
            const bmi = currentWeight / (heightM * heightM);
            let metabolicWeight = currentWeight;

            // Ajuste por Obesidad
            if (bmi > 25) {
                if (bodyType === 'high_fat' || bodyType === 'average') {
                    const baseIBW = gender === 'Femenino' ? 45.5 : 50;
                    const idealBodyWeight = baseIBW + (2.3 * ((heightCm / 2.54) - 60));
                    const excessWeight = currentWeight - idealBodyWeight;
                    metabolicWeight = idealBodyWeight + (0.25 * excessWeight);
                }
            }
            
            // Mifflin-St Jeor
            if (gender === 'Femenino') {
                bmr = (10 * metabolicWeight) + (6.25 * heightCm) - (5 * age) - 161;
            } else {
                bmr = (10 * metabolicWeight) + (6.25 * heightCm) - (5 * age) + 5;
            }
        }

        // 4. TDEE
        const maintenanceCalories = bmr * activity;

        // 5. CALORÍAS FINALES (Objetivo)
        let finalCalories = 0;
        if (goal === 'Perder Grasa') {
            let deficitPercentage = 0.15; // Default: Sostenible
            if (pace === 'normal') deficitPercentage = 0.20;
            
            // LOGICA CORREGIDA: TURBO DEFICIT PARA GRASA ALTA
            // Si el usuario tiene mucha grasa (>25% real o visual), aumentamos el déficit
            const isHighFat = (preciseFatPercentage && preciseFatPercentage > 25) || (!preciseFatPercentage && (bodyType === 'high_fat' || bodyType === 'average'));
            
            if (isHighFat) {
                 if (pace === 'relaxed') deficitPercentage = 0.20; 
                 if (pace === 'normal') deficitPercentage = 0.30;  
                 if (pace === 'aggressive') deficitPercentage = 0.40; 
            } else {
                 if (pace === 'aggressive') deficitPercentage = 0.25;
            }

            finalCalories = Math.round(maintenanceCalories * (1 - deficitPercentage));
        } else if (goal === 'Ganar Músculo') {
            let surplusPercentage = pace === 'aggressive' ? 0.15 : 0.10;
            finalCalories = Math.round(maintenanceCalories * (1 + surplusPercentage));
        } else {
            finalCalories = Math.round(maintenanceCalories);
        }

        // 6. MACROS
        let proteinGrams = 0;

        // Si tenemos LBM (Masa Magra) por Katch-McArdle, calculamos proteína sobre eso
        if (leanBodyMass) {
            const multiplier = goal === 'Ganar Músculo' ? 2.4 : 2.2; 
            proteinGrams = Math.round(leanBodyMass * multiplier);
        } else {
            // Fallback a lógica de Peso Referencia anterior
            const heightM = heightCm / 100;
            const bmi = currentWeight / (heightM * heightM);
            let proteinRefWeight = currentWeight;
            if ((bodyType === 'high_fat' || preciseFatPercentage > 25) && bmi > 25) proteinRefWeight = targetWeight;
            
            let proteinMultiplier = goal === 'Ganar Músculo' ? 2.0 : 1.8;
            if (bodyType === 'muscle') proteinMultiplier += 0.4;
            proteinGrams = Math.round(proteinRefWeight * proteinMultiplier);
        }

        // Grasas
        let fatGrams = leanBodyMass ? Math.round(leanBodyMass * 1.0) : Math.round((bmr / 10) * 0.8); 
        
        // Carbos (Resto)
        const usedCals = (proteinGrams * 4) + (fatGrams * 9);
        let carbGrams = Math.round((finalCalories - usedCals) / 4);

        // Seguridad
        const minSafety = gender === 'Femenino' ? 1200 : 1500;
        if (finalCalories < minSafety && goal === 'Perder Grasa') {
            finalCalories = minSafety;
            carbGrams = Math.max(30, Math.round((finalCalories - ((proteinGrams * 4) + (fatGrams * 9))) / 4));
        }
        if (carbGrams < 30) carbGrams = 30;
        if (fatGrams < 30) fatGrams = 30;

        setResults({ 
            calories: finalCalories, 
            protein: proteinGrams, 
            carbs: carbGrams, 
            fats: fatGrams 
        });
        advanceStep();
    };

    const renderContent = () => {
        switch(step) {
            case 0: return <HeroStep onNext={advanceStep} />;
            case 1: return <GenderStep value={formData.gender} onChange={(val) => setFormData(p => ({...p, gender: val}))} />;
            case 2: return <BiometricsStep weight={formData.weight} setWeight={(val) => setFormData(prev => ({...prev, weight: val}))} height={formData.height} setHeight={(val) => setFormData(prev => ({...prev, height: val}))} />;
            
            // --- PASO 3: COMPOSICIÓN (VISUAL O NUMÉRICA) ---
            case 3: return (
                <BodyFatStep 
                    bodyType={formData.bodyFat} 
                    setBodyType={(val) => setFormData(p => ({...p, bodyFat: val, preciseFat: ''}))}
                    preciseFat={formData.preciseFat}
                    setPreciseFat={(val) => setFormData(p => ({...p, preciseFat: val, bodyFat: null}))}
                />
            );

            case 4: return <AgeStep value={formData.age} onChange={(val) => setFormData(prev => ({...prev, age: val}))} />;
            case 5: return <ActivityStep value={formData.activityFactor} onChange={(val) => setFormData(prev => ({...prev, activityFactor: val}))} />;
            case 6: return <GoalStep value={formData.goal} onChange={handleGoalSelection} />;
            case 7: return <TargetWeightStep targetWeight={formData.targetWeight} setTargetWeight={(val) => setFormData(prev => ({...prev, targetWeight: val}))} currentWeight={formData.weight} goal={formData.goal} />;
            case 8: return <PaceStep value={formData.pace} onChange={(val) => setFormData(prev => ({...prev, pace: val}))} goal={formData.goal} />;
            case 9: return <ProjectionStep currentWeight={formData.weight} targetWeight={formData.targetWeight} pace={formData.pace} goal={formData.goal} onNext={advanceStep} />;
            case 10: return <SocialProofStep onNext={advanceStep} />;
            case 11: return <ProcessingScreen onFinish={calculatePlan} pace={formData.pace} goal={formData.goal} />;
            case 12: return <FinalResultStep data={formData} calculations={results} setResults={setResults} onFinish={advanceStep} />;
            case 13: return <SignUpStep onFinish={() => navigation.replace('Home')} />; // NUEVO PASO FINAL
            default: return null;
        }
    };

    const isNextEnabled = () => {
        if (step === 1) return formData.gender !== null;
        
        // VALIDACIÓN DUAL: O eligió tarjeta visual O escribió un número válido (>3%)
        if (step === 3) return formData.bodyFat !== null || (formData.preciseFat !== '' && parseFloat(formData.preciseFat.replace(',','.')) > 3);
        
        if (step === 4) return formData.age > 10 && formData.age < 120; 
        if (step === 5) return formData.activityFactor !== null; 
        if (step === 6) return formData.goal !== null;
        if (step === 8) return formData.pace !== null;
        return [2, 7].includes(step); 
    };

    const showContinueButton = [1, 2, 3, 4, 5, 6, 7, 8].includes(step);

    return (
        <View className="flex-1 bg-white">
            <StatusBar style="dark" />
            <View style={{ flex: 1, paddingTop: STATUSBAR_HEIGHT }}>
                {step > 0 && step < 12 && (
                  <View className="px-4 py-2 flex-row items-center mb-2">
                    <TouchableOpacity onPress={goBack} className="w-10 h-10 bg-gray-50 rounded-full items-center justify-center border border-gray-100"><ChevronLeft size={24} color="#0A0A0A" /></TouchableOpacity>
                    <View className="flex-1 mx-4 h-2 bg-gray-100 rounded-full overflow-hidden"><Animated.View className="h-full rounded-full w-full bg-gray-100"><LinearGradient colors={ZENIT_GRADIENT} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={{ height: '100%', width: `${(step / 13) * 100}%` }} /></Animated.View></View>
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