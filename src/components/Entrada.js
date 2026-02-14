import React from 'react';
import { View, Text, TouchableOpacity, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MotiView } from 'moti';
import { StatusBar } from 'expo-status-bar';
import { Sparkles, Scan, ChevronRight, Utensils } from 'lucide-react-native';

const { width } = Dimensions.get('window');

export default function Entrada({ onFinish }) {
  return (
    <View className="flex-1 bg-black">
      <StatusBar style="light" />
      {/* Fondo con gradiente simulado */}
      <View className="absolute inset-0">
        <View className="absolute top-0 left-0 w-96 h-96 bg-blue-600/20 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2" />
        <View className="absolute bottom-0 right-0 w-80 h-80 bg-purple-600/20 rounded-full blur-3xl translate-x-1/2 translate-y-1/2" />
      </View>

      <SafeAreaView className="flex-1">
        {/* Header con logo */}
        <MotiView 
          from={{ opacity: 0, translateY: -20 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: 'timing', duration: 800 }}
          className="items-center pt-16"
        >
          <View className="w-20 h-20 bg-blue-600 rounded-3xl items-center justify-center mb-4 shadow-lg shadow-blue-500/50">
            <Scan size={40} color="white" />
          </View>
          <Text className="text-white text-4xl font-bold tracking-tight">Zenit</Text>
          <Text className="text-gray-400 text-base mt-1">Nutrición inteligente</Text>
        </MotiView>

        {/* Features cards */}
        <MotiView 
          from={{ opacity: 0, translateY: 30 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: 'timing', duration: 800, delay: 300 }}
          className="flex-1 justify-center px-6"
        >
          {/* Card 1 */}
          <View className="bg-white/5 border border-white/10 rounded-2xl p-4 mb-3 flex-row items-center">
            <View className="w-12 h-12 bg-blue-500/20 rounded-xl items-center justify-center">
              <Scan size={24} color="#3b82f6" />
            </View>
            <View className="ml-4 flex-1">
              <Text className="text-white font-semibold text-base">Escanea tu comida</Text>
              <Text className="text-gray-400 text-sm">IA que detecta calorías al instante</Text>
            </View>
          </View>

          {/* Card 2 */}
          <View className="bg-white/5 border border-white/10 rounded-2xl p-4 mb-3 flex-row items-center">
            <View className="w-12 h-12 bg-purple-500/20 rounded-xl items-center justify-center">
              <Utensils size={24} color="#a855f7" />
            </View>
            <View className="ml-4 flex-1">
              <Text className="text-white font-semibold text-base">Recetas personalizadas</Text>
              <Text className="text-gray-400 text-sm">Adaptadas a tus objetivos</Text>
            </View>
          </View>

          {/* Card 3 */}
          <View className="bg-white/5 border border-white/10 rounded-2xl p-4 flex-row items-center">
            <View className="w-12 h-12 bg-green-500/20 rounded-xl items-center justify-center">
              <Sparkles size={24} color="#22c55e" />
            </View>
            <View className="ml-4 flex-1">
              <Text className="text-white font-semibold text-base">Seguimiento inteligente</Text>
              <Text className="text-gray-400 text-sm">Visualiza tu progreso fácilmente</Text>
            </View>
          </View>
        </MotiView>

        {/* Bottom CTA */}
        <MotiView 
          from={{ opacity: 0, translateY: 30 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: 'timing', duration: 800, delay: 600 }}
          className="px-6 pb-8"
        >
          <TouchableOpacity 
            onPress={onFinish} 
            activeOpacity={0.8}
            className="bg-blue-600 py-4 rounded-2xl flex-row items-center justify-center shadow-lg shadow-blue-600/30"
          >
            <Text className="text-white font-bold text-lg mr-2">Comenzar ahora</Text>
            <ChevronRight size={20} color="white" />
          </TouchableOpacity>

          <Text className="text-gray-500 text-center text-xs mt-4">
            Al continuar, aceptas nuestros términos y condiciones
          </Text>
        </MotiView>
      </SafeAreaView>
    </View>
  );
}