import React from 'react';
import { View, Text } from 'react-native';
import Animated, { FadeIn, FadeInDown, Easing } from 'react-native-reanimated';
import { Calendar, ArrowRight } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { GradientButton } from '../../ui/GradientButton';
import { ZENIT_GRADIENT } from '../../../constants/theme';

export const ProjectionStep = ({ currentWeight, targetWeight, pace, onNext, goal }) => {
    const diff = Math.abs(currentWeight - targetWeight);
    const isLosing = goal === 'Perder Grasa';
    let weeklyRate = isLosing ? (pace === 'aggressive' ? 1.5 : pace === 'normal' ? 1.0 : 0.5) : (pace === 'aggressive' ? 0.6 : pace === 'normal' ? 0.4 : 0.2);
    const weeksNeeded = weeklyRate > 0 ? diff / weeklyRate : 0;
    const daysNeeded = Math.round(weeksNeeded * 7);
    const date = new Date(); date.setDate(date.getDate() + daysNeeded);
    const dateString = date.toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' });

    return (
        <Animated.View entering={FadeIn.duration(500)} className="flex-1 px-6 pt-10 bg-white justify-between pb-10">
            <View>
                <View className="flex-row items-center mb-4">
                    <Calendar size={24} color="#EF4444" className="mr-2" />
                    <Text className="text-zenitRed font-bold uppercase tracking-widest text-xs">DEADLINE ESTIMADO</Text>
                </View>
                <Animated.Text entering={FadeInDown.delay(100)} className="text-zenitBlack text-5xl font-black mb-2 py-1">Llegarás el</Animated.Text>
                <Animated.Text entering={FadeInDown.delay(200)} className="text-zenitRed text-4xl font-black leading-tight mb-8 uppercase">{dateString}</Animated.Text>
                <Animated.Text entering={FadeInDown.delay(300)} className="text-gray-500 text-lg font-medium leading-relaxed">
                    A este ritmo <Text className="text-zenitBlack font-bold">({weeklyRate}kg/sem)</Text>, alcanzarás tu meta de <Text className="text-zenitBlack font-bold">{targetWeight}kg</Text> en solo <Text className="text-zenitBlack font-bold">{daysNeeded} días</Text>.
                </Animated.Text>
            </View>
            
            <Animated.View entering={FadeInDown.delay(400).easing(Easing.out(Easing.cubic))} className="h-40 flex-row items-end justify-between px-2 mb-8">
                <View className="items-center">
                    <Text className="text-gray-400 font-bold mb-2 text-xs">HOY</Text>
                    <View className="w-4 h-16 bg-gray-200 rounded-full" />
                    <Text className="text-zenitBlack font-bold mt-2">{currentWeight}</Text>
                </View>
                <View className="flex-1 h-32 border-t-2 border-dashed border-gray-200 mx-4 mt-10 relative">
                    <View className="absolute -top-3 left-[40%] bg-zenitBlack px-3 py-1 rounded-full shadow-lg shadow-black/30">
                        <Text className="text-xs font-bold text-white">Zenit 🚀</Text>
                    </View>
                </View>
                <View className="items-center">
                    <Text className="text-gray-400 font-bold mb-2 text-xs">META</Text>
                    <LinearGradient colors={ZENIT_GRADIENT} start={{ x: 0, y: 0 }} end={{ x: 0, y: 1 }} className="w-4 h-32 rounded-full shadow-lg shadow-orange-500/30" />
                    <Text className="text-zenitBlack font-bold mt-2">{targetWeight}</Text>
                </View>
            </Animated.View>
            <GradientButton text="ESTADÍSTICAS" icon={ArrowRight} onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); onNext(); }} />
        </Animated.View>
    );
};