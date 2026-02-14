import React from 'react';
import { View, Text } from 'react-native';
import Animated, { FadeIn, FadeInDown, Easing } from 'react-native-reanimated';
import { Users } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { GradientButton } from '../../ui/GradientButton';
import { ZENIT_GRADIENT } from '../../../constants/theme';

export const SocialProofStep = ({ onNext }) => (
    <Animated.View entering={FadeIn.duration(500)} className="flex-1 px-6 pt-10 bg-white justify-between pb-10">
        <View>
            <Animated.View entering={FadeInDown.duration(500).easing(Easing.out(Easing.cubic))} className="w-16 h-16 bg-gray-50 rounded-2xl items-center justify-center mb-6">
                <Users size={32} color="#0A0A0A" />
            </Animated.View>
            <Animated.Text entering={FadeInDown.delay(100).duration(500)} className="text-zenitBlack text-4xl font-black mb-4 leading-tight">El Efecto Zenit.</Animated.Text>
            <Animated.Text entering={FadeInDown.delay(200).duration(500)} className="text-gray-500 text-lg font-medium leading-relaxed mb-10">
                Analizamos 10,000 casos. Las personas que siguen un plan adaptativo llegan a su meta <Text className="text-zenitBlack font-bold">3.5x veces más rápido</Text> que con dietas estáticas.
            </Animated.Text>
            
            <Animated.View entering={FadeInDown.delay(300).duration(500)} className="gap-y-6">
                <View>
                    <View className="flex-row justify-between mb-2"><Text className="font-bold text-zenitBlack">Usuario Zenit AI</Text><Text className="font-bold text-zenitRed">3 Meses</Text></View>
                    <View className="h-4 bg-gray-100 rounded-full overflow-hidden w-full"><LinearGradient colors={ZENIT_GRADIENT} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} className="h-full w-[30%] rounded-full" /></View>
                </View>
                <View>
                    <View className="flex-row justify-between mb-2"><Text className="font-bold text-gray-400">Dieta Promedio</Text><Text className="font-bold text-gray-400">9 Meses</Text></View>
                    <View className="h-4 bg-gray-50 rounded-full overflow-hidden w-full"><View className="h-full bg-gray-300 w-[80%] rounded-full" /></View>
                </View>
            </Animated.View>
        </View>
        <GradientButton text="CREAR MI PLAN" onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); onNext(); }} />
    </Animated.View>
);