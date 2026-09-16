import React, { useState, useRef, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, BackHandler } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { Sparkles } from 'lucide-react-native';
import { useSharedValue, withTiming, Easing } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { manipulateAsync, SaveFormat } from 'expo-image-manipulator';
import * as ImagePicker from 'expo-image-picker';

import { ZENIT_GRADIENT } from '../constants/theme';
import { analyzeFoodImage, prewarmVisionService } from '../services/ai/geminiVisionService';
import { useUserStore } from '../store/useUserStore';
import { ZenitModalAlert } from '../components/ui/ZenitModalAlert';

// Subcomponentes del escáner
import { CameraControlsOverlay } from '../components/scanner/CameraControlsOverlay';
import { GuidedQuestionsOverlay } from '../components/scanner/GuidedQuestionsOverlay';
import { ScanProcessingOverlay } from '../components/scanner/ScanProcessingOverlay';
import { ScanResultModal } from '../components/scanner/ScanResultModal';
import { CoachChatModal } from '../components/scanner/CoachChatModal';

export default function GuidedScanScreen({ navigation }) {
  const [permission, requestPermission] = useCameraPermissions();
  const cameraRef = useRef(null);

  const isDark = false;

  // Estados del flujo asistido: idle -> questions -> processing -> result
  const [appState, setAppState] = useState('idle'); // 'idle' | 'questions' | 'processing' | 'result'
  const [photo, setPhoto] = useState(null);
  const [facing, setFacing] = useState('back');
  const [flash, setFlash] = useState('off');
  const [editableData, setEditableData] = useState(null);
  const [isFavorite, setIsFavorite] = useState(false);
  const [showCoachChat, setShowCoachChat] = useState(false);
  const [selectedPortionLabel, setSelectedPortionLabel] = useState(null);

  const baseDataRef = useRef(null);
  const selectedMultiplierRef = useRef(1);
  const isTakingPictureRef = useRef(false);
  const isLeavingRef = useRef(false);
  const progress = useSharedValue(0);

  // Store de Zustand
  const addConsumedFood = useUserStore((state) => state.addConsumedFood);
  const targetMacros = useUserStore((state) => state.targetMacros);
  const consumedMacros = useUserStore((state) => state.consumedMacros);
  const userName = useUserStore((state) => state.name);
  const userGoal = useUserStore((state) => state.goal);
  const getRemainingScans = useUserStore((state) => state.getRemainingScans);
  const incrementDailyScans = useUserStore((state) => state.incrementDailyScans);
  const resetDailyScans = useUserStore((state) => state.resetDailyScans);

  const remainingScans = getRemainingScans ? getRemainingScans(8) : 8;

  const appStateRef = useRef(appState);
  useEffect(() => {
    appStateRef.current = appState;
  }, [appState]);

  const showCoachChatRef = useRef(showCoachChat);
  useEffect(() => {
    showCoachChatRef.current = showCoachChat;
  }, [showCoachChat]);

  // Pre-calentar conexión con Gemini
  useEffect(() => {
    prewarmVisionService();
  }, []);

  // Modal de Alertas
  const [dialogConfig, setDialogConfig] = useState({
    visible: false,
    title: '',
    message: '',
    type: 'warning',
    confirmText: 'Entendido',
    cancelText: null,
    onConfirm: null,
    onCancel: null,
  });

  const showCustomAlert = ({
    title,
    message,
    type = 'warning',
    confirmText = 'Entendido',
    cancelText = null,
    onConfirm = null,
    onCancel = null,
  }) => {
    setDialogConfig({
      visible: true,
      title,
      message,
      type,
      confirmText,
      cancelText,
      onConfirm: () => {
        setDialogConfig((p) => ({ ...p, visible: false }));
        if (onConfirm) onConfirm();
      },
      onCancel: () => {
        setDialogConfig((p) => ({ ...p, visible: false }));
        if (onCancel) onCancel();
      },
    });
  };

  // Validaciones y alertas de confirmación al volver hacia atrás
  const confirmDiscardQuestions = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    showCustomAlert({
      title: '¿Descartar foto?',
      message: 'Si volvés al visor de la cámara, se descartará la foto capturada y las respuestas ingresadas.',
      type: 'warning',
      confirmText: 'Sí, tomar otra',
      cancelText: 'Continuar aquí',
      onConfirm: () => {
        handleRetake();
      },
    });
  };

  const confirmCancelProcessing = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    showCustomAlert({
      title: '¿Cancelar análisis?',
      message: 'El análisis de macros con IA está en proceso. ¿Deseás cancelar la operación y volver al visor?',
      type: 'warning',
      confirmText: 'Sí, cancelar',
      cancelText: 'Esperar resultado',
      onConfirm: () => {
        handleDiscard();
      },
    });
  };

  const confirmDiscardResult = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    showCustomAlert({
      title: '¿Descartar comida?',
      message: 'Se perderán los macros calculados y la foto escaneada. No se guardará ningún alimento en tu día.',
      type: 'danger',
      confirmText: 'Sí, descartar',
      cancelText: 'Seguir editando',
      onConfirm: () => {
        handleDiscard();
      },
    });
  };

  // Deshabilitar gestos de deslizamiento en iOS/Android cuando estamos en flujo activo
  useEffect(() => {
    navigation.setOptions({
      gestureEnabled: appState === 'idle',
    });
  }, [appState, navigation]);

  // Interceptar navegación general de React Navigation (gestos de borde, volver, etc.)
  useEffect(() => {
    const unsubscribe = navigation.addListener('beforeRemove', (e) => {
      if (isLeavingRef.current) {
        return;
      }

      if (appStateRef.current === 'capturing') {
        e.preventDefault();
        return;
      }

      if (appStateRef.current === 'processing') {
        e.preventDefault();
        showCustomAlert({
          title: '¿Cancelar análisis?',
          message: 'El análisis de macros con IA está en proceso. Si salís ahora se cancelará la operación.',
          type: 'warning',
          confirmText: 'Sí, salir',
          cancelText: 'Esperar resultado',
          onConfirm: () => {
            isLeavingRef.current = true;
            navigation.dispatch(e.data.action);
          },
        });
        return;
      }

      if (appStateRef.current === 'questions') {
        e.preventDefault();
        showCustomAlert({
          title: '¿Descartar foto?',
          message: 'Tenés una foto capturada y preguntas en curso. ¿Deseás salir y descartar todo?',
          type: 'warning',
          confirmText: 'Sí, descartar y salir',
          cancelText: 'Continuar aquí',
          onConfirm: () => {
            isLeavingRef.current = true;
            navigation.dispatch(e.data.action);
          },
        });
        return;
      }

      if (appStateRef.current === 'result') {
        e.preventDefault();
        showCustomAlert({
          title: '¿Descartar comida?',
          message: 'Se perderán los macros calculados y la foto escaneada. No se registrará ningún alimento en tu día.',
          type: 'danger',
          confirmText: 'Sí, descartar y salir',
          cancelText: 'Seguir editando',
          onConfirm: () => {
            isLeavingRef.current = true;
            navigation.dispatch(e.data.action);
          },
        });
        return;
      }

      // En 'idle' permitimos volver a HomeScreen normalmente
    });

    return unsubscribe;
  }, [navigation]);

  // Botón físico y gestos de atrás del sistema Android
  useEffect(() => {
    const onBackPress = () => {
      if (showCoachChatRef.current) {
        setShowCoachChat(false);
        return true;
      }
      if (appStateRef.current === 'capturing') {
        return true;
      }
      if (appStateRef.current === 'processing') {
        confirmCancelProcessing();
        return true;
      }
      if (appStateRef.current === 'questions') {
        confirmDiscardQuestions();
        return true;
      }
      if (appStateRef.current === 'result') {
        confirmDiscardResult();
        return true;
      }
      navigation.goBack();
      return true;
    };

    const subscription = BackHandler.addEventListener('hardwareBackPress', onBackPress);
    return () => subscription.remove();
  }, []);

  // Paso 1: Foto capturada -> Mostrar preguntas de contexto
  const handlePhotoCaptured = (uri) => {
    if (remainingScans <= 0) {
      isTakingPictureRef.current = false;
      setAppState('idle');
      appStateRef.current = 'idle';
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      showCustomAlert({
        title: 'Límite diario alcanzado',
        message: 'Ya utilizaste tus 8 escaneos de hoy. Podés reiniciar el cupo manteniendo presionada la píldora superior para seguir probando.',
        type: 'warning',
        confirmText: 'Entendido',
      });
      return;
    }

    setPhoto({ uri });
    setAppState('questions');
    appStateRef.current = 'questions';
  };

  // Disparo de la cámara con bloqueo síncrono multi-tap
  const handleTakePicture = async () => {
    if (!cameraRef.current || isTakingPictureRef.current || appStateRef.current !== 'idle') return;

    if (remainingScans <= 0) {
      handlePhotoCaptured(null);
      return;
    }

    // Bloqueo inmediato síncrono para evitar múltiples disparos si el usuario pulsa repetidas veces
    isTakingPictureRef.current = true;
    setAppState('capturing');
    appStateRef.current = 'capturing';

    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
      const photoResult = await cameraRef.current.takePictureAsync({
        quality: 0.85,
        skipProcessing: false,
      });

      if (photoResult?.uri) {
        handlePhotoCaptured(photoResult.uri);
      } else {
        isTakingPictureRef.current = false;
        setAppState('idle');
        appStateRef.current = 'idle';
      }
    } catch (e) {
      console.error('Error al capturar foto:', e);
      isTakingPictureRef.current = false;
      setAppState('idle');
      appStateRef.current = 'idle';
      showCustomAlert({
        title: 'Error de cámara',
        message: 'No se pudo tomar la fotografía. Inténtalo nuevamente.',
        type: 'danger',
      });
    }
  };

  // Selector de galería
  const handlePickImageFromGallery = async () => {
    if (isTakingPictureRef.current || appStateRef.current !== 'idle') return;

    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!perm.granted) {
        showCustomAlert({
          title: 'Permiso requerido',
          message: 'Necesitamos acceso a tus fotos para elegir una imagen de comida.',
          type: 'info',
        });
        return;
      }

      const pickerResult = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: false,
        quality: 0.85,
      });

      if (!pickerResult.canceled && pickerResult.assets && pickerResult.assets.length > 0) {
        isTakingPictureRef.current = true;
        handlePhotoCaptured(pickerResult.assets[0].uri);
      }
    } catch (e) {
      console.error('Error al seleccionar de galería:', e);
      isTakingPictureRef.current = false;
    }
  };

  // Paso 2: Preguntas confirmadas -> Ejecutar procesamiento con IA
  const handleContextConfirmed = async (contextHints) => {
    if (!photo?.uri) return;

    setAppState('processing');
    appStateRef.current = 'processing';
    progress.value = 0;
    progress.value = withTiming(90, { duration: 3200, easing: Easing.out(Easing.ease) });

    try {
      // 1. Redimensionar para velocidad y bajo consumo
      const optimized = await manipulateAsync(
        photo.uri,
        [{ resize: { width: 800 } }],
        { compress: 0.7, format: SaveFormat.JPEG, base64: true }
      );

      // 2. Analizar con Gemini inyectando el contexto culinario
      const result = await analyzeFoodImage(optimized.base64, contextHints);

      if (!result.isFood) {
        isTakingPictureRef.current = false;
        progress.value = 0;
        setAppState('idle');
        appStateRef.current = 'idle';
        setPhoto(null);
        showCustomAlert({
          title: 'Comida no detectada',
          message: 'Parece que no hay alimentos claros en la foto. Asegurate de enfocar bien el plato.',
          type: 'warning',
          confirmText: 'Entendido',
        });
        return;
      }

      // Descontar escaneo diario
      incrementDailyScans();

      baseDataRef.current = { ...result };
      if (result.portionPresets && result.portionPresets.length > 0) {
        const defaultPreset = result.portionPresets[0];
        selectedMultiplierRef.current = typeof defaultPreset.multiplier === 'number' ? defaultPreset.multiplier : 1;
        setSelectedPortionLabel(defaultPreset.label);
        setEditableData({
          ...result,
          totalCalories: Math.round(result.totalCalories * defaultPreset.multiplier),
          totalProtein: Math.round(result.totalProtein * defaultPreset.multiplier),
          totalCarbs: Math.round(result.totalCarbs * defaultPreset.multiplier),
          totalFat: Math.round(result.totalFat * defaultPreset.multiplier),
        });
      } else {
        selectedMultiplierRef.current = 1;
        setSelectedPortionLabel('100%');
        setEditableData(result);
      }

      progress.value = withTiming(100, { duration: 350 });
      setTimeout(() => {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        setAppState('result');
        appStateRef.current = 'result';
      }, 400);

    } catch (error) {
      console.error('Error al procesar imagen con contexto:', error);
      isTakingPictureRef.current = false;
      setAppState('idle');
      appStateRef.current = 'idle';
      setPhoto(null);
      showCustomAlert({
        title: 'Error de análisis',
        message: 'Ocurrió un problema al procesar la imagen con IA. Verificá tu conexión a internet.',
        type: 'danger',
        confirmText: 'Reintentar',
      });
    }
  };

  // Volver a tomar foto desde la vista de preguntas
  const handleRetake = () => {
    isTakingPictureRef.current = false;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setPhoto(null);
    setAppState('idle');
    appStateRef.current = 'idle';
  };

  // Descartar resultado
  const handleDiscard = () => {
    isTakingPictureRef.current = false;
    setAppState('idle');
    appStateRef.current = 'idle';
    setPhoto(null);
    setEditableData(null);
    baseDataRef.current = null;
    selectedMultiplierRef.current = 1;
    setSelectedPortionLabel(null);
  };

  // Guardar comida en el diario y volver
  const handleSave = () => {
    if (!editableData) return;

    isLeavingRef.current = true;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    addConsumedFood({
      name: `${editableData.mealName} (Asistido)`,
      calories: Number(editableData.totalCalories) || 0,
      protein: Number(editableData.totalProtein) || 0,
      carbs: Number(editableData.totalCarbs) || 0,
      fats: Number(editableData.totalFat) || 0,
      imageUri: photo?.uri || null,
      ingredients: editableData.ingredients || [],
    });

    handleDiscard();
    navigation.goBack();
  };

  // Solicitar permiso si no está concedido
  if (!permission) {
    return <View className="flex-1 bg-black" />;
  }

  if (!permission.granted) {
    return (
      <View className="flex-1 bg-white items-center justify-center p-6">
        <View className="w-16 h-16 rounded-full bg-orange-100 items-center justify-center mb-4">
          <Sparkles size={32} color="#F97316" />
        </View>
        <Text className="text-xl font-bold text-gray-900 text-center mb-2">
          Permiso de Cámara
        </Text>
        <Text className="text-gray-500 text-center mb-6 leading-relaxed text-sm">
          Zenit necesita acceso a tu cámara para la detección fotográfica asistida de tus comidas.
        </Text>
        <TouchableOpacity
          onPress={requestPermission}
          activeOpacity={0.88}
          className="w-full shadow-lg shadow-orange-500/20"
        >
          <LinearGradient
            colors={ZENIT_GRADIENT}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            className="py-4 rounded-2xl items-center"
          >
            <Text className="text-white font-bold text-base">Habilitar Cámara</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-black">
      {/* Vista de Cámara Nativa */}
      <CameraView style={StyleSheet.absoluteFill} facing={facing} flash={flash} mode="picture" ref={cameraRef} />

      {/* Capa de bloqueo total de la cámara activa cuando se tomó una foto */}
      {(appState === 'questions' || appState === 'processing' || appState === 'result') && (
        <View style={[StyleSheet.absoluteFill, { backgroundColor: '#000000' }]} />
      )}

      {/* 1. Vista HUD de la cámara (idle o capturing) */}
      {(appState === 'idle' || appState === 'capturing') && (
        <CameraControlsOverlay
          remainingScans={remainingScans}
          flash={flash}
          isCapturing={appState === 'capturing' || isTakingPictureRef.current}
          onToggleFlash={() => setFlash((f) => (f === 'off' ? 'on' : 'off'))}
          onBack={() => navigation.goBack()}
          onTakePicture={handleTakePicture}
          onPickImage={handlePickImageFromGallery}
          onToggleFacing={() => setFacing((f) => (f === 'back' ? 'front' : 'back'))}
          onResetDailyScans={() => {
            resetDailyScans();
            showCustomAlert({
              title: '¡Cupo reiniciado!',
              message: 'Tu cupo diario de escaneos se reinició a 8/8 para pruebas.',
              type: 'success',
              confirmText: 'Genial',
            });
          }}
        />
      )}

      {/* 2. Preguntas de Contexto Guiado (questions) */}
      {appState === 'questions' && photo && (
        <GuidedQuestionsOverlay
          photo={photo}
          onConfirmContext={handleContextConfirmed}
          onRetake={confirmDiscardQuestions}
          isDark={isDark}
        />
      )}

      {/* 3. Pantalla de carga y progreso con IA (processing) */}
      {appState === 'processing' && photo && (
        <ScanProcessingOverlay photo={photo} progress={progress} />
      )}

      {/* 4. Hoja de resultados y macros con foto de fondo (result) */}
      {appState === 'result' && editableData && photo && (
        <ScanResultModal
          photo={photo}
          editableData={editableData}
          setEditableData={setEditableData}
          baseDataRef={baseDataRef}
          selectedMultiplierRef={selectedMultiplierRef}
          selectedPortionLabel={selectedPortionLabel}
          setSelectedPortionLabel={setSelectedPortionLabel}
          isFavorite={isFavorite}
          setIsFavorite={setIsFavorite}
          onOpenCoach={() => setShowCoachChat(true)}
          onDiscard={confirmDiscardResult}
          onSave={handleSave}
          onBack={confirmDiscardResult}
          showCoachChat={showCoachChat}
          isDark={isDark}
        />
      )}

      {/* 5. Chat con el Zenit Coach */}
      <CoachChatModal
        visible={showCoachChat}
        isDark={isDark}
        editableData={editableData}
        onClose={() => setShowCoachChat(false)}
        showAlert={showCustomAlert}
        userData={{
          name: userName || 'Nacho',
          goal: userGoal || 'Ganar masa muscular (Volumen limpio)',
          macros: {
            calories: Math.max(0, (targetMacros?.calories || 2500) - (consumedMacros?.calories || 0)),
            protein: Math.max(0, (targetMacros?.protein || 150) - (consumedMacros?.protein || 0)),
            carbs: Math.max(0, (targetMacros?.carbs || 300) - (consumedMacros?.carbs || 0)),
            fats: Math.max(0, (targetMacros?.fats || 50) - (consumedMacros?.fats || 0)),
          },
        }}
      />

      {/* 6. Modal de Alertas y Errores */}
      <ZenitModalAlert
        visible={dialogConfig.visible}
        title={dialogConfig.title}
        message={dialogConfig.message}
        type={dialogConfig.type}
        confirmText={dialogConfig.confirmText}
        cancelText={dialogConfig.cancelText}
        onConfirm={dialogConfig.onConfirm}
        onCancel={dialogConfig.onCancel}
        isDark={isDark}
      />
    </View>
  );
}
