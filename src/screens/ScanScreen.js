import React, { useState, useRef, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Dimensions, Alert } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import * as Haptics from 'expo-haptics';
import { Zap, ZapOff, RotateCcw, X, Camera as CameraIcon, ChevronLeft } from 'lucide-react-native';
import Animated, { FadeIn, FadeOut, Easing, useSharedValue, useAnimatedStyle, withRepeat, withSequence, withTiming, withSpring, cancelAnimation, runOnJS } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { analyzeFoodImage } from '../services/ai/geminiVisionService';

import { ZENIT_GRADIENT } from '../constants/theme'; 

const { width, height } = Dimensions.get('window');
const TARGET_SIZE = width * 0.75; 

export default function ScanScreen() {
  const navigation = useNavigation();
  const [permission, requestPermission] = useCameraPermissions();
  const cameraRef = useRef(null);

  const [appState, setAppState] = useState('idle');
  const [photo, setPhoto] = useState(null);
  const [facing, setFacing] = useState('back');
  const [flash, setFlash] = useState('off');

  // Valores compartidos para la animación "Lock-On"
  const boxWidth = useSharedValue(width); // Arranca ocupando todo el ancho
  const boxHeight = useSharedValue(height); // Arranca ocupando todo el alto
  const laserPosition = useSharedValue(0);
  const laserOpacity = useSharedValue(0);

  const startLockOnAnimation = () => {
    // 1. El marco hace "snap" (se achica) hacia el plato en el centro
    boxWidth.value = withSpring(TARGET_SIZE, { damping: 14, stiffness: 90 });
    boxHeight.value = withSpring(TARGET_SIZE, { damping: 14, stiffness: 90 });
    
    // 2. El láser aparece y empieza a escanear dentro de la caja
    laserOpacity.value = withTiming(1, { duration: 500 });
    laserPosition.value = withRepeat(
        withTiming(TARGET_SIZE, { duration: 1500, easing: Easing.inOut(Easing.ease) }), 
        -1, true
    );
  };

  const resetAnimations = () => {
    cancelAnimation(boxWidth);
    cancelAnimation(boxHeight);
    cancelAnimation(laserPosition);
    cancelAnimation(laserOpacity);
    boxWidth.value = width;
    boxHeight.value = height;
    laserPosition.value = 0;
    laserOpacity.value = 0;
  };

  useEffect(() => {
    return () => resetAnimations();
  }, []);

  const animatedBoxStyle = useAnimatedStyle(() => ({
    width: boxWidth.value,
    height: boxHeight.value,
  }));

  const animatedLaserStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: laserPosition.value }],
    opacity: laserOpacity.value
  }));

  const handleTakePicture = async () => {
    if (!cameraRef.current || appState !== 'idle') return;
    
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setAppState('capturing');

    try {
      const photoData = await cameraRef.current.takePictureAsync({
        quality: 0.8, // Calidad alta para buena detección
        base64: true,
        skipProcessing: true, 
        shutterSound: false, 
      });

      // ==========================================
      // PRUEBA DE SERVICIO (STEP 1)
      // ==========================================
      try {
        console.log("Iniciando llamada a Gemini...");
        const aiResult = await analyzeFoodImage(photoData.base64);
        console.log("📦 Detecciones obtenidas:", JSON.stringify(aiResult.objects, null, 2));
        
        const plate = aiResult.objects.find(obj => obj.type === 'plate');
        if (plate) {
            console.log(`🎯 Plato detectado! Box: ${plate.box_2d}`);
            console.log(`🗺️ Puntos de máscara: ${plate.mask ? plate.mask.length : 0}`);
        }
      } catch (e) {
         console.error("❌ ERROR DETALLADO DE GEMINI/ZOD:", e);
      }
      // ==========================================
      
      setPhoto(photoData);
      setAppState('scanning');
      startLockOnAnimation();

      // Flujo temporal completo para que no se congele
      setTimeout(() => setAppState('identifying'), 2000);
      setTimeout(() => setAppState('result'), 4000);

    } catch (error) {
      console.error(error);
      setAppState('error');
      Alert.alert("Error", "No se pudo procesar la imagen.");
    }
  };

  const handleCancel = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    resetAnimations();
    setPhoto(null);
    setAppState('idle');
  };

  if (!permission) return <View className="flex-1 bg-black" />;
  if (!permission.granted) {
    return (
      <View className="flex-1 bg-black items-center justify-center p-6">
        <View className="bg-gray-900 p-6 rounded-3xl items-center shadow-lg shadow-orange-900/20">
            <CameraIcon size={60} color="#F97316" />
            <Text className="text-white text-xl font-bold text-center mt-4 mb-2">Habilitar Cámara</Text>
            <Text className="text-gray-400 text-center mb-6">Zenit usa IA para analizar tus comidas.</Text>
            <TouchableOpacity onPress={requestPermission} className="bg-[#F97316] w-full py-4 rounded-xl active:bg-[#EA580C]">
              <Text className="text-white font-bold text-center text-lg">Permitir Acceso</Text>
            </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-black">
      <CameraView 
        style={StyleSheet.absoluteFill} 
        facing={facing} 
        flash={flash} 
        mode="picture" 
        ref={cameraRef} 
      />

      {photo && (
        <Animated.Image 
          entering={FadeIn.duration(200)}
          exiting={FadeOut.duration(200)}
          source={{ uri: photo.uri }} 
          className="absolute w-full h-full" 
          resizeMode="cover" 
        />
      )}

      <SafeAreaView className="flex-1 justify-between">
        
        <View className="flex-row justify-between items-center px-6 pt-2 z-20">
          {appState === 'idle' ? (
            <TouchableOpacity 
                className="w-10 h-10 rounded-full bg-black/40 items-center justify-center backdrop-blur-md"
                onPress={() => navigation.goBack()}
            >
                <ChevronLeft size={24} color="white" />
            </TouchableOpacity>
          ) : (
             <TouchableOpacity 
                className="w-10 h-10 rounded-full bg-black/40 items-center justify-center backdrop-blur-md"
                onPress={handleCancel}
            >
                <X size={20} color="white" />
            </TouchableOpacity>
          )}

          <View className="bg-black/40 px-4 py-1.5 rounded-full backdrop-blur-md border border-white/10">
            <Text className="text-white text-xs font-bold tracking-widest uppercase">
              {appState === 'idle' ? 'Escáner IA' : appState === 'scanning' ? 'Analizando...' : appState === 'identifying' ? 'Identificando...' : 'Completado'}
            </Text>
          </View>

          {appState === 'idle' ? (
            <TouchableOpacity onPress={() => { Haptics.selectionAsync(); setFlash(f => f === 'off' ? 'on' : 'off'); }} className={`w-10 h-10 rounded-full items-center justify-center backdrop-blur-md ${flash === 'on' ? 'bg-[#F97316]' : 'bg-black/40'}`}>
                {flash === 'on' ? <Zap size={18} color="white" fill="white" /> : <ZapOff size={18} color="white" />}
            </TouchableOpacity>
          ) : <View className="w-10 h-10" />}
        </View>

        {appState !== 'idle' && (
           <Animated.View entering={FadeIn.duration(400)} className="absolute inset-0 bg-black/50 z-10 items-center justify-center pointer-events-none">
              
              <Animated.View style={[animatedBoxStyle]} className="relative justify-between overflow-hidden">
                <View className="absolute top-0 left-0 w-10 h-10 border-t-4 border-l-4 border-[#F97316] rounded-tl-3xl opacity-90" />
                <View className="absolute top-0 right-0 w-10 h-10 border-t-4 border-r-4 border-[#F97316] rounded-tr-3xl opacity-90" />
                <View className="absolute bottom-0 left-0 w-10 h-10 border-b-4 border-l-4 border-[#F97316] rounded-bl-3xl opacity-90" />
                <View className="absolute bottom-0 right-0 w-10 h-10 border-b-4 border-r-4 border-[#F97316] rounded-br-3xl opacity-90" />
                
                <Animated.View 
                    style={[animatedLaserStyle, { width: '100%', height: 2, backgroundColor: '#F97316', shadowColor: '#F97316', shadowRadius: 8, elevation: 5 }]} 
                />
              </Animated.View>
           </Animated.View>
        )}

        {appState === 'idle' && (
            <Animated.View entering={FadeIn} exiting={FadeOut} className="flex-row justify-around items-center pb-8 pt-4 z-20">
                <View className="w-12 h-12" />

                <TouchableOpacity onPress={handleTakePicture} activeOpacity={0.7} disabled={appState !== 'idle'}>
                    <LinearGradient
                        colors={ZENIT_GRADIENT}
                        start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                        style={{ width: 80, height: 80, borderRadius: 40, alignItems: 'center', justifyContent: 'center' }}
                        className="shadow-xl shadow-orange-500/30 border border-white/20"
                    >
                        <View className="w-[64px] h-[64px] rounded-full bg-white border-4 border-white/30" />
                    </LinearGradient>
                </TouchableOpacity>

                <TouchableOpacity onPress={() => { Haptics.selectionAsync(); setFacing(f => f === 'back' ? 'front' : 'back'); }} className="w-12 h-12 rounded-full bg-black/40 items-center justify-center border border-white/10 backdrop-blur-md">
                    <RotateCcw size={22} color="white" />
                </TouchableOpacity>
            </Animated.View>
        )}
      </SafeAreaView>
    </View>
  );
}