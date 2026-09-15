import React from 'react';
import { View, Text, Modal, TouchableOpacity, StyleSheet, TouchableWithoutFeedback } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import Animated, { FadeIn, FadeInDown, Easing } from 'react-native-reanimated';
import { AlertTriangle, Trash2, Info, CheckCircle2 } from 'lucide-react-native';
import { ZENIT_GRADIENT } from '../../constants/theme';

export const ZenitModalAlert = ({
    visible,
    title,
    message,
    type = 'warning', // 'warning' | 'danger' | 'info' | 'success'
    icon: CustomIcon,
    confirmText = 'Entendido',
    cancelText,
    onConfirm,
    onCancel,
    isDark = false,
}) => {
    if (!visible) return null;

    const handleConfirm = () => {
        try {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        } catch (e) {}
        if (onConfirm) onConfirm();
    };

    const handleCancel = () => {
        try {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        } catch (e) {}
        if (onCancel) onCancel();
    };

    // Configuración del icono según el tipo
    const getIconConfig = () => {
        if (CustomIcon) return { Icon: CustomIcon, color: '#F97316', bg: 'rgba(249, 115, 22, 0.12)', border: 'rgba(249, 115, 22, 0.25)' };
        switch (type) {
            case 'danger':
                return { Icon: Trash2, color: '#DC2626', bg: 'rgba(220, 38, 38, 0.12)', border: 'rgba(220, 38, 38, 0.25)' };
            case 'info':
                return { Icon: Info, color: '#3B82F6', bg: 'rgba(59, 130, 246, 0.12)', border: 'rgba(59, 130, 246, 0.25)' };
            case 'success':
                return { Icon: CheckCircle2, color: '#10B981', bg: 'rgba(16, 185, 129, 0.12)', border: 'rgba(16, 185, 129, 0.25)' };
            case 'warning':
            default:
                return { Icon: AlertTriangle, color: '#F97316', bg: 'rgba(249, 115, 22, 0.12)', border: 'rgba(249, 115, 22, 0.25)' };
        }
    };

    const { Icon, color, bg, border } = getIconConfig();

    return (
        <Modal
            animationType="fade"
            transparent={true}
            visible={visible}
            onRequestClose={onCancel || onConfirm}
            statusBarTranslucent={true}
        >
            <TouchableWithoutFeedback onPress={onCancel || onConfirm}>
                <View style={styles.backdrop}>
                    <TouchableWithoutFeedback>
                        <Animated.View
                            entering={FadeInDown.duration(260).easing(Easing.out(Easing.cubic))}
                            style={[
                                styles.card,
                                {
                                    backgroundColor: isDark ? '#141414' : '#FFFFFF',
                                    borderColor: isDark ? '#262626' : '#F3F4F6',
                                    shadowOpacity: isDark ? 0.45 : 0.15,
                                }
                            ]}
                        >
                            {/* Icon Badge */}
                            <View style={[styles.iconCircle, { backgroundColor: bg, borderColor: border }]}>
                                <Icon size={28} color={color} strokeWidth={2.2} />
                            </View>

                            {/* Título */}
                            {title ? (
                                <Text style={[styles.title, { color: isDark ? '#F9FAFB' : '#111827' }]}>
                                    {title}
                                </Text>
                            ) : null}

                            {/* Mensaje explicativo */}
                            {message ? (
                                <Text style={[styles.message, { color: isDark ? '#9CA3AF' : '#6B7280' }]}>
                                    {message}
                                </Text>
                            ) : null}

                            {/* Fila de Botones */}
                            <View style={styles.buttonRow}>
                                {cancelText ? (
                                    <TouchableOpacity
                                        activeOpacity={0.75}
                                        onPress={handleCancel}
                                        style={[
                                            styles.cancelBtn,
                                            {
                                                borderColor: isDark ? '#2A2A2A' : '#E5E7EB',
                                            }
                                        ]}
                                    >
                                        <Text style={[styles.cancelText, { color: isDark ? '#9CA3AF' : '#6B7280' }]}>
                                            {cancelText}
                                        </Text>
                                    </TouchableOpacity>
                                ) : null}

                                <TouchableOpacity
                                    activeOpacity={0.85}
                                    onPress={handleConfirm}
                                    style={[
                                        styles.confirmBtnWrapper,
                                        cancelText ? { flex: 1 } : { width: '100%' }
                                    ]}
                                >
                                    <LinearGradient
                                        colors={ZENIT_GRADIENT}
                                        start={{ x: 0, y: 0 }}
                                        end={{ x: 1, y: 0 }}
                                        style={styles.confirmGradient}
                                    >
                                        <Text style={styles.confirmText}>
                                            {confirmText}
                                        </Text>
                                    </LinearGradient>
                                </TouchableOpacity>
                            </View>
                        </Animated.View>
                    </TouchableWithoutFeedback>
                </View>
            </TouchableWithoutFeedback>
        </Modal>
    );
};

const styles = StyleSheet.create({
    backdrop: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 28,
    },
    card: {
        width: '100%',
        maxWidth: 360,
        borderRadius: 28,
        paddingHorizontal: 24,
        paddingTop: 28,
        paddingBottom: 22,
        alignItems: 'center',
        borderWidth: 1,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowRadius: 24,
        elevation: 16,
    },
    iconCircle: {
        width: 60,
        height: 60,
        borderRadius: 30,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        marginBottom: 16,
    },
    title: {
        fontSize: 20,
        fontWeight: '900',
        textAlign: 'center',
        letterSpacing: -0.3,
        marginBottom: 8,
    },
    message: {
        fontSize: 14,
        lineHeight: 21,
        textAlign: 'center',
        marginBottom: 24,
        paddingHorizontal: 4,
    },
    buttonRow: {
        flexDirection: 'row',
        width: '100%',
        gap: 12,
        alignItems: 'center',
    },
    cancelBtn: {
        flex: 1,
        paddingVertical: 14,
        borderRadius: 16,
        borderWidth: 1.5,
        backgroundColor: 'transparent',
        alignItems: 'center',
        justifyContent: 'center',
    },
    cancelText: {
        fontSize: 14,
        fontWeight: '700',
    },
    confirmBtnWrapper: {
        borderRadius: 16,
        overflow: 'hidden',
    },
    confirmGradient: {
        paddingVertical: 14,
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 16,
    },
    confirmText: {
        color: '#FFFFFF',
        fontWeight: '900',
        fontSize: 14,
        letterSpacing: 0.2,
    },
});

