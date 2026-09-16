import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import Animated, { FadeInDown, ZoomIn } from 'react-native-reanimated';
import { Play } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { GradientButton } from '../../ui/GradientButton'; 

// Recibimos la nueva prop 'onLogin'
export const HeroStep = ({ onNext, onLogin }) => (
  <View className="flex-1 bg-white">
      <View className="flex-1 bg-white items-center justify-center relative overflow-hidden">
           {/* Video Loop Demo (Placeholder) */}
           <Animated.View entering={ZoomIn.duration(800).springify()} className="absolute items-center justify-center">
                <View className="w-20 h-20 bg-gray-50 rounded-full items-center justify-center mb-4">
                    <Play size={32} color="#0A0A0A" fill="#0A0A0A" />
                </View>
                <Text className="text-gray-400 text-xs uppercase tracking-widest">Video Loop Demo</Text>
           </Animated.View>

           {/* Texto Principal */}
           <Animated.View entering={FadeInDown.delay(300).duration(800)} className="absolute bottom-10 left-0 right-0 px-6">
                <Text className="text-zenitBlack text-6xl font-black tracking-tighter text-center mb-1">ZENIT.</Text>
                <Text className="text-zenitTextMuted text-2xl font-medium tracking-tight text-center">No hay techo.</Text>
           </Animated.View>
      </View>

      {/* Panel Inferior */}
      <Animated.View entering={FadeInDown.delay(600).springify()} className="bg-white px-6 py-8 pb-12 rounded-t-3xl shadow-sm">
          <GradientButton text="INICIAR CALIBRACIÓN" onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); onNext(); }} />
          
          {/* --- BOTÓN DE LOGIN CONECTADO --- */}
          <TouchableOpacity 
            className="mt-6" 
            onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                if (onLogin) onLogin(); // Ejecutamos la navegación
            }}
          >
            <Text className="text-center text-gray-400 font-medium text-sm">
                ¿Ya tienes cuenta? <Text className="text-zenitBlack font-bold">Inicia sesión</Text>
            </Text>
          </TouchableOpacity>
      </Animated.View>
  </View>
);