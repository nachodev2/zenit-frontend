import React from 'react';
import { View } from 'react-native';
import Animated, { FadeIn, FadeInDown, Easing } from 'react-native-reanimated';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import GesturePicker from '../../ui/GesturePicker';

export const BiometricsStep = ({ weight, setWeight, height, setHeight }) => (
    <GestureHandlerRootView style={{ flex: 1 }}>
        {/* FIX: Agregamos 'bg-white' */}
        <Animated.View entering={FadeIn.duration(500)} className="flex-1 pt-4 px-6 bg-white">
            <View className="mb-6">
                 <Animated.Text 
                    entering={FadeInDown.duration(500).easing(Easing.out(Easing.cubic))} 
                    className="text-zenitBlack text-4xl font-black tracking-tight mb-2">
                    Tus Medidas
                 </Animated.Text>
                 <Animated.Text 
                    entering={FadeInDown.delay(100).duration(500).easing(Easing.out(Easing.cubic))} 
                    className="text-gray-500 text-lg font-medium">
                    Toca el número y desliza para ajustar.
                 </Animated.Text>
            </View>
            <View className="flex-1 justify-center gap-y-6">
                <Animated.View entering={FadeInDown.delay(200).duration(500).easing(Easing.out(Easing.cubic))}>
                    <GesturePicker label="Altura" value={height} onChange={setHeight} min={100} max={250} step={1} unit="cm" orientation="vertical" />
                </Animated.View>
                <Animated.View entering={FadeInDown.delay(300).duration(500).easing(Easing.out(Easing.cubic))}>
                    <GesturePicker label="Peso" value={weight} onChange={setWeight} min={30} max={300} step={0.1} unit="kg" orientation="horizontal" />
                </Animated.View>
            </View>
        </Animated.View>
    </GestureHandlerRootView>
);