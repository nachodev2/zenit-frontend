import React from 'react';
import { View, Text, TextInput } from 'react-native';
import Animated, { FadeIn, FadeInDown, FadeInUp, Easing } from 'react-native-reanimated';
import { User, Mail, Lock } from 'lucide-react-native';
import { GradientButton } from '../../ui/GradientButton';

export const SignUpStep = ({ onFinish }) => {
    return (
        <Animated.View entering={FadeIn.duration(500)} className="flex-1 px-6 pt-10 bg-white justify-between pb-10">
            <View>
                <Animated.Text entering={FadeInDown.duration(500).easing(Easing.out(Easing.cubic))} className="text-zenitBlack text-4xl font-black mb-2">Crea tu Cuenta</Animated.Text>
                <Animated.Text entering={FadeInDown.delay(100).duration(500)} className="text-gray-500 text-lg mb-8 font-medium">Guarda tu plan personalizado para siempre.</Animated.Text>
                
                <Animated.View entering={FadeInUp.delay(200).duration(500).easing(Easing.out(Easing.cubic))} className="gap-y-4">
                    <View className="flex-row items-center bg-gray-50 rounded-2xl border border-gray-100 px-4 h-16">
                        <User size={20} color="#9CA3AF" className="mr-3" />
                        <TextInput placeholder="Nombre completo" className="flex-1 text-zenitBlack text-lg font-medium" placeholderTextColor="#9CA3AF" />
                    </View>
                    <View className="flex-row items-center bg-gray-50 rounded-2xl border border-gray-100 px-4 h-16">
                        <Mail size={20} color="#9CA3AF" className="mr-3" />
                        <TextInput placeholder="Correo electrónico" keyboardType="email-address" className="flex-1 text-zenitBlack text-lg font-medium" placeholderTextColor="#9CA3AF" />
                    </View>
                    <View className="flex-row items-center bg-gray-50 rounded-2xl border border-gray-100 px-4 h-16">
                        <Lock size={20} color="#9CA3AF" className="mr-3" />
                        <TextInput placeholder="Contraseña" secureTextEntry className="flex-1 text-zenitBlack text-lg font-medium" placeholderTextColor="#9CA3AF" />
                    </View>
                </Animated.View>
            </View>

            <Animated.View entering={FadeInUp.delay(300)}>
                <Text className="text-center text-gray-400 text-xs mb-4 px-4">
                    Al registrarte, aceptas nuestros <Text className="font-bold text-gray-600">Términos</Text> y <Text className="font-bold text-gray-600">Política de Privacidad</Text>.
                </Text>
                <GradientButton text="COMENZAR VIAJE" onPress={onFinish} />
            </Animated.View>
        </Animated.View>
    );
};