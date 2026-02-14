import React, { useState, useRef } from 'react';
import { View, Text, TouchableOpacity, Image, StyleSheet, Dimensions, Alert } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { Zap, ZapOff, RotateCcw, X, Check, Camera as CameraIcon, ChevronLeft } from 'lucide-react-native';

const { width } = Dimensions.get('window');
const FOCUS_SIZE = width * 0.7;

export default function ScanScreen({ navigation }) {
  const [permission, requestPermission] = useCameraPermissions();
  const [facing, setFacing] = useState('back');
  const [flash, setFlash] = useState('off');
  const [photo, setPhoto] = useState(null);
  const cameraRef = useRef(null);

  // --- 1. ESTADO: PERMISOS ---
  if (!permission) return <View className="flex-1 bg-black" />;
  
  if (!permission.granted) {
    return (
      <View className="flex-1 bg-black items-center justify-center p-6">
        <View className="bg-gray-900 p-6 rounded-3xl items-center shadow-lg shadow-blue-900/20">
            <CameraIcon size={60} color="#3b82f6" />
            <Text className="text-white text-xl font-bold text-center mt-4 mb-2">Habilitar Cámara</Text>
            <Text className="text-gray-400 text-center mb-6">
            Zenit usa IA para analizar las calorías de tus comidas.
            </Text>
            <TouchableOpacity 
            onPress={requestPermission}
            className="bg-blue-600 w-full py-4 rounded-xl active:bg-blue-700"
            >
            <Text className="text-white font-bold text-center text-lg">Permitir Acceso</Text>
            </TouchableOpacity>
        </View>
      </View>
    );
  }

  // --- FUNCIONES ---
  const handleTakePicture = async () => {
    console.log("Intentando tomar foto..."); // DEBUG
    if (cameraRef.current) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      
      try {
        const photoData = await cameraRef.current.takePictureAsync({
          quality: 0.8,
          base64: false,
          skipProcessing: true, // <--- CRUCIAL: Evita bloqueos en Android
          shutterSound: false, // <--- Opcional: hace la captura más rápida
        });
        
        console.log("Foto tomada:", photoData.uri); // DEBUG
        setPhoto(photoData.uri);
      } catch (error) {
        console.error("Error al tomar foto:", error);
        Alert.alert("Error", "No se pudo tomar la foto. Intenta reiniciar la app.");
      }
    } else {
        console.log("Error: La referencia de la cámara es nula");
    }
  };

  const handleRetake = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setPhoto(null);
  };

  const handleAnalyze = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    console.log("Analizando foto:", photo);
    // Aquí iría tu lógica de navegación o subida
  };

  const toggleFlash = () => {
    Haptics.selectionAsync();
    setFlash(cur => (cur === 'off' ? 'on' : 'off'));
  };

  const toggleCamera = () => {
    Haptics.selectionAsync();
    setFacing(cur => (cur === 'back' ? 'front' : 'back'));
  };

  // --- 2. VISTA: PREVISUALIZACIÓN (RESULTADO) ---
  if (photo) {
    return (
      <View className="flex-1 bg-black">
        <Image source={{ uri: photo }} className="flex-1" resizeMode="cover" />
        
        {/* Overlay con gradiente falso */}
        <View className="absolute bottom-0 w-full bg-black/80 pt-6 pb-12 px-8 rounded-t-3xl shadow-2xl">
          <Text className="text-white text-center font-bold text-lg mb-6">¿Analizar esta comida?</Text>
          
          <View className="flex-row justify-between items-center">
            {/* Botón Repetir */}
            <TouchableOpacity onPress={handleRetake} className="flex-row items-center bg-gray-800 px-6 py-4 rounded-2xl border border-gray-700">
              <X size={20} color="white" />
              <Text className="text-white ml-2 font-semibold">Repetir</Text>
            </TouchableOpacity>

            {/* Botón Confirmar */}
            <TouchableOpacity onPress={handleAnalyze} className="flex-row items-center bg-blue-600 px-8 py-4 rounded-2xl shadow-lg shadow-blue-500/30">
              <Text className="text-white mr-2 font-bold text-lg">Zenit AI</Text>
              <Check size={20} color="white" strokeWidth={3} />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  }

  // --- 3. VISTA: CÁMARA (LIVE) ---
  return (
    <View style={{ flex: 1, backgroundColor: 'black' }}>
      <CameraView 
        style={StyleSheet.absoluteFill} 
        facing={facing} 
        flash={flash}
        mode="picture" // <--- IMPORTANTE: Define explícitamente el modo
        ref={cameraRef}
      />

      {/* UI FLOTANTE */}
      <SafeAreaView style={{ flex: 1, justifyContent: 'space-between' }}>
        
        {/* HEADER */}
        <View className="flex-row justify-between items-center px-6 pt-2">
           <View className="w-10" /> 

          <View className="bg-black/40 px-4 py-1 rounded-full backdrop-blur-md">
            <Text className="text-white text-xs font-medium tracking-widest uppercase">Escáner IA</Text>
          </View>

          <TouchableOpacity 
            onPress={toggleFlash}
            className={`w-10 h-10 rounded-full items-center justify-center ${flash === 'on' ? 'bg-yellow-400' : 'bg-black/40'}`}
          >
            {flash === 'on' ? <Zap size={18} color="black" fill="black" /> : <ZapOff size={18} color="white" />}
          </TouchableOpacity>
        </View>

        {/* CENTRO: Marco de Enfoque */}
        <View className="items-center justify-center flex-1">
          <View 
            style={{ width: FOCUS_SIZE, height: FOCUS_SIZE }} 
            className="border border-white/30 rounded-3xl justify-between p-0 overflow-hidden"
          >
             <View className="flex-row justify-between">
                <View className="w-6 h-6 border-t-4 border-l-4 border-white rounded-tl-xl" />
                <View className="w-6 h-6 border-t-4 border-r-4 border-white rounded-tr-xl" />
             </View>
             <View className="flex-row justify-between">
                <View className="w-6 h-6 border-b-4 border-l-4 border-white rounded-bl-xl" />
                <View className="w-6 h-6 border-b-4 border-r-4 border-white rounded-br-xl" />
             </View>
          </View>
          <Text className="text-white/80 mt-4 text-sm font-medium bg-black/40 px-4 py-2 rounded-full overflow-hidden">
            Centra tu plato aquí
          </Text>
        </View>

        {/* FOOTER */}
        <View className="flex-row justify-around items-center pb-8 pt-4">
           {/* Botón Volver */}
           <TouchableOpacity 
             className="w-12 h-12 rounded-full bg-black/40 items-center justify-center border border-white/10"
             onPress={() => navigation.goBack()}
           >
              <ChevronLeft size={28} color="white" />
           </TouchableOpacity>

           {/* DISPARADOR */}
           <TouchableOpacity onPress={handleTakePicture} activeOpacity={0.7}>
             <View className="w-20 h-20 rounded-full border-4 border-white/30 items-center justify-center">
               <View className="w-16 h-16 rounded-full bg-white shadow-lg shadow-white/50" />
             </View>
           </TouchableOpacity>

           {/* Girar Cámara */}
           <TouchableOpacity 
             onPress={toggleCamera} 
             className="w-12 h-12 rounded-full bg-black/40 items-center justify-center border border-white/10"
           >
             <RotateCcw size={24} color="white" />
           </TouchableOpacity>
        </View>

      </SafeAreaView>
    </View>
  );
}