import React, { useEffect, useState } from 'react';
import { View, Text } from 'react-native';
import Animated, { 
    useSharedValue, 
    useAnimatedStyle, 
    withTiming, 
    withRepeat, 
    Easing,
    FadeInDown,
} from 'react-native-reanimated';
import { Zap } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { ZENIT_GRADIENT } from '../../constants/theme'; // Importamos el tema global

const ProcessingScreen = ({ onFinish, pace, goal }) => {
    // CONFIGURACIÓN DE TIEMPO
    const STEP_DURATION = 1500; // 1.5 segundos por paso
    
    // Texto dinámico corto
    const getStrategyText = () => {
        if (pace === 'aggressive') return 'MODO ZENIT';
        if (pace === 'normal') return 'Estrategia Exigente';
        return 'Estrategia Sostenible';
    };

    const actionType = goal === 'Perder Grasa' ? 'Déficit' 
                    : goal === 'Ganar Músculo' ? 'Superávit' 
                    : 'Recomp.';

    // LISTA DE PASOS
    const steps = [
        "Analizando biometría...",
        "Calculando TDEE...",
        `Ajustando ${actionType} ${getStrategyText()}...`,
        "Creando Plan Zenit v1.0..."
    ];

    const TOTAL_DURATION = steps.length * STEP_DURATION;

    const [visibleSteps, setVisibleSteps] = useState(0);
    
    // Valores de animación
    const progress = useSharedValue(0);
    const spin = useSharedValue(0);

    useEffect(() => {
        // 1. Barra de Progreso
        progress.value = withTiming(100, { 
            duration: TOTAL_DURATION, 
            easing: Easing.linear 
        });

        // 2. Icono Superior (Giro)
        spin.value = withRepeat(
            withTiming(360, { duration: 2000, easing: Easing.linear }),
            -1
        );

        // 3. Aparición de Pasos
        const interval = setInterval(() => {
            setVisibleSteps(prev => {
                if (prev < steps.length) return prev + 1;
                return prev;
            });
        }, STEP_DURATION);

        // 4. Finalizar
        const finishTimeout = setTimeout(() => {
            onFinish();
        }, TOTAL_DURATION + 500);

        // Iniciar el primer paso
        setVisibleSteps(1);

        return () => {
            clearInterval(interval);
            clearTimeout(finishTimeout);
        };
    }, []);

    // Estilos animados
    const progressStyle = useAnimatedStyle(() => ({
        width: `${progress.value}%`
    }));

    const spinStyle = useAnimatedStyle(() => ({
        transform: [{ rotate: `${spin.value}deg` }]
    }));

    return (
        <View className="flex-1 bg-white px-8 justify-between py-24">
            
            {/* HEADER SUPERIOR */}
            <View className="items-center mt-8">
                <Animated.View style={[spinStyle]} className="mb-6 p-4 bg-gray-50 rounded-full">
                     <Zap size={32} color="#DC2626" fill="#DC2626" />
                </Animated.View>
                <Text className="text-zenitBlack text-3xl font-black text-center mb-1">
                    Diseñando Plan
                </Text>
                <Text className="text-gray-400 font-medium text-sm text-center tracking-wide">
                    PERSONALIZANDO IA...
                </Text>
            </View>

            {/* LISTA DE PASOS */}
            <View className="flex-1 justify-center gap-y-5 pl-4">
                {steps.map((label, index) => {
                    if (index >= visibleSteps) return null;
                    const isCurrent = index === visibleSteps - 1;

                    return (
                        <Animated.View 
                            key={index} 
                            entering={FadeInDown.duration(500).springify()}
                            className="flex-row items-center"
                        >
                            {/* Indicador */}
                            <View className="w-6 items-center justify-center mr-4">
                                {isCurrent ? (
                                    <View className="w-2.5 h-2.5 bg-zenitRed rounded-full shadow-sm shadow-red-500" />
                                ) : (
                                    <View className="w-2 h-2 bg-gray-800 rounded-full opacity-20" />
                                )}
                            </View>

                            {/* Texto */}
                            <Text className={`text-lg font-bold tracking-tight ${
                                isCurrent ? 'text-zenitBlack' : 'text-gray-300'
                            }`}>
                                {label}
                            </Text>
                        </Animated.View>
                    );
                })}
            </View>

            {/* BARRA DE CARGA */}
            <View className="w-full mb-4">
                <View className="flex-row justify-between mb-3">
                    <Text className="text-[10px] font-bold text-gray-400 tracking-[2px]">PROCESANDO</Text>
                    <Text className="text-[10px] font-bold text-zenitRed tracking-[2px]">V 1.0</Text>
                </View>
                
                <View className="h-1.5 bg-gray-100 rounded-full overflow-hidden w-full">
                    <Animated.View className="h-full rounded-full" style={progressStyle}>
                        <LinearGradient
                            colors={ZENIT_GRADIENT}
                            start={{ x: 0, y: 0 }} 
                            end={{ x: 1, y: 0 }}
                            style={{ flex: 1 }}
                        />
                    </Animated.View>
                </View>
            </View>
        </View>
    );
};

export default ProcessingScreen;