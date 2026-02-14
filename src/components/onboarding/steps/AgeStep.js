import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import Animated, { FadeIn, FadeInDown, FadeInUp, Easing } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { Delete } from 'lucide-react-native';

const AnimatedTouchableOpacity = Animated.createAnimatedComponent(TouchableOpacity);

export const AgeStep = ({ value, onChange }) => {
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
        // FIX: Agregamos 'bg-white' aquí para tapar el fondo gris/naranja del sistema
        <Animated.View entering={FadeIn.duration(500)} className="flex-1 px-6 pt-4 bg-white">
            <View className="mb-4">
                <Animated.Text 
                    entering={FadeInDown.duration(500).easing(Easing.out(Easing.cubic))} 
                    className="text-zenitBlack text-4xl font-black tracking-tight mb-2">
                    Tu Edad
                </Animated.Text>
                <Animated.Text 
                    entering={FadeInDown.delay(100).duration(500).easing(Easing.out(Easing.cubic))} 
                    className="text-gray-500 text-lg font-medium">
                    Define tu etapa vital.
                </Animated.Text>
            </View>
            <View className="items-center justify-center flex-1 max-h-32 mb-8">
                <Text className={`text-7xl font-bold tracking-tight ${!value ? 'text-gray-300' : 'text-zenitBlack'}`}>{value || '0'}</Text>
                <Text className="text-zenitRed text-sm font-bold tracking-widest uppercase mt-2">AÑOS</Text>
            </View>
            <View className="flex-row flex-wrap justify-center gap-x-6 gap-y-4 px-2">
                {keys.map((k, i) => (k === '.' ? <View key={i} className="w-[80px] h-[80px]" /> : 
                    <AnimatedTouchableOpacity 
                        key={i} 
                        entering={FadeInUp.delay(200 + i * 30).duration(400).easing(Easing.out(Easing.cubic))}
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