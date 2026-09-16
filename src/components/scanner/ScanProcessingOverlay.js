import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Image } from 'react-native';
import Animated, {
  FadeIn,
  FadeOut,
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  Easing,
  useAnimatedReaction,
  runOnJS,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { Sparkles } from 'lucide-react-native';

import { ZENIT_GRADIENT } from '../../constants/theme';

const SlowPulseIcon = React.memo(() => {
  const scale = useSharedValue(1);
  const opacity = useSharedValue(0.5);

  useEffect(() => {
    scale.value = withRepeat(withTiming(1.15, { duration: 1400, easing: Easing.inOut(Easing.cubic) }), -1, true);
    opacity.value = withRepeat(withTiming(0.15, { duration: 1400, easing: Easing.inOut(Easing.cubic) }), -1, true);
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  return (
    <View className="items-center justify-center">
      <Animated.View style={[animatedStyle, { position: 'absolute', width: 80, height: 80, borderRadius: 40, backgroundColor: '#F97316' }]} />
      <LinearGradient
        colors={ZENIT_GRADIENT}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{
          width: 64,
          height: 64,
          borderRadius: 32,
          alignItems: 'center',
          justifyContent: 'center',
          shadowColor: '#F97316',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.3,
          shadowRadius: 8,
          elevation: 5,
        }}
      >
        <Sparkles size={28} color="white" />
      </LinearGradient>
    </View>
  );
});

const ProgressText = React.memo(({ progress }) => {
  const [loadingText, setLoadingText] = useState('Analizando imagen...');

  useAnimatedReaction(
    () => progress.value,
    (current, previous) => {
      if (current >= 95 && previous < 95) runOnJS(setLoadingText)('¡Completado!');
      else if (current >= 65 && previous < 65) runOnJS(setLoadingText)('Calculando macros...');
      else if (current >= 25 && previous < 25) runOnJS(setLoadingText)('Identificando ingredientes...');
    }
  );

  return (
    <Animated.View entering={FadeIn.duration(300)} className="items-center">
      <Text className="text-gray-900 font-bold text-lg tracking-wide text-center">{loadingText}</Text>
      <Text className="text-[#F97316] text-[10px] mt-1.5 uppercase tracking-widest font-black text-center">Zenit AI</Text>
    </Animated.View>
  );
});

export function ScanProcessingOverlay({ photo, progress }) {
  const progressStyle = useAnimatedStyle(() => ({
    width: `${progress.value}%`,
  }));

  if (!photo) return null;

  return (
    <Animated.View
      entering={FadeIn.duration(260)}
      exiting={FadeOut.duration(200)}
      style={StyleSheet.absoluteFill}
      className="z-40 items-center justify-center"
      renderToHardwareTextureAndroid={true}
    >
      <Image source={{ uri: photo.uri }} style={StyleSheet.absoluteFill} resizeMode="cover" />
      <View className="absolute inset-0 bg-black/40 backdrop-blur-md" />
      <View
        className="bg-white/95 rounded-[40px] p-8 w-[80%] max-w-[320px] items-center justify-center border border-white/20"
        style={{ shadowColor: '#000', shadowOffset: { width: 0, height: 20 }, shadowOpacity: 0.2, shadowRadius: 40, elevation: 10 }}
      >
        <SlowPulseIcon />
        <View className="h-14 justify-center mt-6">
          <ProgressText progress={progress} />
        </View>
        <View className="w-full h-1.5 bg-gray-200 rounded-full mt-6 overflow-hidden">
          <Animated.View style={[progressStyle, { height: '100%', backgroundColor: '#F97316', borderRadius: 999 }]} />
        </View>
      </View>
    </Animated.View>
  );
}

export default ScanProcessingOverlay;

