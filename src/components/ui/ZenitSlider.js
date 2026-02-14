import React, { useEffect, useRef } from 'react';
import { View, Dimensions } from 'react-native';
import { GestureDetector, Gesture } from 'react-native-gesture-handler';
import Animated, { 
    useSharedValue, 
    useAnimatedStyle, 
    withSpring, 
    withTiming, // Importamos esto para animaciones lineales
    runOnJS, 
    Easing      // Importamos esto para suavizar la frenada
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { ZENIT_GRADIENT } from '../../constants/theme';

const { width } = Dimensions.get('window');

export const ZenitSlider = ({ value, onChange, min, max, step = 0.1 }) => {
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
            
            // CAMBIO CLAVE: Usamos withTiming en lugar de withSpring
            // Esto elimina el rebote. La bolita viaja al punto exacto y frena en seco.
            translateX.value = withTiming(percentage * MAX_X, { 
                duration: 200, // 0.2 segundos (rápido y firme)
                easing: Easing.out(Easing.quad) // Frena suavemente al final
            });
        }
    }, [value, min, max]);

    const startDragging = () => { isDragging.current = true; };
    const stopDragging = () => { isDragging.current = false; };

    const pan = Gesture.Pan()
        .onBegin(() => {
            runOnJS(startDragging)(); 
            context.value = translateX.value;
            // Efecto visual sutil al tocar (agranda un poquito la bolita)
            scale.value = withSpring(1.15, { damping: 20 });
        })
        .onUpdate((e) => {
            let newX = context.value + e.translationX;
            newX = Math.max(0, Math.min(MAX_X, newX));
            
            // Actualización directa (sin animación) mientras arrastras para respuesta instantánea
            translateX.value = newX;
            
            const percentage = newX / MAX_X;
            const rawValue = min + (percentage * (max - min));
            const rounded = Math.round(rawValue / step) * step;
            
            runOnJS(onChange)(Number(rounded.toFixed(1)));
        })
        .onFinalize(() => {
            // Al soltar, vuelve al tamaño normal suavemente
            scale.value = withSpring(1);
            runOnJS(stopDragging)(); 
        });

    const knobStyle = useAnimatedStyle(() => ({ 
        transform: [
            { translateX: translateX.value }, 
            { scale: scale.value }
        ] 
    }));
    
    const progressStyle = useAnimatedStyle(() => ({ 
        width: translateX.value + KNOB_SIZE / 2 
    }));

    return (
        <View style={{ width: SLIDER_WIDTH }} className="h-12 justify-center">
            {/* Fondo gris (Barra inactiva) */}
            <View className="absolute left-0 right-0 h-2 bg-gray-100 rounded-full" />
            
            {/* Relleno gradiente (Barra activa) */}
            <Animated.View className="absolute left-0 h-2 rounded-full overflow-hidden" style={progressStyle}>
                <LinearGradient 
                    colors={ZENIT_GRADIENT} 
                    start={{ x: 0, y: 0 }} 
                    end={{ x: 1, y: 0 }} 
                    style={{ flex: 1 }} 
                />
            </Animated.View>
            
            {/* Knob (Bolita) */}
            <GestureDetector gesture={pan}>
                <Animated.View 
                    style={knobStyle} 
                    className="absolute bg-white w-8 h-8 rounded-full shadow-sm shadow-black/20 border border-gray-200 items-center justify-center elevation-4"
                >
                    {/* Puntito gris adentro para detalle estético */}
                    <View className="w-2 h-2 bg-gray-300 rounded-full" />
                </Animated.View>
            </GestureDetector>
        </View>
    );
};