import React, { useState, useRef, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image, Alert, ScrollView, Dimensions, TextInput, KeyboardAvoidingView, Platform, useColorScheme, PanResponder, BackHandler } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { Zap, ZapOff, RotateCcw, X, ChevronLeft, Sparkles, Check, Plus, Heart, Send, Mic, Trash2, Lock, Play, Pause, ChevronDown, ChevronUp, FileText, Trophy, ShieldCheck } from 'lucide-react-native';
import Animated, { FadeIn, FadeOut, SlideInDown, SlideInRight, SlideOutRight, FadeInUp, useSharedValue, useAnimatedStyle, withTiming, withRepeat, Easing, useAnimatedReaction, runOnJS, withSequence, withDelay, LinearTransition } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { Audio } from 'expo-av';
import * as SpeechRecognition from 'expo-speech-recognition';

import { ZENIT_GRADIENT } from '../constants/theme'; 
import { analyzeFoodImage, chatWithCoach, generateInitialCoachWidgets } from '../services/ai/geminiVisionService';
import { useUserStore } from '../store/useUserStore';

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

const avoidBtnShadow = {
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
};

const portionBoxShadow = {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 3,
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
const CoachChatOverlay = ({ isDark, editableData, onClose, userData, onAvoidFood }) => {
    const inputRef = useRef(null);
    const textRef = useRef(''); 
    const chatScrollRef = useRef(null);
    
    const [hasText, setHasText] = useState(false); 
    const [isTyping, setIsTyping] = useState(true); 
    const [coachMessages, setCoachMessages] = useState([]); 

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
            Alert.alert("Error", "Zenit Coach está descansando. Intentá de nuevo.");
        } finally {
            setIsTyping(false);
        }
    };

    // ==========================================
    // LÓGICA DE GRABACIÓN (STT NATIVO + AUDIO PERSISTENTE)
    // ==========================================
    const startRecording = async () => {
        if (isPreparingRef.current) return;
        isPreparingRef.current = true;

        try {
            // 1. Pedir permisos al STT nativo
            const sttPerm = await SpeechRecognition.ExpoSpeechRecognitionModule.requestPermissionsAsync();
            if (!sttPerm.granted) {
                isPreparingRef.current = false;
                return Alert.alert("Permiso denegado", "Activá el micrófono en Ajustes para usar notas de voz.");
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
                            Alert.alert("Error", "No pudimos procesar tu mensaje con el coach. Intentá de nuevo.");
                        } finally {
                            setIsTyping(false);
                        }
                    } else {
                        Alert.alert("Aviso", "No se detectó texto claro en el audio. Intentá hablar más cerca del micrófono.");
                    }
                } else {
                    Alert.alert("Aviso", "No se detectó audio ni voz.");
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
                        <View style={{ width: 40, height: 40 }} />
                    </View>

                    {/* Acción rápida de victoria: Decidí no comerlo */}
                    {onAvoidFood && (
                        <View style={{ paddingHorizontal: 16, paddingBottom: 10, alignItems: 'center' }}>
                            <TouchableOpacity
                                onPress={onAvoidFood}
                                activeOpacity={0.8}
                                style={{
                                    flexDirection: 'row',
                                    alignItems: 'center',
                                    backgroundColor: isDark ? 'rgba(16, 185, 129, 0.15)' : 'rgba(16, 185, 129, 0.1)',
                                    borderColor: isDark ? 'rgba(16, 185, 129, 0.35)' : 'rgba(16, 185, 129, 0.25)',
                                    borderWidth: 1,
                                    paddingVertical: 7,
                                    paddingHorizontal: 16,
                                    borderRadius: 999,
                                }}
                            >
                                <Trophy size={14} color="#10B981" />
                                <Text style={{ color: isDark ? '#34D399' : '#059669', fontWeight: 'bold', fontSize: 13, marginLeft: 6 }}>
                                    Decidí no comerlo · Ahorrar calorías
                                </Text>
                            </TouchableOpacity>
                        </View>
                    )}

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
                                    placeholder={isRecording ? "Grabando audio..." : "Preguntale al coach..."}
                                    placeholderTextColor="#9CA3AF"
                                    editable={!isRecording}
                                    style={s.textInput}
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
                                    {...micPanResponder.panHandlers}
                                    style={animatedMicStyle}
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

  // Datos globales del usuario y macros
  const addConsumedFood = useUserStore((state) => state.addConsumedFood);
  const recordAvoidedFood = useUserStore((state) => state.recordAvoidedFood);
  const targetMacros = useUserStore((state) => state.targetMacros);
  const consumedMacros = useUserStore((state) => state.consumedMacros);
  const userName = useUserStore((state) => state.name);
  const userGoal = useUserStore((state) => state.goal);

  const appStateRef = useRef(appState);
  useEffect(() => {
    appStateRef.current = appState;
  }, [appState]);

  const isLeavingRef = useRef(false);

  const progress = useSharedValue(0);
  const progressStyle = useAnimatedStyle(() => ({ width: `${progress.value}%` }));

  // Función para resetear por completo el estado del escáner
  const resetScanState = () => {
    setPhoto(null);
    setEditableData(null);
    setSelectedPortionLabel(null);
    baseDataRef.current = null;
    setIsFavorite(false);
    setShowCoachChat(false);
    progress.value = 0;
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
    setSelectedPortionLabel(preset.label);
    const mult = typeof preset.multiplier === 'number' ? preset.multiplier : 1;
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
      Alert.alert(
        "¿Volver a la pantalla principal?",
        "¿Estás seguro de que deseas volver a la pantalla principal? Se perderá todo el progreso del escaneo actual.",
        [
          { text: "Continuar aquí", style: "cancel" },
          {
            text: "Sí, salir",
            style: "destructive",
            onPress: () => {
              isLeavingRef.current = true;
              resetScanState();
              if (navigationRef.current?.navigate) navigationRef.current.navigate('Home');
              else if (navigationRef.current?.goBack) navigationRef.current.goBack();
            }
          }
        ]
      );
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
        Alert.alert(
          "¿Volver a la pantalla principal?",
          "¿Estás seguro de que deseas volver a la pantalla principal? Se perderá todo el progreso del escaneo actual.",
          [
            { text: "Continuar aquí", style: "cancel" },
            {
              text: "Sí, salir",
              style: "destructive",
              onPress: () => {
                isLeavingRef.current = true;
                resetScanState();
                if (navigationRef.current?.navigate) navigationRef.current.navigate('Home');
                else if (navigationRef.current?.goBack) navigationRef.current.goBack();
              }
            }
          ]
        );
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
    
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setAppState('capturing'); 
    appStateRef.current = 'capturing';

    try {
      const photoData = await cameraRef.current.takePictureAsync({ quality: 0.5, base64: true, skipProcessing: true });
      setPhoto(photoData);

      setAppState('processing');
      appStateRef.current = 'processing';
      progress.value = 0;
      progress.value = withTiming(90, { duration: 5000, easing: Easing.out(Easing.ease) });

      const result = await analyzeFoodImage(photoData.base64);
      
      if (!result.isFood) {
          progress.value = 0;
          setAppState('idle');
          appStateRef.current = 'idle';
          setPhoto(null);
          Alert.alert("Objeto no reconocido", "Parece que no hay comida en la foto. Zenit solo analiza alimentos.");
          return;
      }

      baseDataRef.current = result;
      if (result.portionPresets && result.portionPresets.length > 0) {
        const defaultPreset = result.portionPresets[0];
        setSelectedPortionLabel(defaultPreset.label);
        setEditableData({
          ...result,
          totalCalories: Math.round(result.totalCalories * defaultPreset.multiplier),
          totalProtein: Math.round(result.totalProtein * defaultPreset.multiplier),
          totalCarbs: Math.round(result.totalCarbs * defaultPreset.multiplier),
          totalFat: Math.round(result.totalFat * defaultPreset.multiplier),
        });
      } else {
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
      Alert.alert("Error Detectado", String(error.message || error));
      setAppState('idle');
      appStateRef.current = 'idle';
      setPhoto(null);
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

  // Acción cuando el usuario decide no comer el alimento escaneado (Victoria de disciplina)
  const handleAvoidFood = () => {
    if (!editableData) return;

    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    const avoidedCals = Number(editableData.totalCalories) || 0;
    recordAvoidedFood({
      name: editableData.mealName || "Comida evitada",
      calories: avoidedCals,
    });

    Alert.alert(
      "¡Gran victoria de disciplina! 🏆",
      `Decidiste no comer "${editableData.mealName || 'este plato'}" y ahorraste ~${avoidedCals} kcal.\n\n¡Cada decisión consciente te acerca a tu meta, ${userName || 'campeón'}!`,
      [
        {
          text: "¡Vamos!",
          onPress: () => {
            isLeavingRef.current = true;
            resetScanState();
            if (navigation?.navigate) navigation.navigate('Home');
            else if (navigation?.goBack) navigation.goBack();
          }
        }
      ]
    );
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
                     className="flex-1" 
                     contentContainerStyle={{ flexGrow: 1, justifyContent: 'flex-end' }} 
                     showsVerticalScrollIndicator={false} 
                     bounces={true} 
                     keyboardShouldPersistTaps="handled"
                     scrollEventThrottle={16}
                     removeClippedSubviews={Platform.OS === 'android'}
                     overScrollMode="never"
                     keyboardDismissMode="on-drag"
                 >
                    <View style={{ height: SCREEN_HEIGHT * 0.55 }} />
                    <View 
                        className="bg-white rounded-t-[40px] pt-4 px-6 pb-40"
                        style={{ shadowColor: '#000', shadowOffset: { width: 0, height: -10 }, shadowOpacity: 0.12, shadowRadius: 20, elevation: 10 }}
                    >
                        <View className="w-12 h-1.5 bg-gray-300 rounded-full self-center mb-6" />

                        <View className="flex-row justify-between items-start mt-2">
                            <TextInput 
                                value={editableData.mealName} 
                                onChangeText={(t) => setEditableData({...editableData, mealName: t})} 
                                className="text-gray-900 text-3xl font-black tracking-tight flex-1 mr-2" 
                                multiline 
                                textAlignVertical="top"
                                style={{ lineHeight: 36, paddingVertical: 4, minHeight: 44 }}
                                selectionColor="#F97316" 
                            />
                            <TouchableOpacity 
                                onPress={() => { Haptics.selectionAsync(); setIsFavorite(!isFavorite); }} 
                                className="ml-2 bg-gray-100 w-12 h-12 rounded-full items-center justify-center border border-gray-200 mt-1"
                            >
                                <Heart size={22} color={isFavorite ? "#F97316" : "#9CA3AF"} fill={isFavorite ? "#F97316" : "transparent"} />
                            </TouchableOpacity>
                        </View>
                        
                        <LinearGradient colors={ZENIT_GRADIENT} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={{ alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 999, marginTop: 12, marginBottom: 16 }}>
                            <Sparkles size={16} color="white" />
                            <TextInput value={String(editableData.totalCalories)} onChangeText={(t) => setEditableData({...editableData, totalCalories: t.replace(/[^0-9]/g, '')})} keyboardType="numeric" className="text-white font-black text-xl ml-2 p-0 m-0 min-w-[30px] text-center" selectionColor="white" />
                            <Text className="text-white font-black text-lg ml-1">KCAL</Text>
                        </LinearGradient>

                        {/* Selector de porciones en 2 hileras (Grid 2x2) sin scroll, tono negro #0A0A0A (Estilos inline a prueba de crashes) */}
                        {baseDataRef.current?.portionPresets && baseDataRef.current.portionPresets.length > 0 && (
                            <View style={[{ backgroundColor: '#0A0A0A', padding: 16, borderRadius: 24, borderWidth: 1, borderColor: '#1F2937', marginBottom: 24 }, portionBoxShadow]}>
                                <View className="flex-row justify-between items-center mb-3">
                                    <View className="flex-row items-center">
                                        <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: '#F97316', marginRight: 8 }} />
                                        <Text className="text-white font-bold text-xs uppercase tracking-wider">
                                            {baseDataRef.current.servingType === 'container_or_bulk' ? 'Tamaño de tu porción' : 'Porción consumida'}
                                        </Text>
                                    </View>
                                    {baseDataRef.current.servingType === 'container_or_bulk' && (
                                        <Text style={{ color: '#9CA3AF', fontSize: 11, fontWeight: '600' }}>
                                            Envase total: {baseDataRef.current.totalCalories} kcal
                                        </Text>
                                    )}
                                </View>
                                <View className="flex-row flex-wrap justify-between">
                                    {baseDataRef.current.portionPresets.slice(0, 4).map((preset, idx) => {
                                        const isSelected = selectedPortionLabel === preset.label;
                                        return (
                                            <TouchableOpacity
                                                key={idx}
                                                onPress={() => handleSelectPortion(preset)}
                                                activeOpacity={0.7}
                                                style={{
                                                    width: '48.5%',
                                                    paddingVertical: 12,
                                                    paddingHorizontal: 8,
                                                    borderRadius: 16,
                                                    marginBottom: 10,
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    borderWidth: 1,
                                                    backgroundColor: isSelected ? '#F97316' : '#141414',
                                                    borderColor: isSelected ? '#F97316' : '#1F2937',
                                                    ...(isSelected ? {
                                                        shadowColor: '#F97316',
                                                        shadowOffset: { width: 0, height: 2 },
                                                        shadowOpacity: 0.35,
                                                        shadowRadius: 4,
                                                        elevation: 3,
                                                    } : {})
                                                }}
                                            >
                                                <Text 
                                                    style={{
                                                        fontSize: 12,
                                                        fontWeight: '900',
                                                        textAlign: 'center',
                                                        color: isSelected ? '#ffffff' : '#D1D5DB'
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

                        <View className="flex-row justify-between mb-8 gap-x-3">
                            <MacroCard label="Proteína" value={editableData.totalProtein} onChangeText={(t) => setEditableData({...editableData, totalProtein: t})} />
                            <MacroCard label="Carbos" value={editableData.totalCarbs} onChangeText={(t) => setEditableData({...editableData, totalCarbs: t})} />
                            <MacroCard label="Grasas" value={editableData.totalFat} onChangeText={(t) => setEditableData({...editableData, totalFat: t})} />
                        </View>

                        <TouchableOpacity 
                            activeOpacity={0.85} 
                            onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); setShowCoachChat(true); }} 
                            style={[{ marginBottom: 12, borderRadius: 16, overflow: 'hidden' }, coachBtnShadow]}
                        >
                            <LinearGradient
                                colors={ZENIT_GRADIENT}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 0 }}
                                style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 16, borderRadius: 16 }}
                            >
                                <Sparkles size={20} color="white" />
                                <Text className="text-white font-black text-base ml-2 tracking-wide">Consultar Zenit Coach</Text>
                            </LinearGradient>
                        </TouchableOpacity>

                        <TouchableOpacity 
                            activeOpacity={0.85} 
                            onPress={handleAvoidFood} 
                            style={[{ marginBottom: 36, borderRadius: 16, overflow: 'hidden' }, avoidBtnShadow]}
                        >
                            <LinearGradient
                                colors={['#059669', '#10B981']}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 0 }}
                                style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 16, borderRadius: 16 }}
                            >
                                <ShieldCheck size={20} color="white" />
                                <Text className="text-white font-black text-base ml-2 tracking-wide">
                                    Decidí no comerlo
                                </Text>
                            </LinearGradient>
                        </TouchableOpacity>

                        <View className="flex-row justify-between items-center mb-4">
                            <Text className="text-gray-900 font-bold text-xl tracking-tight">Ingredientes</Text>
                            <TouchableOpacity onPress={() => { Haptics.selectionAsync(); setEditableData({...editableData, ingredients: [...editableData.ingredients, ""]}); }}>
                                <LinearGradient colors={ZENIT_GRADIENT} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 999 }}>
                                    <Plus size={14} color="white" />
                                    <Text className="text-white font-bold text-xs ml-1">Agregar</Text>
                                </LinearGradient>
                            </TouchableOpacity>
                        </View>

                        <View className="bg-gray-50 rounded-3xl p-2 border border-gray-100 mb-4">
                            {editableData.ingredients.map((ing, i) => (
                                <View key={i} className={`py-1 px-4 flex-row items-center justify-between ${i !== editableData.ingredients.length - 1 ? 'border-b border-gray-200' : ''}`}>
                                    <View className="flex-row items-center flex-1">
                                        <LinearGradient colors={ZENIT_GRADIENT} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={{ width: 8, height: 8, borderRadius: 4, marginRight: 12 }} />
                                        <TextInput value={ing} onChangeText={(t) => { const newIng = [...editableData.ingredients]; newIng[i] = t; setEditableData({...editableData, ingredients: newIng}); }} placeholder="Nombre..." placeholderTextColor="#9CA3AF" className="text-gray-800 text-base font-medium flex-1 py-3 p-0 m-0 capitalize" selectionColor="#F97316" />
                                    </View>
                                    <TouchableOpacity onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); const newIng = [...editableData.ingredients]; newIng.splice(i, 1); setEditableData({...editableData, ingredients: newIng}); }} className="p-2">
                                        <X size={18} color="#9CA3AF" />
                                    </TouchableOpacity>
                                </View>
                            ))}
                        </View>
                    </View>
                    <View className="w-full h-40 bg-white mt-[-2px]" />
                 </ScrollView>
             </KeyboardAvoidingView>

             {showCoachChat && (
                 <CoachChatOverlay 
                    isDark={isDark} 
                    editableData={editableData} 
                    onClose={() => setShowCoachChat(false)} 
                    onAvoidFood={handleAvoidFood}
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

             {!showCoachChat && (
                 <View className="absolute bottom-8 right-6 z-50 pointer-events-box-none">
                     <TouchableOpacity onPress={handleSave} activeOpacity={0.8}>
                         <LinearGradient colors={ZENIT_GRADIENT} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ width: 68, height: 68, borderRadius: 34, alignItems: 'center', justifyContent: 'center', shadowColor: '#F97316', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.4, shadowRadius: 16, elevation: 10 }}>
                             <Check size={32} color="white" />
                         </LinearGradient>
                     </TouchableOpacity>
                 </View>
             )}
          </Animated.View>
      )}
    </View>
  );
}

// ==========================================
// SUBCOMPONENTE: MACROCARD (MEMOIZADO 60FPS)
// ==========================================
const MacroCard = React.memo(({ label, value, onChangeText }) => (
    <View className="flex-1 bg-gray-50 py-5 px-2 rounded-3xl border border-gray-100 items-center">
        <Text className="text-gray-400 text-[10px] font-black tracking-widest uppercase mb-1">{label}</Text>
        <View className="flex-row items-baseline">
            <TextInput value={String(value)} onChangeText={(t) => onChangeText(t.replace(/[^0-9.]/g, ''))} keyboardType="numeric" className="text-gray-900 text-2xl font-black p-0 m-0 min-w-[24px] text-center" selectionColor="#F97316" />
            <Text className="text-gray-500 font-bold text-xs ml-1">g</Text>
        </View>
    </View>
));