import React, { useEffect, useState } from 'react';
import { View, Text, Dimensions } from 'react-native';
import Animated, { 
    useSharedValue, 
    useAnimatedStyle, 
    withSpring, 
    withTiming, 
    withRepeat, 
    Sequence,
    FadeIn,
    ZoomIn
} from 'react-native-reanimated';
import { Drumstick, Dumbbell, Zap } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';

const { width } = Dimensions.get('window');
const ZENIT_GRADIENT = ['#DC2626', '#F97316'];

const ProcessingScreen = ({ onFinish, pace, goal }) => {
    const [stepIndex, setStepIndex] = useState(0);
    const [iconIndex, setIconIndex] = useState(0);
    
    // Valores de animación
    const progress = useSharedValue(0);
    
    // Lógica de textos dinámica
    const getStrategyText = () => {
        if (pace === 'aggressive') return 'MODO ZENIT 🔥';
        if (pace === 'normal') return 'Exigente ⚡';
        return 'Sostenible 🌱';
    };

    const actionType = goal === 'Perder Grasa' ? 'Déficit' 
                    : goal === 'Ganar Músculo' ? 'Superávit' 
                    : 'Ajuste';

    const steps = [
        "Analizando tu biometría...",
        "Calculando TDEE & Metabolismo...",
        `Ajustando ${actionType} ${getStrategyText()}...`,
        "Optimizando macros...",
        "Finalizando Plan Zenit v1.0"
    ];

    // Iconos para el ciclo
    const icons = [
        { component: Drumstick, color: '#F97316' }, // Naranja
        { component: Dumbbell, color: '#DC2626' },  // Rojo
        { component: Zap, color: '#F59E0B' }        // Amarillo/Rayo
    ];

    const CurrentIcon = icons[iconIndex].component;
    const currentColor = icons[iconIndex].color;

    useEffect(() => {
        // 1. Animación de Barra de Progreso (3.5 segundos total)
        progress.value = withTiming(100, { duration: 3500 });

        // 2. Ciclo de Textos
        const textInterval = setInterval(() => {
            setStepIndex(prev => (prev < steps.length - 1 ? prev + 1 : prev));
        }, 700); // Cambia texto cada 700ms

        // 3. Ciclo de Iconos
        const iconInterval = setInterval(() => {
            setIconIndex(prev => (prev + 1) % icons.length);
        }, 800); // Cambia icono cada 800ms

        // 4. Finalizar
        const finishTimeout = setTimeout(() => {
            onFinish();
        }, 3600);

        return () => {
            clearInterval(textInterval);
            clearInterval(iconInterval);
            clearTimeout(finishTimeout);
        };
    }, []);

    // Estilo animado de la barra
    const progressStyle = useAnimatedStyle(() => ({
        width: `${progress.value}%`
    }));

    return (
        <View className="flex-1 bg-white items-center justify-center px-8">
            {/* CÍRCULO DE ICONOS ANIMADOS */}
            <View className="mb-12 relative items-center justify-center">
                {/* Anillos decorativos de fondo */}
                <View className="absolute w-40 h-40 rounded-full border border-gray-100" />
                <View className="absolute w-32 h-32 rounded-full border border-gray-50" />
                
                {/* Contenedor del Icono */}
                <Animated.View 
                    key={iconIndex} // Clave para reiniciar animación al cambiar
                    entering={ZoomIn.springify().damping(12)}
                    className="w-24 h-24 bg-gray-50 rounded-full items-center justify-center shadow-lg shadow-gray-200/50"
                >
                    <CurrentIcon size={40} color={currentColor} strokeWidth={2.5} />
                </Animated.View>
            </View>

            {/* TEXTOS DE ESTADO */}
            <View className="h-20 items-center justify-center mb-8 w-full">
                <Animated.Text 
                    key={stepIndex} // Clave para animar el cambio de texto
                    entering={FadeIn.duration(300)}
                    className="text-2xl font-black text-zenitBlack text-center leading-8"
                >
                    {steps[stepIndex]}
                </Animated.Text>
            </View>

            {/* BARRA DE CARGA REESTRUCTURADA */}
            <View className="w-full">
                <View className="h-3 bg-gray-100 rounded-full overflow-hidden w-full relative">
                    <Animated.View className="h-full absolute left-0 top-0 bottom-0" style={progressStyle}>
                        <LinearGradient
                            colors={ZENIT_GRADIENT}
                            start={{ x: 0, y: 0 }} 
                            end={{ x: 1, y: 0 }}
                            style={{ flex: 1, borderRadius: 999 }}
                        />
                    </Animated.View>
                </View>
                
                {/* Porcentaje numérico (Opcional, estilo hacker) */}
                <View className="flex-row justify-between mt-2">
                    <Text className="text-xs font-bold text-gray-300 tracking-widest">AI PROCESSING</Text>
                    {/* Hack sucio para leer el valor compartido en texto plano si se quisiera, 
                        pero por simplicidad visual lo dejaremos limpio o estático */}
                </View>
            </View>
        </View>
    );
};

export default ProcessingScreen;