import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Camera, Plus } from 'lucide-react-native';

export const VisualGallery = () => {
    return (
        <Animated.View entering={FadeInDown.delay(300).duration(500)} className="mt-8">
            <Text className="text-lg font-black text-zenitBlack mb-4 ml-2">Tu Progreso Visual</Text>
            <View className="flex-row flex-wrap justify-between">
                <View className="w-[48%] h-64 bg-gray-50 rounded-[28px] mb-4 border border-gray-100 items-center justify-center overflow-hidden relative shadow-sm">
                    <Camera color="#E5E7EB" size={32} />
                    <Text className="text-gray-300 font-bold text-xs mt-2">ALMUERZO</Text>
                </View>
                <View className="w-[48%] justify-between h-64 mb-4">
                    <View className="w-full h-[48%] bg-gray-50 rounded-[28px] border border-gray-100 items-center justify-center shadow-sm">
                        <Text className="text-gray-300 font-bold text-xs">DESAYUNO</Text>
                    </View>
                    <TouchableOpacity className="w-full h-[48%] bg-white border-2 border-dashed border-gray-200 rounded-[28px] items-center justify-center active:bg-gray-50">
                        <View className="w-8 h-8 bg-gray-50 rounded-full items-center justify-center shadow-sm mb-2 border border-gray-100">
                            <Plus size={16} color="#D4D4D8" />
                        </View>
                        <Text className="text-gray-400 font-bold text-[10px] uppercase">Cena</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </Animated.View>
    );
};