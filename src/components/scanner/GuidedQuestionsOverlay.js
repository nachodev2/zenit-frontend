import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  Platform,
  Image,
  TouchableWithoutFeedback,
  Keyboard,
  StyleSheet,
  ScrollView,
  Dimensions,
  BackHandler,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  Sparkles,
  ChevronRight,
  ChevronLeft,
  RotateCcw,
  X,
} from 'lucide-react-native';
import Animated, {
  SlideInDown,
  Easing,
  useSharedValue,
  useAnimatedStyle,
  withTiming,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';

import { ZENIT_GRADIENT } from '../../constants/theme';

const STEPS_DATA = [
  {
    step: 1,
    title: '¿Qué comida es?',
    subtitle: 'Nombre del plato o producto empaquetado',
    placeholder: 'Ej: Milanesa con puré, Alfajor Havanna, etc.',
    required: true,
    quickTags: ['Carne con ensalada', 'Milanesa con puré', 'Pasta o arroz', 'Snack / Barra'],
  },
  {
    step: 2,
    title: '¿Cómo se preparó?',
    subtitle: 'Cocción, aceites o aderezos agregados',
    placeholder: 'Ej: Al horno sin aceite, frito con mayonesa...',
    required: false,
    quickTags: ['A la plancha', 'Al horno', 'Frito en aceite', 'Sin agregados / Crudo'],
  },
  {
    step: 3,
    title: '¿Qué porción calculás?',
    subtitle: 'Tamaño aproximado, unidades o gramaje',
    placeholder: 'Ej: 1 plato estándar (~300g), 2 unidades...',
    required: false,
    defaultFallback: '1 plato estándar (~300g)',
    quickTags: ['1 plato (~300g)', 'Abundante (~500g)', 'Media porción (~150g)', 'Envase entero'],
  },
];

export function GuidedQuestionsOverlay({
  photo,
  onConfirmContext,
  onRetake,
  isDark = false,
}) {
  const insets = useSafeAreaInsets();
  const bottomInset = Math.max(insets.bottom, 16);

  const [currentStep, setCurrentStep] = useState(1);
  const [answers, setAnswers] = useState({
    1: '',
    2: '',
    3: '',
  });
  const [errorMessage, setErrorMessage] = useState('');
  const inputRef = useRef(null);

  // Animación del teclado precisa para elevar la modal sin huecos
  const keyboardHeight = useSharedValue(0);

  useEffect(() => {
    const onShow = (e) => {
      const h = e?.endCoordinates?.height || 0;
      // En Android edge-to-edge el teclado cubre el área de insets.bottom
      const target = Platform.OS === 'ios' ? h : Math.max(0, h - insets.bottom);
      keyboardHeight.value = withTiming(target, {
        duration: Platform.OS === 'ios' ? (e?.duration || 250) : 180,
        easing: Easing.out(Easing.cubic),
      });
    };

    const onHide = (e) => {
      keyboardHeight.value = withTiming(0, {
        duration: Platform.OS === 'ios' ? (e?.duration || 200) : 180,
        easing: Easing.out(Easing.cubic),
      });
    };

    const showSub = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
      onShow
    );
    const hideSub = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide',
      onHide
    );

    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, [insets.bottom]);

  const animatedCardStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: -keyboardHeight.value }],
  }));

  const activeStepData = STEPS_DATA[currentStep - 1];
  const currentVal = answers[currentStep] || '';

  // Limpiar mensaje de error al cambiar de paso sin desenfocar el teclado
  useEffect(() => {
    setErrorMessage('');
  }, [currentStep]);

  const handleTextChange = (text) => {
    if (errorMessage) setErrorMessage('');
    if (text.length <= 120) {
      setAnswers((prev) => ({ ...prev, [currentStep]: text }));
    }
  };

  const handleClear = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setAnswers((prev) => ({ ...prev, [currentStep]: '' }));
    setErrorMessage('');
  };

  const handleApplyTag = (tag) => {
    Haptics.selectionAsync();
    setErrorMessage('');
    setAnswers((prev) => {
      const existing = prev[currentStep]?.trim();
      if (!existing) return { ...prev, [currentStep]: tag };
      return { ...prev, [currentStep]: `${existing}, ${tag.toLowerCase()}` };
    });
  };

  const validateAndProceed = () => {
    const trimmed = currentVal.trim();

    // Validación estricta para el paso 1 (Nombre de la comida)
    if (currentStep === 1) {
      if (trimmed.length < 2) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
        setErrorMessage('Por favor ingresá qué comida o plato estás registrando.');
        return;
      }
    }

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    if (currentStep < 3) {
      setCurrentStep((prev) => prev + 1);
    } else {
      // Finalizar y enviar a Gemini con valores limpios
      onConfirmContext({
        mealDescription: answers[1]?.trim() || '',
        preparationAndExtras: answers[2]?.trim() || 'Cocción estándar, sin agregados',
        portionDescription: answers[3]?.trim() || '1 plato estándar (~300g)',
      });
    }
  };

  const handleBack = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setErrorMessage('');
    if (currentStep > 1) {
      setCurrentStep((prev) => prev - 1);
    } else {
      onRetake?.();
    }
  };

  // Interceptar botón atrás y gestos de Android para retroceso fluido entre pasos
  useEffect(() => {
    const onBackPress = () => {
      if (currentStep > 1) {
        handleBack();
        return true;
      }
      onRetake?.();
      return true;
    };

    const subscription = BackHandler.addEventListener('hardwareBackPress', onBackPress);
    return () => subscription.remove();
  }, [currentStep, onRetake]);

  const handleSkipOptional = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setErrorMessage('');
    if (currentStep === 2) {
      setAnswers((prev) => ({ ...prev, 2: 'Sin agregados / cocción simple' }));
      setCurrentStep(3);
    } else if (currentStep === 3) {
      setAnswers((prev) => ({ ...prev, 3: '1 plato estándar (~300g)' }));
      onConfirmContext({
        mealDescription: answers[1]?.trim() || '',
        preparationAndExtras: answers[2]?.trim() || 'Sin agregados / cocción simple',
        portionDescription: '1 plato estándar (~300g)',
      });
    }
  };

  const isStep1Valid = currentStep !== 1 || currentVal.trim().length >= 2;

  return (
    <View style={[StyleSheet.absoluteFill, { backgroundColor: '#000000' }]}>
      {/* 1. FOTO TOMADA CON 100% DE OPACIDAD (TAPA COMPLETAMENTE LA CÁMARA) */}
      {photo?.uri ? (
        <Image
          source={{ uri: photo.uri }}
          style={[
            StyleSheet.absoluteFill,
            { width: '100%', height: '100%', opacity: 1, resizeMode: 'cover' },
          ]}
        />
      ) : null}

      {/* 2. VELO OSCURO SUAVE PARA CONTRASTE */}
      <View
        style={[
          StyleSheet.absoluteFill,
          { backgroundColor: 'rgba(0,0,0,0.38)' },
        ]}
      />

      {/* 3. CONTENEDOR PRINCIPAL FLUIDO CON TOUCHABLE DISMISS */}
      <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
        <View style={{ flex: 1, justifyContent: 'flex-end' }}>
          {/* PANEL CARD ESTILO ZENIT ANIMADO CON EL TECLADO */}
          <Animated.View
            entering={SlideInDown.duration(280).easing(Easing.out(Easing.cubic))}
            style={[
              {
                backgroundColor: isDark ? '#18181B' : '#FFFFFF',
                borderTopLeftRadius: 28,
                borderTopRightRadius: 28,
                paddingTop: 18,
                paddingHorizontal: 22,
                paddingBottom: bottomInset + 12,
                shadowColor: '#000',
                shadowOffset: { width: 0, height: -6 },
                shadowOpacity: 0.16,
                shadowRadius: 18,
                elevation: 12,
              },
              animatedCardStyle,
            ]}
          >
            {/* BLOQUEO SÓLIDO INFERIOR: Sella el notch de navegación/gestos para evitar transparencias */}
            <View
              style={{
                position: 'absolute',
                bottom: -150,
                left: 0,
                right: 0,
                height: 150,
                backgroundColor: isDark ? '#18181B' : '#FFFFFF',
              }}
            />

            {/* HEADER: STEPPER PILLS Y REINTENTAR */}
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                {[1, 2, 3].map((s) => (
                  <View
                    key={s}
                    style={{
                      width: s === currentStep ? 22 : 7,
                      height: 7,
                      borderRadius: 4,
                      backgroundColor: s === currentStep ? '#F97316' : (s < currentStep ? '#FED7AA' : '#E5E7EB'),
                    }}
                  />
                ))}
                <Text style={{ fontSize: 11, fontWeight: '700', color: '#9CA3AF', marginLeft: 6, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                  Paso {currentStep} de 3
                </Text>
              </View>

              <TouchableOpacity
                onPress={onRetake}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 4,
                  paddingHorizontal: 10,
                  paddingVertical: 5,
                  borderRadius: 10,
                  backgroundColor: isDark ? '#27272A' : '#F3F4F6',
                }}
              >
                <RotateCcw size={11} color="#6B7280" />
                <Text style={{ fontSize: 11, color: '#6B7280', fontWeight: '600' }}>Nueva foto</Text>
              </TouchableOpacity>
            </View>

            {/* CONTENIDO DEL PASO: INPUT PERMANENTEMENTE MONTADO (CERO SALTOS DE TECLADO) */}
            <View style={{ marginBottom: 16 }}>
              <Text style={{ fontSize: 19, fontWeight: '800', color: isDark ? '#FFFFFF' : '#111827', letterSpacing: -0.3 }}>
                {activeStepData.title}
              </Text>
              <Text style={{ fontSize: 12, color: '#6B7280', marginTop: 2, marginBottom: 14 }}>
                {activeStepData.subtitle}
              </Text>

              {/* INPUT ZENIT CLEAN (MANTENIDO SIN DESMONTAR ENTRE PASOS) */}
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  backgroundColor: isDark ? '#27272A' : '#F9FAFB',
                  borderWidth: 1.5,
                  borderColor: errorMessage
                    ? '#EF4444'
                    : currentVal.trim().length > 0
                    ? '#F97316'
                    : (isDark ? '#3F3F46' : '#E5E7EB'),
                  borderRadius: 16,
                  paddingHorizontal: 14,
                  paddingVertical: 10,
                }}
              >
                <TextInput
                  ref={inputRef}
                  value={currentVal}
                  onChangeText={handleTextChange}
                  placeholder={activeStepData.placeholder}
                  placeholderTextColor={isDark ? '#71717A' : '#9CA3AF'}
                  style={{
                    flex: 1,
                    fontSize: 14,
                    color: isDark ? '#FFFFFF' : '#111827',
                    padding: 0,
                    margin: 0,
                  }}
                  returnKeyType={currentStep === 3 ? 'done' : 'next'}
                  onSubmitEditing={validateAndProceed}
                />

                {currentVal.length > 0 && (
                  <TouchableOpacity
                    onPress={handleClear}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    style={{
                      width: 20,
                      height: 20,
                      borderRadius: 10,
                      backgroundColor: isDark ? '#3F3F46' : '#E5E7EB',
                      alignItems: 'center',
                      justifyContent: 'center',
                      marginLeft: 8,
                    }}
                  >
                    <X size={12} color="#6B7280" />
                  </TouchableOpacity>
                )}
              </View>

              {/* MENSAJE DE VALIDACIÓN */}
              {errorMessage ? (
                <Text style={{ fontSize: 11, color: '#EF4444', fontWeight: '600', marginTop: 6, marginLeft: 2 }}>
                  • {errorMessage}
                </Text>
              ) : null}

              {/* SUGERENCIAS RÁPIDAS ZENIT DEL PASO ACTIVO */}
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 12 }}>
                {activeStepData.quickTags.map((tag) => (
                  <TouchableOpacity
                    key={`${currentStep}-${tag}`}
                    onPress={() => handleApplyTag(tag)}
                    activeOpacity={0.7}
                    style={{
                      backgroundColor: isDark ? '#27272A' : '#F3F4F6',
                      paddingHorizontal: 10,
                      paddingVertical: 6,
                      borderRadius: 12,
                      borderWidth: 1,
                      borderColor: isDark ? '#3F3F46' : '#E5E7EB',
                    }}
                  >
                    <Text style={{ fontSize: 11, color: isDark ? '#D4D4D8' : '#4B5563', fontWeight: '600' }}>
                      + {tag}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* BOTONES INFERIORES */}
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              {/* BOTÓN ATRÁS (Si paso > 1 vuelve de paso, si paso 1 consulta para descartar) */}
              <TouchableOpacity
                onPress={handleBack}
                activeOpacity={0.8}
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: 16,
                  backgroundColor: isDark ? '#27272A' : '#F3F4F6',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <ChevronLeft size={22} color={isDark ? '#9CA3AF' : '#374151'} />
              </TouchableOpacity>

              {/* BOTÓN OMITIR (Solo para pasos opcionales 2 y 3 si están vacíos) */}
              {currentStep > 1 && currentVal.trim().length === 0 && (
                <TouchableOpacity
                  onPress={handleSkipOptional}
                  activeOpacity={0.8}
                  style={{
                    paddingHorizontal: 14,
                    height: 48,
                    borderRadius: 16,
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: isDark ? '#27272A' : '#F3F4F6',
                  }}
                >
                  <Text style={{ fontSize: 12, fontWeight: '700', color: '#6B7280' }}>
                    Omitir
                  </Text>
                </TouchableOpacity>
              )}

              {/* BOTÓN PRINCIPAL (SIGUIENTE O CALCULAR MACROS) */}
              <TouchableOpacity
                onPress={validateAndProceed}
                activeOpacity={0.88}
                disabled={!isStep1Valid}
                style={{
                  flex: 1,
                  opacity: isStep1Valid ? 1 : 0.45,
                  shadowColor: '#F97316',
                  shadowOffset: { width: 0, height: 4 },
                  shadowOpacity: isStep1Valid ? 0.25 : 0,
                  shadowRadius: 8,
                  elevation: isStep1Valid ? 3 : 0,
                }}
              >
                <LinearGradient
                  colors={ZENIT_GRADIENT}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={{
                    height: 48,
                    borderRadius: 16,
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 8,
                  }}
                >
                  {currentStep < 3 ? (
                    <>
                      <Text style={{ color: 'white', fontWeight: '700', fontSize: 14 }}>
                        Siguiente
                      </Text>
                      <ChevronRight size={18} color="white" />
                    </>
                  ) : (
                    <>
                      <Sparkles size={16} color="white" />
                      <Text style={{ color: 'white', fontWeight: '700', fontSize: 14 }}>
                        Calcular macros con IA
                      </Text>
                    </>
                  )}
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </Animated.View>
        </View>
      </TouchableWithoutFeedback>
    </View>
  );
}
