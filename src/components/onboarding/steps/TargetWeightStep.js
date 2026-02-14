import React from 'react';
import { View, Text } from 'react-native';
import Animated, { FadeIn, FadeInDown, Easing } from 'react-native-reanimated';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { ZenitSlider } from '../../ui/ZenitSlider'; 

export const TargetWeightStep = ({ targetWeight, setTargetWeight, currentWeight, goal }) => {
    let minLimit, maxLimit;
    const SAFETY_MARGIN = 0.3; 
    if (goal === 'Perder Grasa') { maxLimit = currentWeight; minLimit = Math.round(currentWeight * (1 - SAFETY_MARGIN)); }
    else if (goal === 'Ganar Músculo') { minLimit = currentWeight; maxLimit = Math.round(currentWeight * (1 + SAFETY_MARGIN)); }
    else { minLimit = Math.round(currentWeight - 3); maxLimit = Math.round(currentWeight + 3); }

    return (
        <GestureHandlerRootView style={{ flex: 1 }}>
            {/* FIX: Agregamos 'bg-white' */}
            <Animated.View entering={FadeIn.duration(500)} className="flex-1 pt-4 px-6 justify-between pb-10 bg-white">
                <View>
                    <Animated.Text 
                        entering={FadeInDown.duration(500).easing(Easing.out(Easing.cubic))} 
                        className="text-zenitBlack text-4xl font-black tracking-tight mb-2">
                        Tu Meta
                    </Animated.Text>
                    <Animated.Text 
                        entering={FadeInDown.delay(100).duration(500).easing(Easing.out(Easing.cubic))} 
                        className="text-gray-500 text-lg font-medium">
                        {goal === 'Perder Grasa' ? '¿Hasta dónde quieres bajar?' : goal === 'Ganar Músculo' ? '¿Hasta dónde quieres subir?' : 'Ajuste fino de mantenimiento.'}
                    </Animated.Text>
                </View>
                
                <Animated.View entering={FadeInDown.delay(200).duration(500).easing(Easing.out(Easing.cubic))} className="items-center justify-center flex-1">
                    <View className="items-center mb-12">
                        <Text className="text-gray-400 font-bold uppercase tracking-widest text-xs mb-2">DIFERENCIA</Text>
                        <Text className={`text-5xl font-black ${Math.abs(targetWeight - currentWeight) < 0.1 ? 'text-gray-300' : 'text-zenitRed'}`}>
                            {targetWeight > currentWeight ? '+' : ''}{(targetWeight - currentWeight).toFixed(1)} <Text className="text-2xl text-zenitBlack">kg</Text>
                        </Text>
                        <Text className="text-zenitBlack font-bold text-xl mt-2">Meta: {targetWeight.toFixed(1)} kg</Text>
                    </View>
                    <ZenitSlider value={targetWeight} onChange={setTargetWeight} min={minLimit} max={maxLimit} step={0.1} />
                    <View className="flex-row justify-between w-full px-2 mt-4">
                        <Text className="text-gray-400 font-bold text-xs">{minLimit}kg</Text>
                        <Text className="text-gray-400 font-bold text-xs">{maxLimit}kg</Text>
                    </View>
                </Animated.View>

                <View className="bg-gray-50 p-4 rounded-2xl border border-gray-100">
                    <Text className="text-gray-500 text-xs font-medium text-center leading-5">
                        <Text className="text-zenitBlack font-bold">Nota:</Text> Limitamos el rango por seguridad.
                    </Text>
                </View>
            </Animated.View>
        </GestureHandlerRootView>
    );
};