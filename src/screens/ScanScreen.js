import React, { useState, useRef, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image, Alert, ScrollView, Dimensions, TextInput, KeyboardAvoidingView, Platform, useColorScheme, PanResponder, BackHandler } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { Zap, ZapOff, RotateCcw, X, ChevronLeft, Sparkles, Plus, Heart, Send, Mic, Trash2, Lock, Play, Pause, ChevronDown, ChevronUp, FileText, Trophy } from 'lucide-react-native';
import Animated, { FadeIn, FadeOut, SlideInDown, SlideInRight, SlideOutRight, FadeInUp, useSharedValue, useAnimatedStyle, withTiming, withRepeat, Easing, useAnimatedReaction, runOnJS, withSequence, withDelay, LinearTransition } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { Audio } from 'expo-av';
import * as SpeechRecognition from 'expo-speech-recognition';
import { manipulateAsync, SaveFormat } from 'expo-image-manipulator';

import { ZENIT_GRADIENT } from '../constants/theme'; 
import { analyzeFoodImage, chatWithCoach, generateInitialCoachWidgets, prewarmVisionService } from '../services/ai/geminiVisionService';
import { useUserStore } from '../store/useUserStore';
import { ZenitModalAlert } from '../components/ui/ZenitModalAlert';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

// ==========================================
// SOMBRAS COMO ESTILO INLINE (Bypass NativeWind)
// ==========================================
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

const coachBtnShadow = {
    shadowColor: '#F97316',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
};


// ==========================================
// ESTILOS ESTÁTICOS (Zero Allocations en Renders)
// ==========================================
const createChatStyles = (isDark) => StyleSheet.create({
    overlay: { ...StyleSheet.absoluteFillObject, zIndex: 100, backgroundColor: isDark ? '#0A0A0A' : '#ffffff' },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingBottom: 16, paddingTop: 8, borderBottomWidth: 1, borderBottomColor: isDark ? '#111111' : '#F3F4F6' },
    headerTitle: { flexDirection: 'row', alignItems: 'center' },
    headerText: { color: isDark ? 'white' : '#111827', fontWeight: 'bold', fontSize: 18, marginLeft: 8 },
    iconBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center', backgroundColor: isDark ? '#111111' : '#F9FAFB', borderRadius: 20, borderWidth: 1, borderColor: isDark ? '#1F2937' : '#E5E7EB' },
    scroll: { flex: 1, paddingHorizontal: 16, paddingTop: 24 },
    messageRowAsst: { flexDirection: 'row', alignItems: 'flex-end', marginBottom: 16 },
    messageRowUser: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'flex-end', marginBottom: 16 },
    avatar: { width: 32, height: 32, borderRadius: 16, backgroundColor: 'rgba(249, 115, 22, 0.1)', alignItems: 'center', justifyContent: 'center', marginBottom: 4, marginRight: 8, borderWidth: 1, borderColor: 'rgba(249, 115, 22, 0.3)' },
    avatarSpacer: { width: 32, marginRight: 8 },
    bubbleAsst: { backgroundColor: isDark ? '#111111' : '#F9FAFB', padding: 16, borderRadius: 24, borderBottomLeftRadius: 4, borderWidth: 1, borderColor: isDark ? '#1F2937' : '#F3F4F6', maxWidth: '85%' },
    bubbleUser: { backgroundColor: '#F97316', padding: 16, borderRadius: 24, borderBottomRightRadius: 4, maxWidth: '85%' },
    bubbleTextAsst: { color: isDark ? '#E5E7EB' : '#1F2937', fontSize: 16, lineHeight: 24 },
    bubbleTextUser: { color: 'white', fontSize: 16, lineHeight: 24 },
    widgetTitle: { color: isDark ? '#E5E7EB' : '#111827', fontSize: 16, fontWeight: '700', marginBottom: 12 },
    widgetDesc: { color: isDark ? '#9CA3AF' : '#4B5563', fontSize: 13, lineHeight: 20 },
    widgetBars: { flexDirection: 'row', gap: 4, marginBottom: 12 },
    widgetBarActive: { flex: 1, height: 6, backgroundColor: '#F97316', borderRadius: 3 },
    widgetBarInactive: { flex: 1, height: 6, backgroundColor: isDark ? '#1F2937' : '#E5E7EB', borderRadius: 3 },
    inputContainer: { paddingHorizontal: 16, paddingVertical: 12, borderTopWidth: 1, borderTopColor: isDark ? '#111111' : '#F3F4F6', backgroundColor: isDark ? '#0A0A0A' : '#ffffff' },
    inputInner: { flexDirection: 'row', alignItems: 'center', backgroundColor: isDark ? '#111111' : '#F9FAFB', borderWidth: 1, borderColor: isDark ? '#1F2937' : '#E5E7EB', borderRadius: 999, paddingLeft: 20, paddingRight: 6, paddingVertical: 6 },
    textInput: { flex: 1, color: isDark ? 'white' : '#111827', fontSize: 16, paddingVertical: 12, margin: 0 },
    sendBtn: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
    micBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: isDark ? '#1F2937' : '#E5E7EB', alignItems: 'center', justifyContent: 'center', marginLeft: 8 },
});

const chatStylesDark = createChatStyles(true);
const chatStylesLight = createChatStyles(false);
const getChatStyles = (isDark) => (isDark ? chatStylesDark : chatStylesLight);

// ==========================================
// INDICADOR DE ESCRIBIENDO (Estilo WhatsApp/iMessage)
// ==========================================
const TypingIndicator = React.memo(({ isDark }) => {
    const dot1 = useSharedValue(0);
    const dot2 = useSharedValue(0);
    const dot3 = useSharedValue(0);

    useEffect(() => {
        const animateDot = (dot, delay) => {
            dot.value = withDelay(delay, withRepeat(
                withSequence(
                    withTiming(-5, { duration: 300, easing: Easing.inOut(Easing.ease) }),
                    withTiming(0, { duration: 300, easing: Easing.inOut(Easing.ease) })
                ), -1, true
            ));
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

// ==========================================
// COMPONENTE BURBUJA DE AUDIO
// ==========================================
const AudioBubble = React.memo(({ uri, text, isDark }) => {
    const [sound, setSound] = useState(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [durationMillis, setDurationMillis] = useState(1);
    const [positionMillis, setPositionMillis] = useState(0);
    const [showTranscript, setShowTranscript] = useState(false);

    useEffect(() => {
        return sound ? () => { sound.unloadAsync(); } : undefined;
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
                <TouchableOpacity onPress={handlePlayPause} style={{ marginRight: 10, width: 28, height: 28, borderRadius: 14, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center' }}>
                    {isPlaying ? <Pause size={14} color="white" /> : <Play size={14} color="white" style={{ marginLeft: 2 }} />}
                </TouchableOpacity>
                
                <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    <View style={{ flex: 1, height: 4, backgroundColor: 'rgba(255,255,255,0.3)', borderRadius: 2, position: 'relative' }}>
                        <View style={{ position: 'absolute', top: 0, left: 0, bottom: 0, width: `${progress}%`, backgroundColor: 'white', borderRadius: 2 }} />
                        <View style={{ position: 'absolute', top: -3, left: `${progress}%`, width: 10, height: 10, borderRadius: 5, backgroundColor: 'white', marginLeft: -5 }} />
                    </View>
                    <Text style={{ color: 'rgba(255,255,255,0.9)', fontSize: 12, fontWeight: '600', minWidth: 32 }}>
                        {formatTime(positionMillis)}
                    </Text>
                </View>
            </View>

            {text && text !== "🎤 Mensaje de voz" ? (
                <View style={{ marginTop: 8, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.18)', paddingTop: 6 }}>
                    <TouchableOpacity 
                        onPress={() => {
                            Haptics.selectionAsync();
                            setShowTranscript(prev => !prev);
                        }}
                        activeOpacity={0.75}
                        style={{ flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start', backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 9, paddingVertical: 4, borderRadius: 12, gap: 4 }}
                    >
                        <FileText size={11} color="white" />
                        <Text style={{ color: 'white', fontSize: 11, fontWeight: '700' }}>
                            {showTranscript ? "Ocultar" : "Transcribir"}
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

// ==========================================
// COMPONENTES DE ANIMACIÓN (PROCESAMIENTO)
// ==========================================
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
                colors={ZENIT_GRADIENT} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} 
                style={{ width: 64, height: 64, borderRadius: 32, alignItems: 'center', justifyContent: 'center', shadowColor: '#F97316', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 5 }}
            >
                <Sparkles size={28} color="white" />
            </LinearGradient>
        </View>
    );
});

const ProgressText = React.memo(({ progress }) => {
    const [loadingText, setLoadingText] = useState('Analizando imagen...');

    useAnimatedReaction(() => progress.value, (current, previous) => {
        if (current >= 95 && previous < 95) runOnJS(setLoadingText)('¡Completado!');
        else if (current >= 65 && previous < 65) runOnJS(setLoadingText)('Calculando macros...');
        else if (current >= 25 && previous < 25) runOnJS(setLoadingText)('Identificando ingredientes...');
    });

    return (
        <Animated.View entering={FadeIn.duration(300)} className="items-center">
            <Text className="text-gray-900 font-bold text-lg tracking-wide text-center">{loadingText}</Text>
            <Text className="text-[#F97316] text-[10px] mt-1.5 uppercase tracking-widest font-black text-center">Zenit AI</Text>
        </Animated.View>
    );
});

// ==========================================
// CHAT AISLADO: MICRÓFONO CON "SWIPE TO LOCK"
// ==========================================
const CoachChatOverlay = ({ isDark, editableData, onClose, userData, showAlert }) => {
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

    SpeechRecognition.useSpeechRecognitionEvent('error', (event) => {
        if (isRecording) {
            setIsRecording(false);
            recordingScale.value = withTiming(1, { duration: 150 });
        }
    });

    // ... (useEffect remains unchanged)
    useEffect(() => {
        const fetchInitialAnalysis = async () => {
            try {
                const aiData = await generateInitialCoachWidgets(editableData, userData);
                const initialWidgets = [
                    { id: 'sys-1', role: 'assistant', type: 'widget', title: 'Valor Nutricional', score: aiData.nutritionalScore, description: aiData.nutritionalDesc },
                    { id: 'sys-2', role: 'assistant', type: 'widget', title: 'Impacto en tu Dieta', score: aiData.impactScore, description: aiData.impactDesc },
                    { id: 'sys-3', role: 'assistant', type: 'text', text: aiData.welcomeMessage }
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
    }, []);

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
            triggerAlert("Límite de consultas", "Has utilizado las 4 consultas disponibles para este alimento.", "warning");
            return;
        }

        setRemainingConsultations(prev => Math.max(0, prev - 1));
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        setCoachMessages(prev => [...prev, { id: Date.now().toString(), role: 'user', type: 'text', text }]);
        
        inputRef.current?.clear();
        textRef.current = '';
        setHasText(false);
        setIsTyping(true);

        try {
            const history = coachMessages.filter(m => m.type === 'text');
            const aiResponse = await chatWithCoach(editableData, text, history, userData);
            setCoachMessages(prev => [...prev, { id: Date.now().toString() + 'ai', role: 'assistant', type: 'text', text: aiResponse }]);
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        } catch (error) {
            triggerAlert("Zenit Coach", "Zenit Coach está descansando. Intentá de nuevo.", "info");
        } finally {
            setIsTyping(false);
        }
    };

    // ==========================================
    // LÓGICA DE GRABACIÓN (STT NATIVO + AUDIO PERSISTENTE)
    // ==========================================
    const startRecording = async () => {
        if (isPreparingRef.current) return;
        if (remainingConsultations <= 0) {
            triggerAlert("Límite de consultas", "Has utilizado las 4 consultas disponibles para este alimento.", "warning");
            return;
        }
        isPreparingRef.current = true;

        try {
            // 1. Pedir permisos al STT nativo
            const sttPerm = await SpeechRecognition.ExpoSpeechRecognitionModule.requestPermissionsAsync();
            if (!sttPerm.granted) {
                isPreparingRef.current = false;
                return triggerAlert("Permiso denegado", "Activá el micrófono en Ajustes para usar notas de voz.", "warning");
            }

            if (!isPreparingRef.current) return;

            sttTranscriptRef.current = '';
            audioUriRef.current = null;

            // 2. Arrancar STT nativo con persistencia de audio (sin bloquear el micrófono con Audio.Recording)
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
            console.error("Error al iniciar STT:", err);
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
            // Detener STT
            SpeechRecognition.ExpoSpeechRecognitionModule.stop();

            if (shouldSend) {
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

                // Esperamos un instante a que el motor nativo emita el último chunk de texto
                await new Promise(resolve => setTimeout(resolve, 400));

                const finalTranscript = sttTranscriptRef.current.trim();
                const uri = audioUriRef.current;

                if (finalTranscript || uri) {
                    setRemainingConsultations(prev => Math.max(0, prev - 1));
                    const userText = finalTranscript || "🎤 Mensaje de voz";

                    // Agregamos el mensaje a la interfaz
                    setCoachMessages(prev => [...prev, {
                        id: Date.now().toString(),
                        role: 'user',
                        type: uri ? 'audio' : 'text',
                        text: userText,
                        audioUri: uri
                    }]);

                    if (finalTranscript) {
                        // Enviar el texto transcrito a Gemini
                        setIsTyping(true);
                        try {
                            const history = coachMessages.filter(m => m.type === 'text');
                            const aiResponse = await chatWithCoach(editableData, finalTranscript, history, userData);
                            setCoachMessages(prev => [...prev, { id: Date.now().toString() + 'ai', role: 'assistant', type: 'text', text: aiResponse }]);
                            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                        } catch (error) {
                            console.error("Error en chatWithCoach:", error);
                            triggerAlert("Error de conexión", "No pudimos procesar tu mensaje con el coach. Intentá de nuevo.", "danger");
                        } finally {
                            setIsTyping(false);
                        }
                    } else {
                        triggerAlert("Audio no claro", "No se detectó texto claro en el audio. Intentá hablar más cerca del micrófono.", "warning");
                    }
                } else {
                    triggerAlert("Audio no detectado", "No se detectó audio ni voz.", "warning");
                }
            } else {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                SpeechRecognition.ExpoSpeechRecognitionModule.abort();
            }
        } catch (err) {
            console.error("Error al detener:", err);
        }
    };

    // ==========================================
    // DETECTOR DE GESTOS (SWIPE TO LOCK)
    // ==========================================
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
                    // Solo permitimos mover hacia arriba (valores negativos en Y)
                    if (gestureState.dy < 0 && gestureState.dy > -100) {
                        panY.value = gestureState.dy;
                    }
                    // Si pasa los 40 píxeles hacia arriba, ¡BLOQUEAMOS!
                    if (gestureState.dy < -40) {
                        setLocked(true);
                        panY.value = withTiming(0); // El botón vuelve a su lugar visualmente
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
                    }
                }
            },
            onPanResponderRelease: () => {
                panY.value = withTiming(0, { duration: 180, easing: Easing.out(Easing.cubic) });
                // Si el usuario soltó y NO había llegado a bloquear
                if (!isLockedRef.current) {
                    const duration = Date.now() - pressStartTimeRef.current;
                    if (duration < 300) {
                        // Fue un toque rápido: Cancelamos
                        stopRecording(false);
                    } else {
                        // Mantuvo presionado: Enviamos
                        stopRecording(true); 
                    }
                }
            },
            onPanResponderTerminate: () => {
                panY.value = withTiming(0, { duration: 180, easing: Easing.out(Easing.cubic) });
                if (!isLockedRef.current) stopRecording(false);
            }
        })
    ).current;

    const animatedMicStyle = useAnimatedStyle(() => ({
        transform: [
            { scale: recordingScale.value },
            { translateY: panY.value }
        ]
    }));

    const s = getChatStyles(isDark);

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
                        <TouchableOpacity onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); onClose(); }} style={s.iconBtn}>
                            <ChevronLeft size={24} color={isDark ? "white" : "#111827"} />
                        </TouchableOpacity>
                        <View style={s.headerTitle}>
                            <Sparkles size={18} color="#F97316" />
                            <Text style={s.headerText}>Zenit Coach</Text>
                        </View>
                        {/* Contador de consultas restantes */}
                        <View style={{
                            flexDirection: 'row',
                            alignItems: 'center',
                            backgroundColor: remainingConsultations > 0 ? (isDark ? 'rgba(249, 115, 22, 0.15)' : '#FFF7ED') : (isDark ? 'rgba(239, 68, 68, 0.15)' : '#FEF2F2'),
                            paddingHorizontal: 10,
                            paddingVertical: 5,
                            borderRadius: 999,
                            borderWidth: 1,
                            borderColor: remainingConsultations > 0 ? '#F97316' : '#EF4444',
                        }}>
                            <Text style={{
                                color: remainingConsultations > 0 ? '#F97316' : '#EF4444',
                                fontSize: 11,
                                fontWeight: '800',
                            }}>
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
                        {/* ... MAPEO DE MENSAJES EXACTAMENTE IGUAL ... */}
                        {coachMessages.map((msg, index) => {
                            const isAssistant = msg.role === 'assistant';
                            const showAvatar = isAssistant && (index === 0 || coachMessages[index - 1].role !== 'assistant');

                            return (
                                <Animated.View key={msg.id} entering={FadeIn.duration(220)} layout={LinearTransition.duration(180)} style={isAssistant ? s.messageRowAsst : s.messageRowUser}>
                                    {isAssistant ? (
                                        <>
                                            {showAvatar ? (
                                                <LinearGradient colors={ZENIT_GRADIENT} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={s.avatar}>
                                                    <Sparkles size={14} color="white" />
                                                </LinearGradient>
                                            ) : <View style={s.avatarSpacer} />}
                                            {msg.type === 'widget' ? (
                                                <View style={[s.bubbleAsst, { width: '85%' }]}>
                                                    <Text style={s.widgetTitle}>{msg.title}</Text>
                                                    <View style={s.widgetBars}>
                                                        {[1, 2, 3, 4, 5].map((i) => <View key={i} style={i <= msg.score ? s.widgetBarActive : s.widgetBarInactive} />)}
                                                    </View>
                                                    <Text style={s.widgetDesc}>{msg.description}</Text>
                                                </View>
                                            ) : (
                                                <View style={s.bubbleAsst}><Text style={s.bubbleTextAsst}>{msg.text}</Text></View>
                                            )}
                                        </>
                                    ) : (
                                        msg.type === 'audio' 
                                            ? <AudioBubble uri={msg.audioUri} text={msg.text} isDark={isDark} />
                                            : (
                                                <LinearGradient
                                                    colors={ZENIT_GRADIENT}
                                                    start={{ x: 0, y: 0 }}
                                                    end={{ x: 1, y: 0 }}
                                                    style={[s.bubbleUser, userBubbleShadow]}
                                                >
                                                    <Text style={s.bubbleTextUser}>{msg.text}</Text>
                                                </LinearGradient>
                                            )
                                    )}
                                </Animated.View>
                            );
                        })}

                        {isTyping && (
                            <Animated.View entering={FadeIn.duration(180)} exiting={FadeOut.duration(150)} layout={LinearTransition.duration(180)} style={s.messageRowAsst}>
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
                        
                        {/* Indicador superior al estar grabando sin bloquear */}
                        {isRecording && !isLocked && (
                            <Animated.View entering={FadeIn.duration(200)} exiting={FadeOut.duration(200)} style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, mb: 12, paddingBottom: 12 }}>
                                <Lock size={14} color="#9CA3AF" />
                                <Text style={{ color: '#9CA3AF', fontSize: 13, fontWeight: '600' }}>
                                    Deslizá hacia arriba para bloquear
                                </Text>
                            </Animated.View>
                        )}

                        <View style={s.inputInner}>
                            
                            {isRecording && isLocked ? (
                                // ESTADO: GRABACIÓN BLOQUEADA
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
                                // ESTADO: NORMAL (Texto)
                                <TextInput
                                    ref={inputRef}
                                    onChangeText={handleTextChange}
                                    onSubmitEditing={() => handleSendChatMessage()}
                                    placeholder={
                                        remainingConsultations <= 0
                                            ? "Límite de 4 consultas alcanzado"
                                            : (isRecording ? "Grabando audio..." : "Preguntale al coach...")
                                    }
                                    placeholderTextColor="#9CA3AF"
                                    editable={!isRecording && remainingConsultations > 0}
                                    style={[s.textInput, remainingConsultations <= 0 && { opacity: 0.6 }]}
                                    selectionColor="#F97316"
                                    returnKeyType="send"
                                />
                            )}
                            
                            {hasText || (isRecording && isLocked) ? (
                                // BOTÓN DE ENVIAR (Aparece si hay texto o si el audio está bloqueado)
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
                                // BOTÓN DE MICRÓFONO CON GESTOS Y ANIMACIÓN
                                <Animated.View 
                                    {...(remainingConsultations > 0 ? micPanResponder.panHandlers : {})}
                                    style={[animatedMicStyle, remainingConsultations <= 0 && { opacity: 0.4 }]}
                                >
                                    {/* Pasamos pointerEvents="none" para que el View animado atrape el gesto, no el botón */}
                                    <View pointerEvents="none" style={[s.micBtn, isRecording && { backgroundColor: '#FEE2E2' }]}>
                                        <Mic size={18} color={isRecording ? "#EF4444" : (isDark ? "#9CA3AF" : "#4B5563")} />
                                    </View>
                                </Animated.View>
                            )}
                        </View>
                    </View>
                </SafeAreaView>
            </KeyboardAvoidingView>
        </Animated.View>
    );
};



// ==========================================
// PANTALLA PRINCIPAL
// ==========================================
export default function ScanScreen({ navigation }) {
  const [permission, requestPermission] = useCameraPermissions();
  const cameraRef = useRef(null);
  
  const colorScheme = useColorScheme();
  // Tema claro (blanco) por defecto según configuración
  const isDark = false;

  const [appState, setAppState] = useState('idle'); 
  const [photo, setPhoto] = useState(null);
  const [facing, setFacing] = useState('back');
  const [flash, setFlash] = useState('off');
  const [editableData, setEditableData] = useState(null);
  const [isFavorite, setIsFavorite] = useState(false);
  const [showCoachChat, setShowCoachChat] = useState(false);
  const [selectedPortionLabel, setSelectedPortionLabel] = useState(null);
  const baseDataRef = useRef(null);
  const selectedMultiplierRef = useRef(1);
  const resultScrollRef = useRef(null);
  const hintOpacity = useSharedValue(0);
  const hintTranslateY = useSharedValue(16);
  const arrowTranslateY = useSharedValue(0);

  // Datos globales del usuario y macros
  const addConsumedFood = useUserStore((state) => state.addConsumedFood);
  const targetMacros = useUserStore((state) => state.targetMacros);
  const consumedMacros = useUserStore((state) => state.consumedMacros);
  const userName = useUserStore((state) => state.name);
  const userGoal = useUserStore((state) => state.goal);
  const dailyScans = useUserStore((state) => state.dailyScans);
  const getRemainingScans = useUserStore((state) => state.getRemainingScans);
  const incrementDailyScans = useUserStore((state) => state.incrementDailyScans);

  const remainingScans = getRemainingScans ? getRemainingScans(8) : 8;

  const appStateRef = useRef(appState);
  useEffect(() => {
    appStateRef.current = appState;
  }, [appState]);

  // Precalentar la conexión a Gemini en segundo plano apenas se abre el escáner
  useEffect(() => {
    prewarmVisionService();
  }, []);

  // Modal de Alerta y Confirmación Zenit
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

  const isLeavingRef = useRef(false);

  const progress = useSharedValue(0);
  const progressStyle = useAnimatedStyle(() => ({ width: `${progress.value}%` }));

  const hintStyle = useAnimatedStyle(() => ({
    opacity: hintOpacity.value,
    transform: [{ translateY: hintTranslateY.value }],
  }));

  const arrowStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: arrowTranslateY.value }],
  }));

  // Mostrar hint "deslizá para guardar" cuando aparece el resultado con flecha animada
  useEffect(() => {
    if (appState === 'result') {
      // Iniciar el rebote continuo sutil de la flechita
      arrowTranslateY.value = withRepeat(
        withSequence(
          withTiming(4, { duration: 450, easing: Easing.inOut(Easing.ease) }),
          withTiming(-2, { duration: 450, easing: Easing.inOut(Easing.ease) })
        ),
        -1,
        true
      );
      // Aparece a los 400ms con suave slide up y fade in
      hintOpacity.value = withDelay(400, withTiming(1, { duration: 400, easing: Easing.out(Easing.ease) }));
      hintTranslateY.value = withDelay(400, withTiming(0, { duration: 400, easing: Easing.out(Easing.ease) }));

      // Desaparece automáticamente tras 4.5s
      const timer = setTimeout(() => {
        hintOpacity.value = withTiming(0, { duration: 500, easing: Easing.in(Easing.ease) });
      }, 4500);

      return () => clearTimeout(timer);
    } else {
      hintOpacity.value = 0;
      hintTranslateY.value = 16;
      arrowTranslateY.value = 0;
    }
  }, [appState]);

  // Al tocar el hint, scrollear suavemente hasta abajo
  const handleScrollToBottom = () => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch (e) {}
    hintOpacity.value = withTiming(0, { duration: 200 });
    resultScrollRef.current?.scrollToEnd({ animated: true });
  };

  // Función para resetear por completo el estado del escáner
  const resetScanState = () => {
    setPhoto(null);
    setEditableData(null);
    setSelectedPortionLabel(null);
    baseDataRef.current = null;
    selectedMultiplierRef.current = 1;
    setIsFavorite(false);
    setShowCoachChat(false);
    progress.value = 0;
    hintOpacity.value = 0;
    hintTranslateY.value = 16;
    arrowTranslateY.value = 0;
    setAppState('idle');
    appStateRef.current = 'idle';
  };

  const showCoachChatRef = useRef(showCoachChat);
  useEffect(() => {
    showCoachChatRef.current = showCoachChat;
  }, [showCoachChat]);

  const navigationRef = useRef(navigation);
  useEffect(() => {
    navigationRef.current = navigation;
  }, [navigation]);

  // Recalcular macros según porción seleccionada
  const handleSelectPortion = (preset) => {
    if (!baseDataRef.current || !preset) return;
    try {
      Haptics.selectionAsync();
    } catch (e) {}
    const mult = typeof preset.multiplier === 'number' ? preset.multiplier : 1;
    selectedMultiplierRef.current = mult;
    setSelectedPortionLabel(preset.label);
    const baseCals = Number(baseDataRef.current.totalCalories) || 0;
    const baseProt = Number(baseDataRef.current.totalProtein) || 0;
    const baseCarbs = Number(baseDataRef.current.totalCarbs) || 0;
    const baseFat = Number(baseDataRef.current.totalFat) || 0;

    setEditableData(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        totalCalories: Math.round(baseCals * mult),
        totalProtein: Math.round(baseProt * mult),
        totalCarbs: Math.round(baseCarbs * mult),
        totalFat: Math.round(baseFat * mult),
      };
    });
  };

  // Recalcular macros proporcionalmente y actualizar la base cuando el usuario edita las calorías a mano
  const handleCaloriesChange = (text) => {
    const cleaned = text.replace(/[^0-9]/g, '');
    const newCals = Number(cleaned) || 0;
    const base = baseDataRef.current;
    const mult = (selectedMultiplierRef.current && selectedMultiplierRef.current > 0) ? selectedMultiplierRef.current : 1;

    if (base && newCals > 0) {
      const currentPortionCals = (Number(base.totalCalories) || 0) * mult;
      const ratio = currentPortionCals > 0 ? newCals / currentPortionCals : 1;

      // Calcular la nueva base al 100% (envase total)
      const newBaseCals = Math.round(newCals / mult);
      const newBaseProt = Math.round((Number(base.totalProtein) || 0) * ratio);
      const newBaseCarbs = Math.round((Number(base.totalCarbs) || 0) * ratio);
      const newBaseFat = Math.round((Number(base.totalFat) || 0) * ratio);

      // Actualizar baseDataRef para que cambiar de porción no vuelva a los datos hardcodeados
      base.totalCalories = newBaseCals;
      base.totalProtein = newBaseProt;
      base.totalCarbs = newBaseCarbs;
      base.totalFat = newBaseFat;

      setEditableData(prev => prev ? {
        ...prev,
        totalCalories: cleaned,
        totalProtein: Math.round(newBaseProt * mult),
        totalCarbs: Math.round(newBaseCarbs * mult),
        totalFat: Math.round(newBaseFat * mult),
      } : prev);
      return;
    }

    setEditableData(prev => prev ? { ...prev, totalCalories: cleaned } : prev);
  };

  // Actualizar macro individual (Proteína, Carbos, Grasas) y sincronizar la base 100%
  const handleMacroChange = (macroKey, text) => {
    const cleaned = text.replace(/[^0-9.]/g, '');
    const numVal = Number(cleaned) || 0;
    const mult = (selectedMultiplierRef.current && selectedMultiplierRef.current > 0) ? selectedMultiplierRef.current : 1;

    if (baseDataRef.current) {
      baseDataRef.current[macroKey] = Math.round(numVal / mult);
    }

    setEditableData(prev => prev ? { ...prev, [macroKey]: cleaned } : prev);
  };


  // Confirmar salida a la pantalla principal con modal Zenit
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

  // Alerta de confirmación al intentar volver hacia atrás habiendo sacado una foto
  const handleBackAction = () => {
    // Si está en el chat del coach, primero vuelve a la modal del producto
    if (showCoachChatRef.current) {
      setShowCoachChat(false);
      return;
    }

    if (appStateRef.current === 'idle') {
      if (navigationRef.current?.navigate) navigationRef.current.navigate('Home');
      else if (navigationRef.current?.goBack) navigationRef.current.goBack();
    } else {
      confirmExitToHome();
    }
  };

  // Interceptar botón físico y gesto de deslizar atrás de Android (Hardware / Gesture Back)
  useEffect(() => {
    const onBackPress = () => {
      // 1. Si está en el chat con el coach, el gesto atrás solo cierra el chat y vuelve a la modal
      if (showCoachChatRef.current) {
        setShowCoachChat(false);
        return true; // Previene salir de la pantalla
      }

      // 2. Si sacó foto y está en la modal de resultado o procesando, preguntar confirmación
      if (appStateRef.current !== 'idle') {
        confirmExitToHome();
        return true; // Previene salir directamente sin confirmar
      }

      // 3. Si está en reposo (idle), dejamos que el gesto atrás vuelva al Home normalmente
      if (navigationRef.current?.navigate) {
        navigationRef.current.navigate('Home');
        return true;
      }
      return false;
    };

    const subscription = BackHandler.addEventListener('hardwareBackPress', onBackPress);
    return () => subscription.remove();
  }, []);

  const handleTakePicture = async () => {
    if (!cameraRef.current || appState !== 'idle') return;

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
    
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setAppState('capturing'); 
    appStateRef.current = 'capturing';

    try {
      // 1. Captura rápida nativa sin serializar base64 gigante en la cámara
      const photoData = await cameraRef.current.takePictureAsync({ quality: 0.8, skipProcessing: true });
      setPhoto(photoData);

      setAppState('processing');
      appStateRef.current = 'processing';
      progress.value = 0;
      progress.value = withTiming(90, { duration: 3500, easing: Easing.out(Easing.ease) });

      // 2. Optimizamos la imagen para Gemini Vision: redimensionar a max 800px de ancho con compresión JPEG nativa
      // Esto reduce el tamaño a ~45KB, acelerando tanto el resize local como la inferencia en Gemini
      const optimized = await manipulateAsync(
        photoData.uri,
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

      // Descontamos un escaneo diario al verificar que fue comida válida
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
      console.error("Error oculto:", error);
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

  const handleRetake = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    resetScanState();
  };

  // Guardar comida y sincronizar con el store global
  const handleSave = () => {
    if (!editableData) return;
    
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    addConsumedFood({
      name: editableData.mealName || "Comida escaneada",
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

  // Descartar comida solicitando confirmación con modal Zenit
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

  // Manejo de estado de carga inicial de permisos
  if (!permission) {
      return <View className="flex-1 bg-black" />;
  }

  // Si no hay permiso, le mostramos un botón amigable para pedirlo
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
              <TouchableOpacity 
                  onPress={requestPermission}
                  activeOpacity={0.8}
              >
                  <LinearGradient 
                      colors={ZENIT_GRADIENT} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} 
                      style={{ paddingVertical: 16, paddingHorizontal: 40, borderRadius: 999, shadowColor: '#F97316', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 5 }}
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
      <CameraView style={StyleSheet.absoluteFill} facing={facing} flash={flash} mode="picture" ref={cameraRef} />

      {appState === 'idle' && (
        <SafeAreaView className="flex-1 justify-between">
            <View className="flex-row justify-between items-center px-6 pt-2">
                <TouchableOpacity onPress={handleBackAction} className="w-10 h-10 rounded-full bg-black/40 items-center justify-center">
                    <ChevronLeft size={24} color="white" />
                </TouchableOpacity>

                {/* Contador de escaneos diarios restantes */}
                <View style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    backgroundColor: 'rgba(0, 0, 0, 0.55)',
                    paddingHorizontal: 12,
                    paddingVertical: 6,
                    borderRadius: 999,
                    borderWidth: 1,
                    borderColor: remainingScans > 0 ? 'rgba(249, 115, 22, 0.4)' : 'rgba(239, 68, 68, 0.5)',
                    gap: 6,
                }}>
                    <Sparkles size={13} color={remainingScans > 0 ? '#F97316' : '#EF4444'} />
                    <Text style={{ color: 'white', fontSize: 12, fontWeight: '700' }}>
                        {remainingScans}/8 hoy
                    </Text>
                </View>

                <TouchableOpacity onPress={() => { Haptics.selectionAsync(); setFlash(f => f === 'off' ? 'on' : 'off'); }} className={`w-10 h-10 rounded-full items-center justify-center ${flash === 'on' ? 'bg-[#F97316]' : 'bg-black/40'}`}>
                    {flash === 'on' ? <Zap size={18} color="white" /> : <ZapOff size={18} color="white" />}
                </TouchableOpacity>
            </View>

            <View className="items-center px-6">
                <View className="bg-black/50 backdrop-blur-md px-4 py-1.5 rounded-full border border-white/15">
                    <Text className="text-white/90 text-xs font-medium">
                        💡 Tip: Sacale a tu porción servida para mayor precisión
                    </Text>
                </View>
            </View>

            <View className="flex-row justify-around items-center pb-8 pt-4">
                <View className="w-12 h-12" />
                <TouchableOpacity onPress={handleTakePicture} activeOpacity={0.7}>
                    <LinearGradient colors={ZENIT_GRADIENT} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ width: 80, height: 80, borderRadius: 40, alignItems: 'center', justifyContent: 'center' }}>
                        <View className="w-[64px] h-[64px] rounded-full bg-white border-4 border-white/30" />
                    </LinearGradient>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => { Haptics.selectionAsync(); setFacing(f => f === 'back' ? 'front' : 'back'); }} className="w-12 h-12 rounded-full bg-black/40 items-center justify-center">
                    <RotateCcw size={22} color="white" />
                </TouchableOpacity>
            </View>
        </SafeAreaView>
      )}

      {appState === 'processing' && photo && (
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
      )}

      {appState === 'result' && editableData && photo && (
          <Animated.View 
              entering={SlideInDown.duration(360).easing(Easing.out(Easing.cubic))} 
              style={StyleSheet.absoluteFill} 
              className="z-50"
              renderToHardwareTextureAndroid={true}
          >
             <Image source={{ uri: photo.uri }} style={StyleSheet.absoluteFill} resizeMode="cover" />
             <LinearGradient colors={['transparent', 'rgba(0,0,0,0.3)', 'rgba(0,0,0,0.7)']} className="absolute inset-0" pointerEvents="none" />

             {!showCoachChat && (
                 <SafeAreaView className="absolute top-0 w-full px-4 pt-2 z-50" pointerEvents="box-none">
                     <TouchableOpacity onPress={handleBackAction} className="bg-white/20 w-10 h-10 rounded-full items-center justify-center backdrop-blur-md border border-white/30">
                         <X color="white" size={24} />
                     </TouchableOpacity>
                 </SafeAreaView>
             )}

             <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
                 <ScrollView 
                     ref={resultScrollRef}
                     className="flex-1" 
                     contentContainerStyle={{ flexGrow: 1, justifyContent: 'flex-end' }} 
                     showsVerticalScrollIndicator={false} 
                     bounces={true} 
                     keyboardShouldPersistTaps="handled"
                     scrollEventThrottle={16}
                     removeClippedSubviews={Platform.OS === 'android'}
                     overScrollMode="never"
                     keyboardDismissMode="on-drag"
                     onScroll={(e) => {
                         if (e.nativeEvent.contentOffset.y > 40 && hintOpacity.value > 0) {
                             hintOpacity.value = withTiming(0, { duration: 250 });
                         }
                     }}
                 >
                     <View style={{ height: SCREEN_HEIGHT * 0.55 }} />
                     <View
                         style={{
                             backgroundColor: isDark ? '#0F0F0F' : '#FFFFFF',
                             borderTopLeftRadius: 40,
                             borderTopRightRadius: 40,
                             paddingTop: 16,
                             paddingHorizontal: 24,
                             paddingBottom: 40,
                             shadowColor: '#000',
                             shadowOffset: { width: 0, height: -10 },
                             shadowOpacity: isDark ? 0.4 : 0.12,
                             shadowRadius: 20,
                             elevation: 10,
                         }}
                     >
                         {/* Drag handle */}
                         <View style={{ width: 48, height: 6, backgroundColor: isDark ? '#2A2A2A' : '#D1D5DB', borderRadius: 3, alignSelf: 'center', marginBottom: 24 }} />

                         {/* Nombre + favorito */}
                         <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginTop: 8 }}>
                             <TextInput
                                 value={editableData.mealName}
                                 onChangeText={(t) => setEditableData({...editableData, mealName: t})}
                                 style={{ color: isDark ? '#F9FAFB' : '#111827', fontSize: 30, fontWeight: '900', flex: 1, marginRight: 8, lineHeight: 36, paddingVertical: 4, minHeight: 44, textAlignVertical: 'top' }}
                                 multiline
                                 textAlignVertical="top"
                                 selectionColor="#F97316"
                             />
                             <TouchableOpacity
                                 onPress={() => { Haptics.selectionAsync(); setIsFavorite(!isFavorite); }}
                                 style={{ marginLeft: 8, backgroundColor: isDark ? '#1A1A1A' : '#F3F4F6', width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: isDark ? '#2A2A2A' : '#E5E7EB', marginTop: 4 }}
                             >
                                 <Heart size={22} color={isFavorite ? '#F97316' : '#9CA3AF'} fill={isFavorite ? '#F97316' : 'transparent'} />
                             </TouchableOpacity>
                         </View>

                         {/* Badge de calorías */}
                         <LinearGradient
                             colors={ZENIT_GRADIENT}
                             start={{ x: 0, y: 0 }}
                             end={{ x: 1, y: 0 }}
                             style={{ alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 999, marginTop: 12, marginBottom: 20 }}
                         >
                             <Sparkles size={16} color="white" />
                             <TextInput
                                 value={String(editableData.totalCalories)}
                                 onChangeText={handleCaloriesChange}
                                 keyboardType="numeric"
                                 style={{ color: 'white', fontWeight: '900', fontSize: 20, marginLeft: 8, padding: 0, margin: 0, minWidth: 30, textAlign: 'center' }}
                                 selectionColor="white"
                             />
                             <Text style={{ color: 'white', fontWeight: '900', fontSize: 18, marginLeft: 4 }}>KCAL</Text>
                         </LinearGradient>

                         {/* Selector de porciones — light/dark */}
                         {baseDataRef.current?.portionPresets && baseDataRef.current.portionPresets.length > 0 && (
                             <View style={{
                                 backgroundColor: isDark ? '#1A1A1A' : '#F9FAFB',
                                 padding: 16,
                                 borderRadius: 20,
                                 borderWidth: 1,
                                 borderColor: isDark ? '#2A2A2A' : '#F3F4F6',
                                 marginBottom: 24,
                             }}>
                                 {/* Header */}
                                 <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                                     <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                         <LinearGradient
                                             colors={ZENIT_GRADIENT}
                                             start={{ x: 0, y: 0 }}
                                             end={{ x: 1, y: 0 }}
                                             style={{ width: 6, height: 6, borderRadius: 3, marginRight: 8 }}
                                         />
                                         <Text style={{ color: isDark ? '#9CA3AF' : '#6B7280', fontSize: 11, fontWeight: '700', letterSpacing: 0.5, textTransform: 'uppercase' }}>
                                             {baseDataRef.current.servingType === 'container_or_bulk' ? 'Tamaño de tu porción' : 'Porción consumida'}
                                         </Text>
                                     </View>
                                     {baseDataRef.current.servingType === 'container_or_bulk' && (
                                         <Text style={{ color: isDark ? '#6B7280' : '#9CA3AF', fontSize: 11, fontWeight: '600' }}>
                                             Total: {baseDataRef.current.totalCalories} kcal
                                         </Text>
                                     )}
                                 </View>

                                 {/* Grid 2x2 */}
                                 <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                                     {baseDataRef.current.portionPresets.slice(0, 4).map((preset, idx) => {
                                         const isSelected = selectedPortionLabel === preset.label;
                                         return (
                                             <TouchableOpacity
                                                 key={idx}
                                                 onPress={() => handleSelectPortion(preset)}
                                                 activeOpacity={0.75}
                                                 style={{
                                                     width: '47.5%',
                                                     paddingVertical: 14,
                                                     paddingHorizontal: 8,
                                                     borderRadius: 14,
                                                     alignItems: 'center',
                                                     justifyContent: 'center',
                                                     borderWidth: 1.5,
                                                     backgroundColor: isSelected
                                                         ? (isDark ? '#2A1400' : '#FFF7ED')
                                                         : (isDark ? '#141414' : '#FFFFFF'),
                                                     borderColor: isSelected ? '#F97316' : (isDark ? '#2A2A2A' : '#E5E7EB'),
                                                     ...(isSelected ? {
                                                         shadowColor: '#F97316',
                                                         shadowOffset: { width: 0, height: 2 },
                                                         shadowOpacity: 0.2,
                                                         shadowRadius: 6,
                                                         elevation: 3,
                                                     } : {}),
                                                 }}
                                             >
                                                 <Text
                                                     style={{
                                                         fontSize: 13,
                                                         fontWeight: '700',
                                                         textAlign: 'center',
                                                         color: isSelected ? '#F97316' : (isDark ? '#9CA3AF' : '#374151'),
                                                     }}
                                                     numberOfLines={1}
                                                 >
                                                     {preset.label}
                                                 </Text>
                                             </TouchableOpacity>
                                         );
                                     })}
                                 </View>
                             </View>
                         )}

                         {/* Macro cards */}
                         <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 24, gap: 12 }}>
                             <MacroCard isDark={isDark} label="Proteína" value={editableData.totalProtein} onChangeText={(t) => handleMacroChange('totalProtein', t)} />
                             <MacroCard isDark={isDark} label="Carbos" value={editableData.totalCarbs} onChangeText={(t) => handleMacroChange('totalCarbs', t)} />
                             <MacroCard isDark={isDark} label="Grasas" value={editableData.totalFat} onChangeText={(t) => handleMacroChange('totalFat', t)} />
                         </View>

                         {/* Consultar coach */}
                         <TouchableOpacity
                             activeOpacity={0.85}
                             onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); setShowCoachChat(true); }}
                             style={{ marginBottom: 24, borderRadius: 16, overflow: 'hidden' }}
                         >
                             <LinearGradient
                                 colors={ZENIT_GRADIENT}
                                 start={{ x: 0, y: 0 }}
                                 end={{ x: 1, y: 0 }}
                                 style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 16, borderRadius: 16 }}
                             >
                                 <Sparkles size={20} color="white" />
                                 <Text style={{ color: 'white', fontWeight: '900', fontSize: 16, marginLeft: 8 }}>Consultar Zenit Coach</Text>
                             </LinearGradient>
                         </TouchableOpacity>

                         {/* Ingredientes */}
                         <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                             <Text style={{ color: isDark ? '#F9FAFB' : '#111827', fontWeight: '700', fontSize: 18 }}>Ingredientes</Text>
                             <TouchableOpacity onPress={() => { Haptics.selectionAsync(); setEditableData({...editableData, ingredients: [...editableData.ingredients, '']}); }}>
                                 <LinearGradient colors={ZENIT_GRADIENT} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 999 }}>
                                     <Plus size={14} color="white" />
                                     <Text style={{ color: 'white', fontWeight: '700', fontSize: 12, marginLeft: 4 }}>Agregar</Text>
                                 </LinearGradient>
                             </TouchableOpacity>
                         </View>

                         <View style={{ backgroundColor: isDark ? '#1A1A1A' : '#F9FAFB', borderRadius: 20, padding: 8, borderWidth: 1, borderColor: isDark ? '#2A2A2A' : '#F3F4F6', marginBottom: 8 }}>
                             {editableData.ingredients.map((ing, i) => (
                                 <View key={i} style={{ paddingVertical: 4, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderBottomWidth: i !== editableData.ingredients.length - 1 ? 1 : 0, borderBottomColor: isDark ? '#1F1F1F' : '#F3F4F6' }}>
                                     <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                                         <LinearGradient colors={ZENIT_GRADIENT} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={{ width: 8, height: 8, borderRadius: 4, marginRight: 12 }} />
                                         <TextInput
                                             value={ing}
                                             onChangeText={(t) => { const newIng = [...editableData.ingredients]; newIng[i] = t; setEditableData({...editableData, ingredients: newIng}); }}
                                             placeholder="Nombre..."
                                             placeholderTextColor="#9CA3AF"
                                             style={{ color: isDark ? '#E5E7EB' : '#1F2937', fontSize: 15, fontWeight: '500', flex: 1, paddingVertical: 12, padding: 0, margin: 0 }}
                                             selectionColor="#F97316"
                                         />
                                     </View>
                                     <TouchableOpacity onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); const newIng = [...editableData.ingredients]; newIng.splice(i, 1); setEditableData({...editableData, ingredients: newIng}); }} style={{ padding: 8 }}>
                                         <X size={18} color="#9CA3AF" />
                                     </TouchableOpacity>
                                 </View>
                             ))}
                         </View>

                         {/* Botones de acción — al final del scroll, no flotando */}
                         <View style={{ flexDirection: 'row', gap: 12, marginTop: 28, marginBottom: 8 }}>
                             {/* Descartar */}
                             <TouchableOpacity
                                 activeOpacity={0.75}
                                 onPress={handleDiscard}
                                 style={{
                                     flex: 1,
                                     borderRadius: 16,
                                     borderWidth: 1.5,
                                     borderColor: isDark ? '#2A2A2A' : '#E5E7EB',
                                     backgroundColor: 'transparent',
                                     paddingVertical: 16,
                                     alignItems: 'center',
                                     justifyContent: 'center',
                                 }}
                             >
                                 <Text style={{ color: isDark ? '#6B7280' : '#9CA3AF', fontWeight: '700', fontSize: 15 }}>Descartar</Text>
                             </TouchableOpacity>

                             {/* Guardar Macros */}
                             <TouchableOpacity
                                 activeOpacity={0.85}
                                 onPress={handleSave}
                                 style={{ flex: 1, borderRadius: 16, overflow: 'hidden' }}
                             >
                                 <LinearGradient
                                     colors={ZENIT_GRADIENT}
                                     start={{ x: 0, y: 0 }}
                                     end={{ x: 1, y: 0 }}
                                     style={{ paddingVertical: 16, alignItems: 'center', justifyContent: 'center', borderRadius: 16 }}
                                 >
                                     <Text style={{ color: 'white', fontWeight: '900', fontSize: 15 }}>Guardar Macros</Text>
                                 </LinearGradient>
                             </TouchableOpacity>
                         </View>
                     </View>
                  </ScrollView>
              </KeyboardAvoidingView>

              {/* Hint tutorial flotante con flecha animada (se muestra sobre el contenido) */}
              {!showCoachChat && (
                  <Animated.View
                      pointerEvents="box-none"
                      style={[{
                          position: 'absolute',
                          bottom: 28,
                          left: 0,
                          right: 0,
                          alignItems: 'center',
                          zIndex: 999,
                          elevation: 25,
                      }, hintStyle]}
                  >
                      <TouchableOpacity
                          activeOpacity={0.85}
                          onPress={handleScrollToBottom}
                          style={{
                              flexDirection: 'row',
                              alignItems: 'center',
                              backgroundColor: isDark ? 'rgba(28,28,30,0.95)' : 'rgba(18,18,18,0.90)',
                              paddingHorizontal: 18,
                              paddingVertical: 11,
                              borderRadius: 999,
                              borderWidth: 1,
                              borderColor: isDark ? 'rgba(255,255,255,0.15)' : 'rgba(255,255,255,0.22)',
                              shadowColor: '#000',
                              shadowOffset: { width: 0, height: 4 },
                              shadowOpacity: 0.3,
                              shadowRadius: 8,
                              elevation: 10,
                              gap: 8,
                          }}
                      >
                          <Animated.View style={arrowStyle}>
                              <ChevronDown size={18} color="#F97316" strokeWidth={2.5} />
                          </Animated.View>
                          <Text style={{ color: '#FFFFFF', fontSize: 13, fontWeight: '700', letterSpacing: 0.2 }}>
                              Deslizá para guardar la comida
                          </Text>
                      </TouchableOpacity>
                  </Animated.View>
              )}

             {showCoachChat && (
                 <CoachChatOverlay
                    isDark={isDark}
                    editableData={editableData}
                    onClose={() => setShowCoachChat(false)}
                    showAlert={showCustomAlert}
                    userData={{
                        name: userName || "Nacho",
                        goal: userGoal || "Ganar masa muscular (Volumen limpio)",
                        macros: {
                            calories: Math.max(0, (targetMacros?.calories || 2500) - (consumedMacros?.calories || 0)),
                            protein: Math.max(0, (targetMacros?.protein || 150) - (consumedMacros?.protein || 0)),
                            carbs: Math.max(0, (targetMacros?.carbs || 300) - (consumedMacros?.carbs || 0)),
                            fats: Math.max(0, (targetMacros?.fats || 50) - (consumedMacros?.fats || 0))
                        }
                    }}
                 />
             )}
          </Animated.View>
      )}

      {/* Modal de Alertas y Confirmaciones con Estética Zenit */}
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

// ==========================================
// SUBCOMPONENTE: MACROCARD — Inline styles con dark/light
// ==========================================
const MacroCard = React.memo(({ label, value, onChangeText, isDark }) => (
    <View style={{
        flex: 1,
        backgroundColor: isDark ? '#1A1A1A' : '#F9FAFB',
        paddingVertical: 20,
        paddingHorizontal: 8,
        borderRadius: 24,
        borderWidth: 1,
        borderColor: isDark ? '#2A2A2A' : '#F3F4F6',
        alignItems: 'center',
    }}>
        <Text style={{ color: isDark ? '#6B7280' : '#9CA3AF', fontSize: 10, fontWeight: '900', letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 4 }}>
            {label}
        </Text>
        <View style={{ flexDirection: 'row', alignItems: 'baseline' }}>
            <TextInput
                value={String(value)}
                onChangeText={(t) => onChangeText(t.replace(/[^0-9.]/g, ''))}
                keyboardType="numeric"
                style={{ color: isDark ? '#F9FAFB' : '#111827', fontSize: 24, fontWeight: '900', padding: 0, margin: 0, minWidth: 24, textAlign: 'center' }}
                selectionColor="#F97316"
            />
            <Text style={{ color: isDark ? '#6B7280' : '#6B7280', fontWeight: '700', fontSize: 12, marginLeft: 2 }}>g</Text>
        </View>
    </View>
));