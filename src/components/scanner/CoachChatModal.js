import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  PanResponder,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import {
  ChevronLeft,
  Sparkles,
  Send,
  Mic,
  Trash2,
  Lock,
  Play,
  Pause,
  ChevronDown,
  ChevronUp,
  FileText,
} from 'lucide-react-native';
import Animated, {
  FadeIn,
  FadeOut,
  SlideInRight,
  SlideOutRight,
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withRepeat,
  Easing,
  withSequence,
  withDelay,
  LinearTransition,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { Audio } from 'expo-av';
import * as SpeechRecognition from 'expo-speech-recognition';

import { ZENIT_GRADIENT } from '../../constants/theme';
import { chatWithCoach, generateInitialCoachWidgets } from '../../services/ai/geminiVisionService';

const sendButtonShadow = {
  shadowColor: '#F97316',
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.3,
  shadowRadius: 4,
  elevation: 3,
};

const userBubbleShadow = {
  shadowColor: '#F97316',
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.2,
  shadowRadius: 4,
  elevation: 2,
};

const createChatStyles = (isDark) =>
  StyleSheet.create({
    overlay: { ...StyleSheet.absoluteFillObject, zIndex: 100, backgroundColor: isDark ? '#0A0A0A' : '#ffffff' },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 16,
      paddingBottom: 16,
      paddingTop: 8,
      borderBottomWidth: 1,
      borderBottomColor: isDark ? '#111111' : '#F3F4F6',
    },
    headerTitle: { flexDirection: 'row', alignItems: 'center' },
    headerText: { color: isDark ? 'white' : '#111827', fontWeight: 'bold', fontSize: 18, marginLeft: 8 },
    iconBtn: {
      width: 40,
      height: 40,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: isDark ? '#111111' : '#F9FAFB',
      borderRadius: 20,
      borderWidth: 1,
      borderColor: isDark ? '#1F2937' : '#E5E7EB',
    },
    scroll: { flex: 1, paddingHorizontal: 16, paddingTop: 24 },
    messageRowAsst: { flexDirection: 'row', alignItems: 'flex-end', marginBottom: 16 },
    messageRowUser: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'flex-end', marginBottom: 16 },
    avatar: {
      width: 32,
      height: 32,
      borderRadius: 16,
      backgroundColor: 'rgba(249, 115, 22, 0.1)',
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 4,
      marginRight: 8,
      borderWidth: 1,
      borderColor: 'rgba(249, 115, 22, 0.3)',
    },
    avatarSpacer: { width: 32, marginRight: 8 },
    bubbleAsst: {
      backgroundColor: isDark ? '#111111' : '#F9FAFB',
      padding: 16,
      borderRadius: 24,
      borderBottomLeftRadius: 4,
      borderWidth: 1,
      borderColor: isDark ? '#1F2937' : '#F3F4F6',
      maxWidth: '85%',
    },
    bubbleUser: { backgroundColor: '#F97316', padding: 16, borderRadius: 24, borderBottomRightRadius: 4, maxWidth: '85%' },
    bubbleTextAsst: { color: isDark ? '#E5E7EB' : '#1F2937', fontSize: 16, lineHeight: 24 },
    bubbleTextUser: { color: 'white', fontSize: 16, lineHeight: 24 },
    widgetTitle: { color: isDark ? '#E5E7EB' : '#111827', fontSize: 16, fontWeight: '700', marginBottom: 12 },
    widgetDesc: { color: isDark ? '#9CA3AF' : '#4B5563', fontSize: 13, lineHeight: 20 },
    widgetBars: { flexDirection: 'row', gap: 4, marginBottom: 12 },
    widgetBarActive: { flex: 1, height: 6, backgroundColor: '#F97316', borderRadius: 3 },
    widgetBarInactive: { flex: 1, height: 6, backgroundColor: isDark ? '#1F2937' : '#E5E7EB', borderRadius: 3 },
    inputContainer: {
      paddingHorizontal: 16,
      paddingVertical: 12,
      borderTopWidth: 1,
      borderTopColor: isDark ? '#111111' : '#F3F4F6',
      backgroundColor: isDark ? '#0A0A0A' : '#ffffff',
    },
    inputInner: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: isDark ? '#111111' : '#F9FAFB',
      borderWidth: 1,
      borderColor: isDark ? '#1F2937' : '#E5E7EB',
      borderRadius: 999,
      paddingLeft: 20,
      paddingRight: 6,
      paddingVertical: 6,
    },
    textInput: { flex: 1, color: isDark ? 'white' : '#111827', fontSize: 16, paddingVertical: 12, margin: 0 },
    sendBtn: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
    micBtn: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: isDark ? '#1F2937' : '#E5E7EB',
      alignItems: 'center',
      justifyContent: 'center',
      marginLeft: 8,
    },
  });

const chatStylesDark = createChatStyles(true);
const chatStylesLight = createChatStyles(false);
const getChatStyles = (isDark) => (isDark ? chatStylesDark : chatStylesLight);

const TypingIndicator = React.memo(({ isDark }) => {
  const dot1 = useSharedValue(0);
  const dot2 = useSharedValue(0);
  const dot3 = useSharedValue(0);

  useEffect(() => {
    const animateDot = (dot, delay) => {
      dot.value = withDelay(
        delay,
        withRepeat(
          withSequence(
            withTiming(-5, { duration: 300, easing: Easing.inOut(Easing.ease) }),
            withTiming(0, { duration: 300, easing: Easing.inOut(Easing.ease) })
          ),
          -1,
          true
        )
      );
    };
    animateDot(dot1, 0);
    animateDot(dot2, 150);
    animateDot(dot3, 300);
  }, []);

  const s1 = useAnimatedStyle(() => ({ transform: [{ translateY: dot1.value }] }));
  const s2 = useAnimatedStyle(() => ({ transform: [{ translateY: dot2.value }] }));
  const s3 = useAnimatedStyle(() => ({ transform: [{ translateY: dot3.value }] }));

  const dotColor = isDark ? '#9CA3AF' : '#6B7280';

  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', width: 40, height: 24, gap: 4 }}>
      <Animated.View style={[{ width: 6, height: 6, borderRadius: 3, backgroundColor: dotColor }, s1]} />
      <Animated.View style={[{ width: 6, height: 6, borderRadius: 3, backgroundColor: dotColor }, s2]} />
      <Animated.View style={[{ width: 6, height: 6, borderRadius: 3, backgroundColor: dotColor }, s3]} />
    </View>
  );
});

const AudioBubble = React.memo(({ uri, text, isDark }) => {
  const [sound, setSound] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [durationMillis, setDurationMillis] = useState(1);
  const [positionMillis, setPositionMillis] = useState(0);
  const [showTranscript, setShowTranscript] = useState(false);

  useEffect(() => {
    return sound
      ? () => {
          sound.unloadAsync();
        }
      : undefined;
  }, [sound]);

  const handlePlayPause = async () => {
    if (sound) {
      if (isPlaying) {
        await sound.pauseAsync();
        setIsPlaying(false);
      } else {
        if (positionMillis >= durationMillis - 100) {
          await sound.setPositionAsync(0);
        }
        await sound.playAsync();
        setIsPlaying(true);
      }
    } else {
      const { sound: newSound } = await Audio.Sound.createAsync(
        { uri },
        { shouldPlay: true, isLooping: false },
        (status) => {
          if (status.isLoaded) {
            setDurationMillis(status.durationMillis || 1);
            setPositionMillis(status.positionMillis);

            if (status.didJustFinish) {
              setIsPlaying(false);
              newSound.setPositionAsync(0);
              newSound.pauseAsync();
            }
          }
        }
      );
      setSound(newSound);
      setIsPlaying(true);
    }
  };

  const formatTime = (millis) => {
    const totalSeconds = Math.floor(millis / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
  };

  const progress = Math.min(100, Math.max(0, (positionMillis / durationMillis) * 100));
  const s = getChatStyles(isDark);

  return (
    <LinearGradient
      colors={ZENIT_GRADIENT}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 0 }}
      style={[s.bubbleUser, userBubbleShadow, { paddingVertical: 12, paddingHorizontal: 16, minWidth: 175 }]}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        <TouchableOpacity
          onPress={handlePlayPause}
          style={{
            marginRight: 10,
            width: 28,
            height: 28,
            borderRadius: 14,
            backgroundColor: 'rgba(255,255,255,0.2)',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {isPlaying ? <Pause size={14} color="white" /> : <Play size={14} color="white" style={{ marginLeft: 2 }} />}
        </TouchableOpacity>

        <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <View style={{ flex: 1, height: 4, backgroundColor: 'rgba(255,255,255,0.3)', borderRadius: 2, position: 'relative' }}>
            <View style={{ position: 'absolute', top: 0, left: 0, bottom: 0, width: `${progress}%`, backgroundColor: 'white', borderRadius: 2 }} />
            <View
              style={{
                position: 'absolute',
                top: -3,
                left: `${progress}%`,
                width: 10,
                height: 10,
                borderRadius: 5,
                backgroundColor: 'white',
                marginLeft: -5,
              }}
            />
          </View>
          <Text style={{ color: 'rgba(255,255,255,0.9)', fontSize: 12, fontWeight: '600', minWidth: 32 }}>
            {formatTime(positionMillis)}
          </Text>
        </View>
      </View>

      {text && text !== '🎤 Mensaje de voz' ? (
        <View style={{ marginTop: 8, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.18)', paddingTop: 6 }}>
          <TouchableOpacity
            onPress={() => {
              Haptics.selectionAsync();
              setShowTranscript((prev) => !prev);
            }}
            activeOpacity={0.75}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              alignSelf: 'flex-start',
              backgroundColor: 'rgba(255,255,255,0.2)',
              paddingHorizontal: 9,
              paddingVertical: 4,
              borderRadius: 12,
              gap: 4,
            }}
          >
            <FileText size={11} color="white" />
            <Text style={{ color: 'white', fontSize: 11, fontWeight: '700' }}>
              {showTranscript ? 'Ocultar' : 'Transcribir'}
            </Text>
            {showTranscript ? <ChevronUp size={12} color="white" /> : <ChevronDown size={12} color="white" />}
          </TouchableOpacity>

          {showTranscript && (
            <Text style={{ color: 'white', fontSize: 13, marginTop: 6, opacity: 0.95, lineHeight: 18 }}>
              {text}
            </Text>
          )}
        </View>
      ) : null}
    </LinearGradient>
  );
});

export function CoachChatModal({
  visible = false,
  isDark = false,
  editableData,
  onClose,
  userData,
  showAlert,
}) {
  const inputRef = useRef(null);
  const textRef = useRef('');
  const chatScrollRef = useRef(null);

  const [hasText, setHasText] = useState(false);
  const [isTyping, setIsTyping] = useState(true);
  const [coachMessages, setCoachMessages] = useState([]);

  // Límite de 4 mensajes al coach por comida
  const MAX_COACH_MESSAGES = 4;
  const [remainingConsultations, setRemainingConsultations] = useState(MAX_COACH_MESSAGES);

  const triggerAlert = (title, message, type = 'warning') => {
    if (showAlert) {
      showAlert({ title, message, type });
    } else {
      Alert.alert(title, message);
    }
  };

  // --- ESTADOS PARA AUDIO Y GESTOS ---
  const [isRecording, setIsRecording] = useState(false);
  const [isLocked, setIsLockedState] = useState(false);

  const isLockedRef = useRef(false);
  const isPreparingRef = useRef(false);
  const pressStartTimeRef = useRef(0);
  const sttTranscriptRef = useRef('');
  const audioUriRef = useRef(null);

  const recordingScale = useSharedValue(1);
  const panY = useSharedValue(0);

  const setLocked = (val) => {
    isLockedRef.current = val;
    setIsLockedState(val);
  };

  // --- HOOKS DE SPEECH TO TEXT (STT NATIVO) ---
  SpeechRecognition.useSpeechRecognitionEvent('result', (event) => {
    const text = event.results[0]?.transcript || '';
    sttTranscriptRef.current = text;
  });

  SpeechRecognition.useSpeechRecognitionEvent('audiostart', (event) => {
    if (event?.uri) {
      audioUriRef.current = event.uri;
    }
  });

  SpeechRecognition.useSpeechRecognitionEvent('audioend', (event) => {
    if (event?.uri) {
      audioUriRef.current = event.uri;
    }
  });

  SpeechRecognition.useSpeechRecognitionEvent('error', () => {
    if (isRecording) {
      setIsRecording(false);
      recordingScale.value = withTiming(1, { duration: 150 });
    }
  });

  useEffect(() => {
    if (!visible) return;
    const fetchInitialAnalysis = async () => {
      try {
        const aiData = await generateInitialCoachWidgets(editableData, userData);
        const initialWidgets = [
          { id: 'sys-1', role: 'assistant', type: 'widget', title: 'Valor Nutricional', score: aiData.nutritionalScore, description: aiData.nutritionalDesc },
          { id: 'sys-2', role: 'assistant', type: 'widget', title: 'Impacto en tu Dieta', score: aiData.impactScore, description: aiData.impactDesc },
          { id: 'sys-3', role: 'assistant', type: 'text', text: aiData.welcomeMessage },
        ];
        setCoachMessages(initialWidgets);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } catch (error) {
        setCoachMessages([{ id: 'sys-error', role: 'assistant', type: 'text', text: 'Tuvimos un problema analizando esto. ¿Qué duda tenés sobre el alimento?' }]);
      } finally {
        setIsTyping(false);
      }
    };
    fetchInitialAnalysis();
  }, [visible]);

  const handleTextChange = (text) => {
    textRef.current = text;
    const isNotEmpty = text.trim().length > 0;
    if (isNotEmpty && !hasText) setHasText(true);
    if (!isNotEmpty && hasText) setHasText(false);
  };

  const handleSendChatMessage = async (textToSend = null) => {
    const text = textToSend || textRef.current.trim();
    if (!text) return;

    if (remainingConsultations <= 0) {
      triggerAlert('Límite de consultas', 'Has utilizado las 4 consultas disponibles para este alimento.', 'warning');
      return;
    }

    setRemainingConsultations((prev) => Math.max(0, prev - 1));
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setCoachMessages((prev) => [...prev, { id: Date.now().toString(), role: 'user', type: 'text', text }]);

    inputRef.current?.clear();
    textRef.current = '';
    setHasText(false);
    setIsTyping(true);

    try {
      const history = coachMessages.filter((m) => m.type === 'text');
      const aiResponse = await chatWithCoach(editableData, text, history, userData);
      setCoachMessages((prev) => [...prev, { id: Date.now().toString() + 'ai', role: 'assistant', type: 'text', text: aiResponse }]);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (error) {
      triggerAlert('Zenit Coach', 'Zenit Coach está descansando. Intentá de nuevo.', 'info');
    } finally {
      setIsTyping(false);
    }
  };

  const startRecording = async () => {
    if (isPreparingRef.current) return;
    if (remainingConsultations <= 0) {
      triggerAlert('Límite de consultas', 'Has utilizado las 4 consultas disponibles para este alimento.', 'warning');
      return;
    }
    isPreparingRef.current = true;

    try {
      const sttPerm = await SpeechRecognition.ExpoSpeechRecognitionModule.requestPermissionsAsync();
      if (!sttPerm.granted) {
        isPreparingRef.current = false;
        return triggerAlert('Permiso denegado', 'Activá el micrófono en Ajustes para usar notas de voz.', 'warning');
      }

      if (!isPreparingRef.current) return;

      sttTranscriptRef.current = '';
      audioUriRef.current = null;

      SpeechRecognition.ExpoSpeechRecognitionModule.start({
        lang: 'es-AR',
        interimResults: true,
        requiresOnDeviceRecognition: false,
        recordingOptions: {
          persist: true,
        },
      });

      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      setIsRecording(true);
      recordingScale.value = withRepeat(withTiming(1.08, { duration: 600, easing: Easing.inOut(Easing.ease) }), -1, true);
    } catch (err) {
      console.error('Error al iniciar STT:', err);
      setIsRecording(false);
      recordingScale.value = withTiming(1, { duration: 150 });
    } finally {
      isPreparingRef.current = false;
    }
  };

  const stopRecording = async (shouldSend = true) => {
    if (isPreparingRef.current) isPreparingRef.current = false;

    setLocked(false);
    setIsRecording(false);
    recordingScale.value = withTiming(1, { duration: 150 });
    panY.value = withTiming(0, { duration: 150 });

    try {
      SpeechRecognition.ExpoSpeechRecognitionModule.stop();

      if (shouldSend) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        await new Promise((resolve) => setTimeout(resolve, 400));

        const finalTranscript = sttTranscriptRef.current.trim();
        const uri = audioUriRef.current;

        if (finalTranscript || uri) {
          setRemainingConsultations((prev) => Math.max(0, prev - 1));
          const userText = finalTranscript || '🎤 Mensaje de voz';

          setCoachMessages((prev) => [
            ...prev,
            {
              id: Date.now().toString(),
              role: 'user',
              type: uri ? 'audio' : 'text',
              text: userText,
              audioUri: uri,
            },
          ]);

          if (finalTranscript) {
            setIsTyping(true);
            try {
              const history = coachMessages.filter((m) => m.type === 'text');
              const aiResponse = await chatWithCoach(editableData, finalTranscript, history, userData);
              setCoachMessages((prev) => [...prev, { id: Date.now().toString() + 'ai', role: 'assistant', type: 'text', text: aiResponse }]);
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            } catch (error) {
              console.error('Error en chatWithCoach:', error);
              triggerAlert('Error de conexión', 'No pudimos procesar tu mensaje con el coach. Intentá de nuevo.', 'danger');
            } finally {
              setIsTyping(false);
            }
          } else {
            triggerAlert('Audio no claro', 'No se detectó texto claro en el audio. Intentá hablar más cerca del micrófono.', 'warning');
          }
        } else {
          triggerAlert('Audio no detectado', 'No se detectó audio ni voz.', 'warning');
        }
      } else {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        SpeechRecognition.ExpoSpeechRecognitionModule.abort();
      }
    } catch (err) {
      console.error('Error al detener:', err);
    }
  };

  const micPanResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderGrant: () => {
        if (!isLockedRef.current) {
          pressStartTimeRef.current = Date.now();
          startRecording();
          panY.value = 0;
        }
      },
      onPanResponderMove: (_, gestureState) => {
        if (!isLockedRef.current) {
          if (gestureState.dy < 0 && gestureState.dy > -100) {
            panY.value = gestureState.dy;
          }
          if (gestureState.dy < -40) {
            setLocked(true);
            panY.value = withTiming(0);
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
          }
        }
      },
      onPanResponderRelease: () => {
        panY.value = withTiming(0, { duration: 180, easing: Easing.out(Easing.cubic) });
        if (!isLockedRef.current) {
          const duration = Date.now() - pressStartTimeRef.current;
          if (duration < 300) {
            stopRecording(false);
          } else {
            stopRecording(true);
          }
        }
      },
      onPanResponderTerminate: () => {
        panY.value = withTiming(0, { duration: 180, easing: Easing.out(Easing.cubic) });
        if (!isLockedRef.current) stopRecording(false);
      },
    })
  ).current;

  const animatedMicStyle = useAnimatedStyle(() => ({
    transform: [{ scale: recordingScale.value }, { translateY: panY.value }],
  }));

  const s = getChatStyles(isDark);

  if (!visible) return null;

  return (
    <Animated.View
      entering={SlideInRight.duration(260).easing(Easing.out(Easing.cubic))}
      exiting={SlideOutRight.duration(220).easing(Easing.in(Easing.cubic))}
      style={s.overlay}
      renderToHardwareTextureAndroid={true}
    >
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <SafeAreaView style={{ flex: 1 }}>
          {/* Header */}
          <View style={s.header}>
            <TouchableOpacity
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                onClose();
              }}
              style={s.iconBtn}
            >
              <ChevronLeft size={24} color={isDark ? 'white' : '#111827'} />
            </TouchableOpacity>
            <View style={s.headerTitle}>
              <Sparkles size={18} color="#F97316" />
              <Text style={s.headerText}>Zenit Coach</Text>
            </View>
            {/* Contador de consultas restantes */}
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                backgroundColor:
                  remainingConsultations > 0
                    ? isDark
                      ? 'rgba(249, 115, 22, 0.15)'
                      : '#FFF7ED'
                    : isDark
                      ? 'rgba(239, 68, 68, 0.15)'
                      : '#FEF2F2',
                paddingHorizontal: 10,
                paddingVertical: 5,
                borderRadius: 999,
                borderWidth: 1,
                borderColor: remainingConsultations > 0 ? '#F97316' : '#EF4444',
              }}
            >
              <Text
                style={{
                  color: remainingConsultations > 0 ? '#F97316' : '#EF4444',
                  fontSize: 11,
                  fontWeight: '800',
                }}
              >
                {remainingConsultations}/4
              </Text>
            </View>
          </View>

          {/* Mensajes */}
          <ScrollView
            ref={chatScrollRef}
            onContentSizeChange={() => chatScrollRef.current?.scrollToEnd({ animated: true })}
            style={s.scroll}
            contentContainerStyle={{ paddingBottom: 20 }}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            scrollEventThrottle={16}
            removeClippedSubviews={Platform.OS === 'android'}
            overScrollMode="never"
            keyboardDismissMode="on-drag"
          >
            {coachMessages.map((msg, index) => {
              const isAssistant = msg.role === 'assistant';
              const showAvatar = isAssistant && (index === 0 || coachMessages[index - 1].role !== 'assistant');

              return (
                <Animated.View
                  key={msg.id}
                  entering={FadeIn.duration(220)}
                  layout={LinearTransition.duration(180)}
                  style={isAssistant ? s.messageRowAsst : s.messageRowUser}
                >
                  {isAssistant ? (
                    <>
                      {showAvatar ? (
                        <LinearGradient colors={ZENIT_GRADIENT} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={s.avatar}>
                          <Sparkles size={14} color="white" />
                        </LinearGradient>
                      ) : (
                        <View style={s.avatarSpacer} />
                      )}
                      {msg.type === 'widget' ? (
                        <View style={[s.bubbleAsst, { width: '85%' }]}>
                          <Text style={s.widgetTitle}>{msg.title}</Text>
                          <View style={s.widgetBars}>
                            {[1, 2, 3, 4, 5].map((i) => (
                              <View key={i} style={i <= msg.score ? s.widgetBarActive : s.widgetBarInactive} />
                            ))}
                          </View>
                          <Text style={s.widgetDesc}>{msg.description}</Text>
                        </View>
                      ) : (
                        <View style={s.bubbleAsst}>
                          <Text style={s.bubbleTextAsst}>{msg.text}</Text>
                        </View>
                      )}
                    </>
                  ) : msg.type === 'audio' ? (
                    <AudioBubble uri={msg.audioUri} text={msg.text} isDark={isDark} />
                  ) : (
                    <LinearGradient
                      colors={ZENIT_GRADIENT}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      style={[s.bubbleUser, userBubbleShadow]}
                    >
                      <Text style={s.bubbleTextUser}>{msg.text}</Text>
                    </LinearGradient>
                  )}
                </Animated.View>
              );
            })}

            {isTyping && (
              <Animated.View
                entering={FadeIn.duration(180)}
                exiting={FadeOut.duration(150)}
                layout={LinearTransition.duration(180)}
                style={s.messageRowAsst}
              >
                <LinearGradient colors={ZENIT_GRADIENT} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={s.avatar}>
                  <Sparkles size={14} color="white" />
                </LinearGradient>
                <View style={[s.bubbleAsst, { paddingHorizontal: 12, paddingVertical: 10 }]}>
                  <TypingIndicator isDark={isDark} />
                </View>
              </Animated.View>
            )}
          </ScrollView>

          {/* Input y Micrófono */}
          <View style={s.inputContainer}>
            {isRecording && !isLocked && (
              <Animated.View
                entering={FadeIn.duration(200)}
                exiting={FadeOut.duration(200)}
                style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, marginBottom: 12, paddingBottom: 12 }}
              >
                <Lock size={14} color="#9CA3AF" />
                <Text style={{ color: '#9CA3AF', fontSize: 13, fontWeight: '600' }}>
                  Deslizá hacia arriba para bloquear
                </Text>
              </Animated.View>
            )}

            <View style={s.inputInner}>
              {isRecording && isLocked ? (
                <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 12, paddingHorizontal: 4 }}>
                  <TouchableOpacity onPress={() => stopRecording(false)} style={{ width: 40, height: 40, alignItems: 'center', justifyContent: 'center' }}>
                    <Trash2 size={20} color="#EF4444" />
                  </TouchableOpacity>
                  <Animated.Text entering={FadeIn} style={{ color: '#EF4444', fontWeight: 'bold' }}>
                    Grabando... (Bloqueado)
                  </Animated.Text>
                  <View style={{ width: 40 }} />
                </View>
              ) : (
                <TextInput
                  ref={inputRef}
                  onChangeText={handleTextChange}
                  onSubmitEditing={() => handleSendChatMessage()}
                  placeholder={
                    remainingConsultations <= 0
                      ? 'Límite de 4 consultas alcanzado'
                      : isRecording
                        ? 'Grabando audio...'
                        : 'Preguntale al coach...'
                  }
                  placeholderTextColor="#9CA3AF"
                  editable={!isRecording && remainingConsultations > 0}
                  style={[s.textInput, remainingConsultations <= 0 && { opacity: 0.6 }]}
                  selectionColor="#F97316"
                  returnKeyType="send"
                />
              )}

              {hasText || (isRecording && isLocked) ? (
                <TouchableOpacity
                  onPress={() => {
                    if (isRecording && isLocked) {
                      stopRecording(true);
                    } else {
                      handleSendChatMessage();
                    }
                  }}
                  style={{ marginLeft: 8 }}
                >
                  <LinearGradient
                    colors={ZENIT_GRADIENT}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={[s.sendBtn, sendButtonShadow]}
                  >
                    <Send size={18} color="white" style={{ marginLeft: -2, marginTop: 2 }} />
                  </LinearGradient>
                </TouchableOpacity>
              ) : (
                <Animated.View
                  {...(remainingConsultations > 0 ? micPanResponder.panHandlers : {})}
                  style={[animatedMicStyle, remainingConsultations <= 0 && { opacity: 0.4 }]}
                >
                  <View pointerEvents="none" style={[s.micBtn, isRecording && { backgroundColor: '#FEE2E2' }]}>
                    <Mic size={18} color={isRecording ? '#EF4444' : isDark ? '#9CA3AF' : '#4B5563'} />
                  </View>
                </Animated.View>
              )}
            </View>
          </View>
        </SafeAreaView>
      </KeyboardAvoidingView>
    </Animated.View>
  );
}

export default CoachChatModal;

