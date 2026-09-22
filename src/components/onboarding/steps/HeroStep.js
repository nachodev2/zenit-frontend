import React from 'react';
import { View, Text, TouchableOpacity, useWindowDimensions, Image } from 'react-native';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  useFrameCallback,
  FadeInDown 
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { GradientButton } from '../../ui/GradientButton'; 

// Recibimos la prop 'onLogin'
export const HeroStep = ({ onNext, onLogin }) => {
  const { width } = useWindowDimensions();
  // 88% del ancho de pantalla (máx 365px): presencia más imponente pero equilibrada
  const plateSize = Math.min(width * 0.88, 365);

  // Rotación continua frame a frame: elimina 100% el "tick" del loop
  const rotation = useSharedValue(0);

  useFrameCallback((frameInfo) => {
    'worklet';
    if (frameInfo.timeSincePreviousFrame) {
      // 360 grados cada 22000 ms = 0.01636 grados por milisegundo
      const delta = (frameInfo.timeSincePreviousFrame / 22000) * 360;
      rotation.value = (rotation.value + delta) % 360;
    }
  });

  const animatedPlateStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation.value}deg` }],
  }));

  return (
    <View className="flex-1 bg-white justify-between">
        {/* Sección Superior y Central: Plato completo rotando + Textos centrados */}
        <View className="flex-1 items-center justify-center px-6 pt-8">
             {/* Contenedor del Plato en rotación continua */}
             <Animated.View 
               entering={FadeInDown.duration(800)}
               style={{ width: plateSize, height: plateSize }}
               className="items-center justify-center mb-8"
             >
                  <Animated.View style={[{ width: '100%', height: '100%' }, animatedPlateStyle]}>
                      <Image
                        source={require('../../../../assets/images/hero_plate.png')}
                        style={{ width: '100%', height: '100%' }}
                        resizeMode="contain"
                      />
                  </Animated.View>
             </Animated.View>

             {/* Texto Principal (Bajado, con respiro respecto al plato) */}
             <Animated.View entering={FadeInDown.delay(200).duration(800)} className="items-center mt-2">
                  <Text className="text-zenitBlack text-6xl font-black tracking-tighter text-center mb-1">ZENIT.</Text>
                  <Text className="text-zenitTextMuted text-2xl font-medium tracking-tight text-center">No hay techo.</Text>
             </Animated.View>
        </View>

        {/* Panel Inferior de Acciones */}
        <Animated.View entering={FadeInDown.delay(400).springify()} className="bg-white px-6 py-8 pb-12">
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
};