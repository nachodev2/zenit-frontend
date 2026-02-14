import React, { useRef } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { GestureDetector, Gesture } from 'react-native-gesture-handler';
import Animated, { useSharedValue, useAnimatedStyle, withSpring, runOnJS } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { MoveVertical, MoveHorizontal } from 'lucide-react-native';

export default function GesturePicker({ 
    value, 
    onChange, 
    min, 
    max, 
    step = 1, 
    unit, 
    label,
    orientation = 'horizontal' // 'horizontal' | 'vertical'
}) {
    const offset = useSharedValue(0);
    const scale = useSharedValue(1);
    
    const startValue = useRef(value);
    const lastHapticValue = useRef(value);

    // Sensibilidad del gesto
    const SENSITIVITY = orientation === 'horizontal' ? 2 : 10; 

    const pan = Gesture.Pan()
        .onBegin(() => {
            scale.value = withSpring(1.05); 
            startValue.current = value;
        })
        .onUpdate((e) => {
            let translation = orientation === 'horizontal' ? e.translationX : -e.translationY;
            offset.value = orientation === 'horizontal' ? e.translationX : e.translationY;

            const rawChange = translation / SENSITIVITY;
            let newValue = startValue.current + (rawChange * step);
            newValue = Math.max(min, Math.min(max, newValue));

            const rounded = step < 1 
                ? Math.round(newValue * 10) / 10 
                : Math.round(newValue);

            if (rounded !== lastHapticValue.current) {
                runOnJS(Haptics.impactAsync)(Haptics.ImpactFeedbackStyle.Light);
                runOnJS(onChange)(rounded);
                lastHapticValue.current = rounded;
            }
        })
        .onFinalize(() => {
            scale.value = withSpring(1);
            offset.value = withSpring(0);
        });

    const animatedStyle = useAnimatedStyle(() => {
        const MAX_VISUAL_OFFSET = 10;
        let move = Math.max(-MAX_VISUAL_OFFSET, Math.min(MAX_VISUAL_OFFSET, offset.value * 0.1));
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
            <View className={`items-center justify-center py-6 bg-gray-50 rounded-[32px] w-full mb-4 border border-gray-100 overflow-hidden ${orientation === 'vertical' ? 'py-12' : ''}`}>
                
                {/* --- FIX DEL TÍTULO --- */}
                <View className="flex-row items-center justify-center mb-3 px-4">
                    <Text 
                        className="text-sm font-bold text-gray-400 uppercase tracking-wider text-center"
                        numberOfLines={1} 
                        adjustsFontSizeToFit
                    >
                        {label}
                    </Text>
                    {orientation === 'horizontal' ? (
                        <MoveHorizontal size={14} color="#A1A1AA" style={{ marginLeft: 6 }} />
                    ) : (
                        <MoveVertical size={14} color="#A1A1AA" style={{ marginLeft: 6 }} />
                    )}
                </View>
                {/* ---------------------- */}

                <Animated.View style={[styles.valueContainer, animatedStyle]}>
                    <Text className="text-7xl font-black text-zenitBlack font-[tabular-nums] tracking-tighter">
                        {step < 1 ? value.toFixed(1) : value}
                    </Text>
                    <Text className="text-2xl font-semibold text-gray-400 ml-2 mb-2">{unit}</Text>
                </Animated.View>

                <Text className="mt-4 text-[10px] text-gray-300 font-bold uppercase tracking-widest">
                    {orientation === 'horizontal' ? 'DESLIZA >' : '↕ DESLIZA'}
                </Text>
            </View>
        </GestureDetector>
    );
};

const styles = StyleSheet.create({
    valueContainer: {
        flexDirection: 'row',
        alignItems: 'baseline',
    },
});