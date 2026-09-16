import React, { useState } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  TouchableWithoutFeedback,
  StyleSheet,
  Switch,
  Platform,
} from 'react-native';
import Animated, { FadeIn, SlideInDown } from 'react-native-reanimated';
import { Bell, X, Check, Sparkles, Clock, Send } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';

import { ZENIT_GRADIENT } from '../../constants/theme';
import {
  syncWaterReminders,
  sendInstantTestNotification,
} from '../../services/notifications/waterNotificationService';
import { useUserStore } from '../../store/useUserStore';

const INTERVAL_PRESETS = [
  { label: '45 min', minutes: 45 },
  { label: '1 hora', minutes: 60 },
  { label: '1.5 hs', minutes: 90, recommended: true },
  { label: '2 horas', minutes: 120 },
  { label: '3 horas', minutes: 180 },
];

export function WaterReminderModal({ visible, onClose }) {
  const waterReminder = useUserStore((state) => state.waterReminder) || {
    enabled: true,
    intervalMinutes: 90,
  };
  const setWaterReminder = useUserStore((state) => state.setWaterReminder);

  const [enabled, setEnabled] = useState(waterReminder.enabled ?? true);
  const [selectedMinutes, setSelectedMinutes] = useState(waterReminder.intervalMinutes || 90);
  const [testSent, setTestSent] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const handleToggle = (val) => {
    Haptics.selectionAsync();
    setEnabled(val);
  };

  const handleSelectPreset = (minutes) => {
    Haptics.selectionAsync();
    setSelectedMinutes(minutes);
  };

  const handleSendTest = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const res = await sendInstantTestNotification();
    if (res.success) {
      setTestSent(true);
      setTimeout(() => setTestSent(false), 3000);
    }
  };

  const handleSave = async () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setIsSaving(true);

    // 1. Guardar en el store de Zustand persistente
    setWaterReminder({
      enabled,
      intervalMinutes: selectedMinutes,
    });

    // 2. Sincronizar recordatorio local en el sistema con expo-notifications
    await syncWaterReminders(selectedMinutes, enabled);

    setIsSaving(false);
    onClose?.();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <TouchableWithoutFeedback onPress={onClose}>
        <Animated.View entering={FadeIn.duration(200)} style={styles.backdrop}>
          <TouchableWithoutFeedback>
            <Animated.View
              entering={SlideInDown.duration(300)}
              style={styles.modalCard}
            >
              {/* Header con icono y botón cerrar */}
              <View style={styles.headerRow}>
                <View style={styles.iconBadge}>
                  <Bell size={20} color="#0284C7" />
                </View>
                <TouchableOpacity
                  onPress={onClose}
                  hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                  style={styles.closeBtn}
                >
                  <X size={18} color="#94A3B8" />
                </TouchableOpacity>
              </View>

              <Text style={styles.title}>Recordatorios de Agua</Text>
              <Text style={styles.subtitle}>
                Recibí avisos periódicos en tu teléfono para no olvidarte de tomar agua.
              </Text>

              {/* Switch Principal: Activar / Desactivar */}
              <View style={styles.toggleCard}>
                <View style={{ flex: 1, paddingRight: 12 }}>
                  <Text style={styles.toggleTitle}>
                    {enabled ? 'Recordatorios activados' : 'Recordatorios pausados'}
                  </Text>
                  <Text style={styles.toggleSubtitle}>
                    {enabled
                      ? `Aviso cada ${selectedMinutes >= 60 ? `${selectedMinutes / 60} hs` : `${selectedMinutes} min`}`
                      : 'No recibirás notificaciones en tu celular'}
                  </Text>
                </View>
                <Switch
                  value={enabled}
                  onValueChange={handleToggle}
                  trackColor={{ false: '#E2E8F0', true: '#BAE6FD' }}
                  thumbColor={enabled ? '#0284C7' : '#94A3B8'}
                  ios_backgroundColor="#E2E8F0"
                />
              </View>

              {/* Frecuencia de Notificaciones */}
              {enabled && (
                <View style={{ marginTop: 16 }}>
                  <View style={styles.sectionHeader}>
                    <Clock size={14} color="#64748B" />
                    <Text style={styles.sectionLabel}>Frecuencia de aviso:</Text>
                  </View>

                  <View style={styles.presetsGrid}>
                    {INTERVAL_PRESETS.map((preset) => {
                      const isSelected = selectedMinutes === preset.minutes;
                      return (
                        <TouchableOpacity
                          key={preset.minutes}
                          activeOpacity={0.75}
                          onPress={() => handleSelectPreset(preset.minutes)}
                          style={[
                            styles.presetButton,
                            isSelected && styles.presetButtonActive,
                          ]}
                        >
                          <Text
                            style={[
                              styles.presetText,
                              isSelected && styles.presetTextActive,
                            ]}
                          >
                            {preset.label}
                          </Text>
                          {preset.recommended && (
                            <View style={styles.recommendedBadge}>
                              <Text style={styles.recommendedText}>Top</Text>
                            </View>
                          )}
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>
              )}

              {/* Botón de Notificación de Prueba Instantánea */}
              <TouchableOpacity
                activeOpacity={0.75}
                onPress={handleSendTest}
                style={styles.testBtn}
              >
                {testSent ? (
                  <>
                    <Check size={16} color="#10B981" strokeWidth={2.5} />
                    <Text style={styles.testSentText}>¡Notificación enviada al teléfono!</Text>
                  </>
                ) : (
                  <>
                    <Send size={15} color="#0284C7" />
                    <Text style={styles.testBtnText}>Enviar notificación de prueba</Text>
                  </>
                )}
              </TouchableOpacity>

              {/* Botón Guardar */}
              <TouchableOpacity
                activeOpacity={0.88}
                onPress={handleSave}
                disabled={isSaving}
                style={styles.saveBtnWrapper}
              >
                <LinearGradient
                  colors={['#0284C7', '#0369A1']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.saveBtnGradient}
                >
                  <Text style={styles.saveBtnText}>
                    {isSaving ? 'Guardando...' : 'Guardar Preferencias'}
                  </Text>
                </LinearGradient>
              </TouchableOpacity>
            </Animated.View>
          </TouchableWithoutFeedback>
        </Animated.View>
      </TouchableWithoutFeedback>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.55)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: Platform.OS === 'ios' ? 42 : 28,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -6 },
    shadowOpacity: 0.12,
    shadowRadius: 18,
    elevation: 20,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  iconBadge: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#E0F2FE',
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0F172A',
    letterSpacing: -0.4,
  },
  subtitle: {
    fontSize: 13,
    color: '#64748B',
    marginTop: 4,
    lineHeight: 18,
  },
  toggleCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F8FAFC',
    borderRadius: 18,
    padding: 16,
    marginTop: 18,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  toggleTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
  },
  toggleSubtitle: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 10,
  },
  sectionLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#475569',
  },
  presetsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  presetButton: {
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 12,
    backgroundColor: '#F8FAFC',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  presetButtonActive: {
    backgroundColor: '#E0F2FE',
    borderColor: '#0284C7',
  },
  presetText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#475569',
  },
  presetTextActive: {
    color: '#0284C7',
    fontWeight: '800',
  },
  recommendedBadge: {
    backgroundColor: '#0284C7',
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 4,
  },
  recommendedText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '900',
  },
  testBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F0F9FF',
    borderRadius: 14,
    paddingVertical: 12,
    marginTop: 16,
    gap: 8,
    borderWidth: 1,
    borderColor: '#BAE6FD',
  },
  testBtnText: {
    color: '#0284C7',
    fontSize: 13,
    fontWeight: '700',
  },
  testSentText: {
    color: '#10B981',
    fontSize: 13,
    fontWeight: '700',
  },
  saveBtnWrapper: {
    marginTop: 18,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#0284C7',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  saveBtnGradient: {
    paddingVertical: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: 0.2,
  },
});

export default WaterReminderModal;

