import React, { useState, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image, ActivityIndicator, Alert, ScrollView } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import * as Haptics from 'expo-haptics';
import { Zap, ZapOff, RotateCcw, X, Camera as CameraIcon, ChevronLeft, Sparkles, Check } from 'lucide-react-native';
import Animated, { FadeIn, FadeOut, SlideInDown } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';

import { ZENIT_GRADIENT } from '../constants/theme'; 
import { analyzeFoodImage } from '../services/ai/geminiVisionService';

export default function ScanScreen() {
  const navigation = useNavigation();
  const [permission, requestPermission] = useCameraPermissions();
  const cameraRef = useRef(null);

  // Estados: 'idle' | 'processing' | 'result'
  const [appState, setAppState] = useState('idle'); 
  const [photo, setPhoto] = useState(null);
  const [facing, setFacing] = useState('back');
  const [flash, setFlash] = useState('off');
  const [aiData, setAiData] = useState(null);

  const handleTakePicture = async () => {
    if (!cameraRef.current || appState !== 'idle') return;
    
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setAppState('processing');

    try {
      const photoData = await cameraRef.current.takePictureAsync({
        quality: 0.5, 
        base64: true,
        skipProcessing: true, 
      });
      setPhoto(photoData);

      // Llamada real a Gemini
      const result = await analyzeFoodImage(photoData.base64);
      setAiData(result);
      
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setAppState('result');
    } catch (error) {
      console.error(error);
      Alert.alert("Error", "No pudimos analizar la imagen.");
      setAppState('idle');
      setPhoto(null);
    }
  };

  const handleRetake = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setPhoto(null);
    setAiData(null);
    setAppState('idle');
  };

  const handleSave = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    navigation.goBack();
  };

  if (!permission) return <View className="flex-1 bg-black" />;
  if (!permission.granted) {
    return (
      <View className="flex-1 bg-black items-center justify-center p-6">
        <View className="bg-gray-900 p-6 rounded-3xl items-center shadow-lg shadow-orange-900/20">
            <CameraIcon size={60} color="#F97316" />
            <Text className="text-white text-xl font-bold mt-4 mb-2">Habilitar Cámara</Text>
            <TouchableOpacity onPress={requestPermission} className="bg-[#F97316] w-full py-4 rounded-xl mt-4">
              <Text className="text-white font-bold text-center text-lg">Permitir Acceso</Text>
            </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-black">
      
      {/* CAPA 1: CÁMARA */}
      <CameraView style={StyleSheet.absoluteFill} facing={facing} flash={flash} mode="picture" ref={cameraRef} />

      {/* OVERLAY: CONTROLES DE LA CÁMARA */}
      {appState === 'idle' && (
        <SafeAreaView className="flex-1 justify-between">
            <View className="flex-row justify-between items-center px-6 pt-2">
                <TouchableOpacity onPress={() => navigation.goBack()} className="w-10 h-10 rounded-full bg-black/40 items-center justify-center">
                    <ChevronLeft size={24} color="white" />
                </TouchableOpacity>
                <TouchableOpacity onPress={() => { Haptics.selectionAsync(); setFlash(f => f === 'off' ? 'on' : 'off'); }} className={`w-10 h-10 rounded-full items-center justify-center ${flash === 'on' ? 'bg-[#F97316]' : 'bg-black/40'}`}>
                    {flash === 'on' ? <Zap size={18} color="white" fill="white" /> : <ZapOff size={18} color="white" />}
                </TouchableOpacity>
            </View>

            <View className="flex-row justify-around items-center pb-8 pt-4">
                <View className="w-12 h-12" />
                <TouchableOpacity onPress={handleTakePicture} activeOpacity={0.7}>
                    <LinearGradient
                        colors={ZENIT_GRADIENT}
                        start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                        style={{ width: 80, height: 80, borderRadius: 40, alignItems: 'center', justifyContent: 'center' }}
                    >
                        <View className="w-[64px] h-[64px] rounded-full bg-white border-4 border-white/30" />
                    </LinearGradient>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => { Haptics.selectionAsync(); setFacing(f => f === 'back' ? 'front' : 'back'); }} className="w-12 h-12 rounded-full bg-black/40 items-center justify-center">
                    <RotateCcw size={22} color="white" />
                </TouchableOpacity>
            </View>
        </SafeAreaView>
      )}

      {/* CAPA 2: PROCESANDO (ESTILO CAL+) */}
      {appState === 'processing' && photo && (
        <Animated.View entering={FadeIn.duration(300)} exiting={FadeOut} className="absolute inset-0 bg-black/70 items-center justify-center z-40">
            <View className="bg-[#111111] p-8 rounded-[32px] items-center border border-gray-800 shadow-2xl">
                <ActivityIndicator size="large" color="#F97316" />
                <Text className="text-white font-semibold text-lg mt-5">Procesando imagen...</Text>
                <Text className="text-gray-500 text-xs mt-2 uppercase tracking-widest font-bold">Zenit AI</Text>
            </View>
        </Animated.View>
      )}

      {/* CAPA 3: PANTALLA DE RESULTADOS (ESTILO CAL+) */}
      {appState === 'result' && aiData && photo && (
          <Animated.View entering={SlideInDown.duration(500).springify().damping(20)} className="absolute inset-0 bg-[#0A0A0A] z-50">
             <ScrollView className="flex-1" bounces={false}>
                
                {/* Header Foto */}
                <View className="h-80 w-full relative">
                    <Image source={{ uri: photo.uri }} className="w-full h-full" resizeMode="cover" />
                    <LinearGradient colors={['transparent', '#0A0A0A']} className="absolute bottom-0 w-full h-32" />
                    
                    <SafeAreaView className="absolute w-full px-4 pt-2">
                        <TouchableOpacity onPress={handleRetake} className="bg-black/50 w-10 h-10 rounded-full items-center justify-center backdrop-blur-md">
                            <X color="white" size={24} />
                        </TouchableOpacity>
                    </SafeAreaView>
                </View>
                
                {/* Contenido Nutricional */}
                <View className="px-6 -mt-10">
                    <Text className="text-white text-3xl font-black tracking-tight">{aiData.mealName}</Text>
                    
                    <View className="flex-row items-center bg-[#F97316]/10 self-start px-4 py-1.5 rounded-full mt-3 mb-8 border border-[#F97316]/20">
                        <Sparkles size={16} color="#F97316" fill="#F97316" />
                        <Text className="text-[#F97316] font-black text-lg ml-2">{aiData.totalCalories} KCAL</Text>
                    </View>

                    {/* Fila de Macros */}
                    <View className="flex-row justify-between mb-8 gap-x-3">
                        <MacroCard label="Proteína" value={aiData.totalProtein} unit="g" />
                        <MacroCard label="Carbos" value={aiData.totalCarbs} unit="g" />
                        <MacroCard label="Grasas" value={aiData.totalFat} unit="g" />
                    </View>

                    {/* Ingredientes */}
                    <Text className="text-white font-bold text-xl mb-4 tracking-tight">Ingredientes detectados</Text>
                    <View className="bg-[#111111] rounded-3xl p-5 border border-gray-800 mb-10">
                        {aiData.ingredients.map((ing, i) => (
                            <View key={i} className={`py-3 flex-row items-center ${i !== aiData.ingredients.length - 1 ? 'border-b border-gray-800' : ''}`}>
                                <View className="w-2 h-2 rounded-full bg-[#F97316] mr-4" />
                                <Text className="text-gray-300 text-base font-medium capitalize">{ing}</Text>
                            </View>
                        ))}
                    </View>
                </View>
             </ScrollView>

             {/* Footer con Botón Guardar */}
             <SafeAreaView className="bg-[#0A0A0A] px-6 py-4 border-t border-gray-900">
                <TouchableOpacity onPress={handleSave} className="bg-[#F97316] w-full py-4 rounded-2xl flex-row justify-center items-center">
                    <Check size={20} color="white" strokeWidth={3} />
                    <Text className="text-white font-bold text-lg ml-2">Guardar comida</Text>
                </TouchableOpacity>
             </SafeAreaView>
          </Animated.View>
      )}
    </View>
  );
}

// Subcomponente UI de Macros
const MacroCard = ({ label, value, unit }) => (
    <View className="flex-1 bg-[#111111] p-4 rounded-2xl border border-gray-800 items-center">
        <Text className="text-gray-400 text-[11px] font-bold tracking-widest uppercase mb-1">{label}</Text>
        <View className="flex-row items-baseline">
            <Text className="text-white text-xl font-black">{value}</Text>
            <Text className="text-gray-500 font-bold text-xs ml-1">{unit}</Text>
        </View>
    </View>
);