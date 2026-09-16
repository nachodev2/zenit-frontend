import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Camera, Flame } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { ZENIT_GRADIENT } from '../../constants/theme';

export const GeminiCard = ({ onPress }) => {
    return (
        <Animated.View entering={FadeInDown.delay(200).duration(500)} className="mt-6">
            <TouchableOpacity 
                activeOpacity={0.9}
                onPress={onPress}
                className="bg-white rounded-[32px] p-1 border border-gray-100 shadow-xl shadow-gray-200/40"
            >
                <View className="rounded-[28px] p-6 flex-row justify-between items-center">
                    <View className="flex-1 pr-4">
                        <View className="flex-row items-center mb-2">
                            <Flame size={16} color="#F97316" fill="#F97316" />
                            <Text className="text-orange-500 font-bold ml-2 text-[10px] uppercase tracking-wider">
                                Powered by Gemini
                            </Text>
                        </View>
                        <Text className="text-xl font-black text-zenitBlack leading-6 mb-1">
                            Foto-Registro
                        </Text>
                        <Text className="text-gray-400 font-medium text-xs leading-4">
                            Saca una foto y deja que Zenit analice tus macros.
                        </Text>
                    </View>

                    <LinearGradient colors={ZENIT_GRADIENT} className="w-14 h-14 rounded-full items-center justify-center shadow-lg shadow-orange-200">
                        <Camera size={24} color="white" />
                    </LinearGradient>
                </View>
            </TouchableOpacity>
        </Animated.View>
    );
};