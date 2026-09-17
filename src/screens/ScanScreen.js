import React, { useState, useRef, useEffect, useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, BackHandler } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
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

// Subcomponentes modulares del escáner
import { CameraControlsOverlay } from '../components/scanner/CameraControlsOverlay';
import { ScanProcessingOverlay } from '../components/scanner/ScanProcessingOverlay';
import { ScanResultModal } from '../components/scanner/ScanResultModal';
import { CoachChatModal } from '../components/scanner/CoachChatModal';
import { BarcodeProductModal } from '../components/scanner/BarcodeProductModal';
import { getProductByBarcode } from '../services/api/foodCatalogService';

export default function ScanScreen({ navigation }) {
  const [permission, requestPermission] = useCameraPermissions();
  const cameraRef = useRef(null);

  // Tema claro (blanco) por defecto según configuración del usuario
  const isDark = false;

  // Modo de escaneo: 'photo' (Gemini IA) vs 'barcode' (Código de barras)
  const [scanMode, setScanMode] = useState('photo');
  const [unregisteredBarcode, setUnregisteredBarcode] = useState(null);
  const [isBarcodeModalVisible, setIsBarcodeModalVisible] = useState(false);

  // Estados de la máquina del escáner
  const [appState, setAppState] = useState('idle'); // 'idle' | 'capturing' | 'processing' | 'result'
  const [photo, setPhoto] = useState(null);
  const [facing, setFacing] = useState('back');
  const [flash, setFlash] = useState('off');
  const [editableData, setEditableData] = useState(null);
  const [isFavorite, setIsFavorite] = useState(false);
  const [showCoachChat, setShowCoachChat] = useState(false);
  const [selectedPortionLabel, setSelectedPortionLabel] = useState(null);

  const baseDataRef = useRef(null);
  const selectedMultiplierRef = useRef(1);
  const progress = useSharedValue(0);

  // Datos globales del usuario y macros desde Zustand
  const addConsumedFood = useUserStore((state) => state.addConsumedFood);
  const addCustomProduct = useUserStore((state) => state.addCustomProduct);
  const targetMacros = useUserStore((state) => state.targetMacros);
  const consumedMacros = useUserStore((state) => state.consumedMacros);
  const userName = useUserStore((state) => state.name);
  const userGoal = useUserStore((state) => state.goal);
  const getRemainingScans = useUserStore((state) => state.getRemainingScans);
  const incrementDailyScans = useUserStore((state) => state.incrementDailyScans);
  const resetDailyScans = useUserStore((state) => state.resetDailyScans);
  const getRemainingCoachInteractions = useUserStore((state) => state.getRemainingCoachInteractions);
  const incrementCoachInteractions = useUserStore((state) => state.incrementCoachInteractions);
  const resetDailyCoachInteractions = useUserStore((state) => state.resetDailyCoachInteractions);

  const remainingScans = getRemainingScans ? getRemainingScans(8) : 8;
  const remainingCoachInteractions = getRemainingCoachInteractions ? getRemainingCoachInteractions(8) : 8;

  const appStateRef = useRef(appState);
  useEffect(() => {
    appStateRef.current = appState;
  }, [appState]);

  const showCoachChatRef = useRef(showCoachChat);
  useEffect(() => {
    showCoachChatRef.current = showCoachChat;
  }, [showCoachChat]);

  const navigationRef = useRef(navigation);
  useEffect(() => {
    navigationRef.current = navigation;
  }, [navigation]);

  const isLeavingRef = useRef(false);
  const isTakingPictureRef = useRef(false);
  const isProcessingBarcodeRef = useRef(false);

  const isBarcodeModalVisibleRef = useRef(false);
  useEffect(() => {
    isBarcodeModalVisibleRef.current = isBarcodeModalVisible;
  }, [isBarcodeModalVisible]);

  // Precalentar conexión DNS/TLS con Google Gemini apenas se monta la pantalla
  useEffect(() => {
    prewarmVisionService();
  }, []);

  // Modal de Alertas y Confirmaciones Zenit
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
        setDialogConfig((prev) => ({ ...prev, visible: false }));
        if (onConfirm) onConfirm();
      },
      onCancel: () => {
        setDialogConfig((prev) => ({ ...prev, visible: false }));
        if (onCancel) onCancel();
      },
    });
  };

  const hasConsumedCoachForCurrentFoodRef = useRef(false);

  // Resetear por completo el estado del escáner
  const resetScanState = () => {
    isTakingPictureRef.current = false;
    isProcessingBarcodeRef.current = false;
    hasConsumedCoachForCurrentFoodRef.current = false;
    setIsBarcodeModalVisible(false);
    setUnregisteredBarcode(null);
    setPhoto(null);
    setEditableData(null);
    setSelectedPortionLabel(null);
    baseDataRef.current = null;
    selectedMultiplierRef.current = 1;
    setIsFavorite(false);
    setShowCoachChat(false);
    progress.value = 0;
    setAppState('idle');
    appStateRef.current = 'idle';
  };

  // Cada vez que la pantalla reciba el foco (al abrirla o volver de otra pestaña),
  // se resetea por completo y vuelve al modo Foto IA por defecto.
  useFocusEffect(
    useCallback(() => {
      resetScanState();
      setScanMode('photo');
    }, [])
  );

  // Abrir chat con el Coach controlando el límite de 8 interacciones diarias
  const handleOpenCoachChat = () => {
    if (remainingCoachInteractions <= 0 && !hasConsumedCoachForCurrentFoodRef.current) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      showCustomAlert({
        title: 'Límite de Coach alcanzado',
        message: 'Ya utilizaste tus 8 consultas con el Coach hoy. Mañana a las 00:00 hs se renovará tu cupo para que sigas recibiendo asesoramiento nutricional.',
        type: 'warning',
        confirmText: 'Entendido',
      });
      return;
    }

    if (!hasConsumedCoachForCurrentFoodRef.current) {
      incrementCoachInteractions();
      hasConsumedCoachForCurrentFoodRef.current = true;
    }

    setShowCoachChat(true);
  };

  // Confirmar salida a la pantalla principal
  const confirmExitToHome = () => {
    showCustomAlert({
      title: '¿Volver al inicio?',
      message: '¿Estás seguro de que deseas volver a la pantalla principal? Se perderá todo el progreso del escaneo actual.',
      type: 'warning',
      confirmText: 'Sí, salir',
      cancelText: 'Continuar aquí',
      onConfirm: () => {
        isLeavingRef.current = true;
        resetScanState();
        if (navigationRef.current?.navigate) navigationRef.current.navigate('Home');
        else if (navigationRef.current?.goBack) navigationRef.current.goBack();
      },
    });
  };

  // Acción de retroceso inteligente
  const handleBackAction = () => {
    if (isBarcodeModalVisibleRef.current) {
      setIsBarcodeModalVisible(false);
      setUnregisteredBarcode(null);
      isProcessingBarcodeRef.current = false;
      return;
    }
    if (showCoachChatRef.current) {
      setShowCoachChat(false);
      return;
    }
    if (appStateRef.current !== 'idle') {
      confirmExitToHome();
      return;
    }
    if (navigation?.navigate) navigation.navigate('Home');
    else if (navigation?.goBack) navigation.goBack();
  };

  // Interceptar botón físico y gestos de atrás en Android
  useEffect(() => {
    const onBackPress = () => {
      if (isBarcodeModalVisibleRef.current) {
        setIsBarcodeModalVisible(false);
        setUnregisteredBarcode(null);
        isProcessingBarcodeRef.current = false;
        return true;
      }
      if (showCoachChatRef.current) {
        setShowCoachChat(false);
        return true;
      }
      if (appStateRef.current !== 'idle') {
        confirmExitToHome();
        return true;
      }
      if (navigationRef.current?.navigate) {
        navigationRef.current.navigate('Home');
        return true;
      }
      return false;
    };

    const subscription = BackHandler.addEventListener('hardwareBackPress', onBackPress);
    return () => subscription.remove();
  }, []);

  // Mapear producto de base de datos a formato de resultado Gemini para ScanResultModal
  const mapProductToScanResult = (product) => {
    const cals = Number(product.calories) || 0;
    const prot = Number(product.protein) || 0;
    const carbs = Number(product.carbs) || 0;
    const fats = Number(product.fats) || 0;
    const serving = product.servingSize || product.unitName || '1 porción (100g)';

    const portionPresets = [
      { label: 'Media porción (50%)', multiplier: 0.5 },
      { label: `${serving} (100%)`, multiplier: 1 },
      { label: 'Porción y media (150%)', multiplier: 1.5 },
      { label: 'Doble porción (200%)', multiplier: 2 },
    ];

    const resultData = {
      isFood: true,
      mealName: product.name || 'Producto Escaneado',
      totalCalories: cals,
      totalProtein: prot,
      totalCarbs: carbs,
      totalFat: fats,
      servingType: 'portion',
      defaultServingLabel: `${serving} (100%)`,
      portionPresets,
      ingredients: [
        {
          name: product.name || 'Producto',
          grams: product.unitGrams || 100,
          calories: cals,
          protein: prot,
          carbs: carbs,
          fat: fats,
        },
      ],
    };

    baseDataRef.current = { ...resultData };
    selectedMultiplierRef.current = 1;
    setSelectedPortionLabel(`${serving} (100%)`);
    setEditableData(resultData);
    setPhoto({
      uri: product.image || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=600',
    });
    setAppState('result');
    appStateRef.current = 'result';
    isProcessingBarcodeRef.current = false;
  };

  // Detección y procesamiento de código de barras
  const handleBarcodeScanned = async ({ data }) => {
    if (
      isProcessingBarcodeRef.current ||
      appStateRef.current !== 'idle' ||
      isBarcodeModalVisibleRef.current
    ) {
      return;
    }
    if (!data || typeof data !== 'string') return;

    isProcessingBarcodeRef.current = true;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    try {
      const barcodeClean = data.trim();
      const match = await getProductByBarcode(barcodeClean);

      if (match) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        mapProductToScanResult(match);
      } else {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
        setUnregisteredBarcode(barcodeClean);
        setIsBarcodeModalVisible(true);
      }
    } catch (err) {
      console.error('Error al consultar código de barras:', err);
      showCustomAlert({
        title: 'Error de escaneo',
        message: 'Ocurrió un error al buscar este producto. Por favor intentá nuevamente.',
        type: 'danger',
        confirmText: 'Reintentar',
      });
      isProcessingBarcodeRef.current = false;
    }
  };

  // Guardar producto nuevo registrado desde el escáner
  const handleSaveUnregisteredProduct = (newProduct) => {
    addCustomProduct(newProduct);
    setIsBarcodeModalVisible(false);
    setUnregisteredBarcode(null);
    mapProductToScanResult(newProduct);
  };

  // Pipeline unificado de procesamiento para Cámara y Galería
  const processImageUri = async (uri) => {
    if (remainingScans <= 0) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      showCustomAlert({
        title: 'Límite diario alcanzado',
        message: 'Ya utilizaste tus 8 escaneos de hoy. Mañana a las 00:00 hs se renovará tu cupo para que sigas registrando tus comidas.',
        type: 'warning',
        confirmText: 'Entendido',
      });
      return;
    }

    setPhoto({ uri });
    setAppState('processing');
    appStateRef.current = 'processing';
    progress.value = 0;
    progress.value = withTiming(90, { duration: 3500, easing: Easing.out(Easing.ease) });

    try {
      // 1. Redimensionar a max 800px ancho (~45KB) para inferencia instantánea
      const optimized = await manipulateAsync(
        uri,
        [{ resize: { width: 800 } }],
        { compress: 0.7, format: SaveFormat.JPEG, base64: true }
      );

      const result = await analyzeFoodImage(optimized.base64);

      if (!result.isFood) {
        progress.value = 0;
        setAppState('idle');
        appStateRef.current = 'idle';
        setPhoto(null);
        showCustomAlert({
          title: 'Comida no detectada',
          message: 'Parece que no hay alimentos o bebidas en la foto. Asegurate de enfocar bien el plato o producto.',
          type: 'warning',
          confirmText: 'Entendido',
        });
        return;
      }

      // Descontamos escaneo diario al verificar que fue comida válida
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
      console.error('Error al procesar imagen:', error);
      setAppState('idle');
      appStateRef.current = 'idle';
      setPhoto(null);
      showCustomAlert({
        title: 'Error de análisis',
        message: 'Ocurrió un problema al procesar la imagen. Verificá tu conexión e intentá de nuevo.',
        type: 'danger',
        confirmText: 'Reintentar',
      });
    }
  };

  // Disparo de la cámara con bloqueo síncrono multi-tap
  const handleTakePicture = async () => {
    if (!cameraRef.current || isTakingPictureRef.current || appStateRef.current !== 'idle') return;

    if (remainingScans <= 0) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      showCustomAlert({
        title: 'Límite diario alcanzado',
        message: 'Ya utilizaste tus 8 escaneos de hoy. Mañana a las 00:00 hs se renovará tu cupo para que sigas registrando tus comidas.',
        type: 'warning',
        confirmText: 'Entendido',
      });
      return;
    }

    isTakingPictureRef.current = true;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setAppState('capturing');
    appStateRef.current = 'capturing';

    try {
      const photoData = await cameraRef.current.takePictureAsync({ quality: 0.8, skipProcessing: true });
      await processImageUri(photoData.uri);
    } catch (error) {
      console.error('Error al capturar foto:', error);
      isTakingPictureRef.current = false;
      setAppState('idle');
      appStateRef.current = 'idle';
    }
  };

  // Selección de foto desde la Galería
  const handlePickImageFromGallery = async () => {
    if (isTakingPictureRef.current || appStateRef.current !== 'idle') return;

    if (remainingScans <= 0) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      showCustomAlert({
        title: 'Límite diario alcanzado',
        message: 'Ya utilizaste tus 8 escaneos de hoy. Mañana a las 00:00 hs se renovará tu cupo para que sigas registrando tus comidas.',
        type: 'warning',
        confirmText: 'Entendido',
      });
      return;
    }

    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permissionResult.granted) {
        showCustomAlert({
          title: 'Permiso necesario',
          message: 'Zenit necesita acceso a tu galería para que puedas seleccionar fotos de tus comidas.',
          type: 'warning',
          confirmText: 'Entendido',
        });
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: false,
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        await processImageUri(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Error al seleccionar de galería:', error);
    }
  };

  // Guardar comida en el Store y regresar
  const handleSave = () => {
    if (!editableData) return;

    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    addConsumedFood({
      name: editableData.mealName || 'Comida escaneada',
      calories: Number(editableData.totalCalories) || 0,
      protein: Number(editableData.totalProtein) || 0,
      carbs: Number(editableData.totalCarbs) || 0,
      fats: Number(editableData.totalFat) || 0,
      imageUri: photo?.uri || null,
      ingredients: editableData.ingredients || [],
    });

    isLeavingRef.current = true;
    resetScanState();
    if (navigation?.navigate) navigation.navigate('Home');
    else if (navigation?.goBack) navigation.goBack();
  };

  // Descartar comida solicitando confirmación
  const handleDiscard = () => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } catch (e) {}

    showCustomAlert({
      title: '¿Descartar comida?',
      message: 'Se perderán los macros calculados y la foto escaneada. No se guardará ningún alimento en tu día.',
      type: 'danger',
      confirmText: 'Sí, descartar',
      cancelText: 'Seguir editando',
      onConfirm: () => {
        isLeavingRef.current = true;
        resetScanState();
        if (navigationRef.current?.navigate) navigationRef.current.navigate('Home');
        else if (navigationRef.current?.goBack) navigationRef.current.goBack();
      },
    });
  };

  // Estado de carga de permisos de cámara
  if (!permission) {
    return <View className="flex-1 bg-black" />;
  }

  // Si no hay permiso, pantalla de solicitud
  if (!permission.granted) {
    return (
      <View className="flex-1 bg-black items-center justify-center px-8">
        <View className="w-20 h-20 bg-[#F97316]/20 rounded-full items-center justify-center mb-6">
          <Sparkles size={32} color="#F97316" />
        </View>
        <Text className="text-white text-2xl font-bold text-center mb-3 tracking-tight">
          Activá tu cámara
        </Text>
        <Text className="text-gray-400 text-center mb-10 text-base leading-6">
          Zenit necesita acceso a tu cámara para poder escanear tus comidas y calcular los macros automáticamente.
        </Text>
        <TouchableOpacity onPress={requestPermission} activeOpacity={0.8}>
          <LinearGradient
            colors={ZENIT_GRADIENT}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={{
              paddingVertical: 16,
              paddingHorizontal: 40,
              borderRadius: 999,
              shadowColor: '#F97316',
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.3,
              shadowRadius: 8,
              elevation: 5,
            }}
          >
            <Text className="text-white font-bold text-lg text-center">
              Otorgar Permiso
            </Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-black">
      {/* Vista de Cámara Nativa */}
      <CameraView
        style={StyleSheet.absoluteFill}
        facing={facing}
        flash={flash}
        mode="picture"
        ref={cameraRef}
        barcodeScannerSettings={
          scanMode === 'barcode'
            ? {
                barcodeTypes: [
                  'ean13',
                  'ean8',
                  'upc_a',
                  'upc_e',
                  'code128',
                  'code39',
                  'qr',
                ],
              }
            : undefined
        }
        onBarcodeScanned={
          scanMode === 'barcode' && !isBarcodeModalVisible && appState === 'idle'
            ? handleBarcodeScanned
            : undefined
        }
      />

      {/* 1. Vista HUD de la cámara (idle o capturing) */}
      {(appState === 'idle' || appState === 'capturing') && (
        <CameraControlsOverlay
          remainingScans={remainingScans}
          flash={flash}
          isCapturing={appState === 'capturing' || isTakingPictureRef.current}
          scanMode={scanMode}
          onSelectScanMode={(mode) => {
            setScanMode(mode);
            isProcessingBarcodeRef.current = false;
          }}
          onToggleFlash={() => setFlash((f) => (f === 'off' ? 'on' : 'off'))}
          onBack={handleBackAction}
          onTakePicture={handleTakePicture}
          onPickImage={handlePickImageFromGallery}
          onToggleFacing={() => setFacing((f) => (f === 'back' ? 'front' : 'back'))}
          onResetDailyScans={() => {
            resetDailyScans();
            resetDailyCoachInteractions();
            showCustomAlert({
              title: '¡Cupos reiniciados!',
              message: 'Tus cupos diarios de escaneos IA (8/8) e interacciones con el Coach (8/8) se reiniciaron para testing.',
              type: 'success',
              confirmText: 'Genial',
            });
          }}
        />
      )}

      {/* 2. Pantalla de carga y progreso con IA (processing) */}
      {appState === 'processing' && photo && (
        <ScanProcessingOverlay photo={photo} progress={progress} />
      )}

      {/* 3. Hoja de resultados y macros (result) */}
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
          onOpenCoach={handleOpenCoachChat}
          onDiscard={handleDiscard}
          onSave={handleSave}
          onBack={handleBackAction}
          showCoachChat={showCoachChat}
          isDark={isDark}
        />
      )}

      {/* 4. Chat Conversacional con el Zenit Coach */}
      <CoachChatModal
        visible={showCoachChat}
        isDark={isDark}
        editableData={editableData}
        remainingCoachInteractions={remainingCoachInteractions}
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

      {/* 5. Modal para producto con código de barras no registrado */}
      <BarcodeProductModal
        visible={isBarcodeModalVisible}
        barcode={unregisteredBarcode}
        onClose={() => {
          setIsBarcodeModalVisible(false);
          setUnregisteredBarcode(null);
          setTimeout(() => {
            isProcessingBarcodeRef.current = false;
          }, 800);
        }}
        onSaveProduct={handleSaveUnregisteredProduct}
        isDark={isDark}
      />

      {/* 6. Alertas y Modales del Sistema Zenit */}
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