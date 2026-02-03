import React, { useRef } from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { GestureDetector, Gesture } from 'react-native-gesture-handler';
import Animated, { useSharedValue, useAnimatedStyle, withSpring, runOnJS } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { MoveVertical, MoveHorizontal } from 'lucide-react-native';

const GesturePicker = ({ 
    value, 
    onChange, 
    min, 
    max, 
    step = 1, 
    unit, 
    label,
    orientation = 'horizontal' // 'horizontal' | 'vertical'
}) => {
    // Valores de animación
    const offset = useSharedValue(0);
    const scale = useSharedValue(1);
    
    // Referencias para lógica
    const startValue = useRef(value);
    const lastHapticValue = useRef(value);

    // --- SENSIBILIDAD TURBO ---
    // Horizontal (Peso): Al ser step 0.1, necesitamos un divisor MUY bajo (2) 
    // para que el swipe rinda. 2px = 0.1kg -> 20px = 1kg.
    // Vertical (Altura): Step 1. Divisor 10 está bien. 10px = 1cm.
    const SENSITIVITY = orientation === 'horizontal' ? 2 : 10; 

    // CONFIGURACIÓN VISUAL (CLAMP)
    const MAX_VISUAL_OFFSET = 10; 
    const VISUAL_RESISTANCE = 0.1;

    // --- LÓGICA DEL GESTO ---
    const pan = Gesture.Pan()
        .onBegin(() => {
            scale.value = withSpring(1.05); 
            startValue.current = value;
        })
        .onUpdate((e) => {
            // --- DIRECCIÓN NATURAL ---
            // Horizontal: Derecha (+X) -> Sube. Izquierda (-X) -> Baja.
            // Vertical: Arriba (-Y) -> Sube. Abajo (+Y) -> Baja.
            
            let translation;
            if (orientation === 'horizontal') {
                translation = e.translationX; 
            } else {
                translation = -e.translationY; // Invertimos Y (Arriba es negativo en pantalla)
            }

            // Offset visual (siempre sigue al dedo para feedback instantáneo)
            offset.value = orientation === 'horizontal' ? e.translationX : e.translationY;

            // Matemática del cambio
            const rawChange = translation / SENSITIVITY;
            let newValue = startValue.current + (rawChange * step);
            
            // Límites (Min/Max)
            newValue = Math.max(min, Math.min(max, newValue));

            // Redondeo
            const rounded = step < 1 
                ? Math.round(newValue * 10) / 10 
                : Math.round(newValue);

            // Feedback Háptico y Cambio
            if (rounded !== lastHapticValue.current) {
                runOnJS(Haptics.impactAsync)(Haptics.ImpactFeedbackStyle.Light);
                runOnJS(onChange)(rounded);
                lastHapticValue.current = rounded;
            }
        })
        .onFinalize(() => {
            scale.value = withSpring(1);
            offset.value = withSpring(0); // Rebote al centro
        });

    // --- ANIMACIÓN VISUAL ---
    const animatedStyle = useAnimatedStyle(() => {
        let move = offset.value * VISUAL_RESISTANCE;
        // "Jaula" visual
        move = Math.max(-MAX_VISUAL_OFFSET, Math.min(MAX_VISUAL_OFFSET, move));

        return {
            transform: [
                { scale: scale.value },
                { translateX: orientation === 'horizontal' ? move : 0 },
                { translateY: orientation === 'vertical' ? move : 0 }
            ]
        };
    });

    return (
        <GestureDetector gesture={pan}>
            <View style={[styles.container, orientation === 'vertical' ? styles.verticalContainer : null]}>
                {/* Etiqueta */}
                <View style={styles.labelContainer}>
                    <Text style={styles.label}>{label}</Text>
                    {orientation === 'horizontal' ? (
                        <MoveHorizontal size={16} color="#A1A1AA" style={{ marginLeft: 6 }} />
                    ) : (
                        <MoveVertical size={16} color="#A1A1AA" style={{ marginLeft: 6 }} />
                    )}
                </View>

                {/* Valor Gigante */}
                <Animated.View style={[styles.valueContainer, animatedStyle]}>
                    <Text style={styles.valueText}>
                        {step < 1 ? value.toFixed(1) : value}
                    </Text>
                    <Text style={styles.unitText}>{unit}</Text>
                </Animated.View>

                {/* Guía Visual */}
                <Text style={styles.hintText}>
                    {orientation === 'horizontal' ? '< Desliza >' : '↕ Desliza'}
                </Text>
            </View>
        </GestureDetector>
    );
};

const styles = StyleSheet.create({
    container: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 20,
        backgroundColor: '#FAFAFA', 
        borderRadius: 30,
        width: '100%',
        marginBottom: 16,
        borderWidth: 1,
        borderColor: '#F4F4F5',
        overflow: 'hidden', 
    },
    verticalContainer: {
        paddingVertical: 40, 
    },
    labelContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 10,
    },
    label: {
        fontSize: 16,
        fontWeight: '600',
        color: '#A1A1AA',
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    valueContainer: {
        flexDirection: 'row',
        alignItems: 'baseline',
    },
    valueText: {
        fontSize: 72,
        fontWeight: '900',
        color: '#0A0A0A',
        fontVariant: ['tabular-nums'], 
        includeFontPadding: false,
    },
    unitText: {
        fontSize: 24,
        fontWeight: '600',
        color: '#A1A1AA',
        marginLeft: 8,
    },
    hintText: {
        marginTop: 12,
        fontSize: 12,
        color: '#D4D4D8',
        fontWeight: '600',
    }
});

export default GesturePicker;