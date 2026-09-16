import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  ChevronLeft,
  Droplets,
  Plus,
  Minus,
  Check,
  Target,
  Sparkles,
  Coffee,
  Info,
  Bell,
} from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';

import { useUserStore } from '../store/useUserStore';
import { ZenitModalAlert } from '../components/ui/ZenitModalAlert';
import { WaterReminderModal } from '../components/water/WaterReminderModal';

const QUICK_PRESETS = [
  { label: 'Mate / Café', ml: 150, icon: '☕' },
  { label: 'Vaso de agua', ml: 250, icon: '🥛' },
  { label: 'Vaso grande', ml: 350, icon: '🥤' },
  { label: 'Botella mediana', ml: 500, icon: '💧' },
  { label: 'Termo / Shaker', ml: 750, icon: '🧉' },
  { label: 'Botella grande', ml: 1000, icon: '🍶' },
];

const TARGET_PRESETS = [2000, 2500, 3000, 3500];

export default function WaterTrackerScreen({ navigation }) {
  const dailyWater = useUserStore((state) => state.dailyWater);
  const getDailyWater = useUserStore((state) => state.getDailyWater);
  const addWater = useUserStore((state) => state.addWater);
  const setWater = useUserStore((state) => state.setWater);
  const setWaterTarget = useUserStore((state) => state.setWaterTarget);
  const waterReminder = useUserStore((state) => state.waterReminder);

  const activeWater = getDailyWater ? getDailyWater() : (dailyWater || { amountMl: 0, targetMl: 2500 });
  const [amountInput, setAmountInput] = useState(String(activeWater.amountMl || 0));
  const [targetInput, setTargetInput] = useState(String(activeWater.targetMl || 2500));
  const [activeTab, setActiveTab] = useState('quick'); // 'quick' | 'target' | 'manual'
  const [showReminderModal, setShowReminderModal] = useState(false);
  
  const [alertConfig, setAlertConfig] = useState({
    visible: false,
    title: '',
    message: '',
    type: 'success',
  });

  useEffect(() => {
    setAmountInput(String(activeWater.amountMl || 0));
    setTargetInput(String(activeWater.targetMl || 2500));
  }, [activeWater.amountMl, activeWater.targetMl]);

  const currentMl = activeWater.amountMl || 0;
  const targetMl = activeWater.targetMl || 2500;
  const currentLiters = (currentMl / 1000).toFixed(2);
  const targetLiters = (targetMl / 1000).toFixed(1);
  const percentage = Math.min(100, Math.max(0, Math.round((currentMl / targetMl) * 100)));

  const handleAddPreset = (ml) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    addWater(ml);
  };

  const handleSubtract = (ml = 250) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const next = Math.max(0, currentMl - ml);
    setWater(next);
  };

  const handleSaveManual = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    const val = Math.max(0, parseInt(amountInput, 10) || 0);
    setWater(val);
    setAlertConfig({
      visible: true,
      title: 'Registro Actualizado',
      message: `Registraste ${val} ml de agua para hoy.`,
      type: 'success',
    });
  };

  const handleSaveTarget = (newTarget) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const val = Math.max(500, parseInt(newTarget, 10) || 2500);
    setWaterTarget(val);
    setTargetInput(String(val));
    setAlertConfig({
      visible: true,
      title: 'Meta Actualizada',
      message: `Tu nuevo objetivo diario es de ${(val / 1000).toFixed(1)} L.`,
      type: 'success',
    });
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#FAFAFA' }} edges={['top', 'left', 'right']}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {/* HEADER BAR */}
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingHorizontal: 20,
            paddingVertical: 14,
            backgroundColor: '#ffffff',
            borderBottomWidth: 1,
            borderBottomColor: '#F3F4F6',
          }}
        >
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={{
              width: 40,
              height: 40,
              borderRadius: 20,
              backgroundColor: '#F3F4F6',
              alignItems: 'center',
              justifyContent: 'center',
            }}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <ChevronLeft size={24} color="#374151" />
          </TouchableOpacity>

          <View style={{ alignItems: 'center' }}>
            <Text style={{ fontSize: 17, fontWeight: '700', color: '#111827' }}>
              Hidratación
            </Text>
            <Text style={{ fontSize: 12, color: '#6B7280', fontWeight: '500' }}>
              Control y bienestar diario
            </Text>
          </View>

          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <TouchableOpacity
              activeOpacity={0.75}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setShowReminderModal(true);
              }}
              style={{
                width: 34,
                height: 34,
                borderRadius: 17,
                backgroundColor: waterReminder?.enabled ? '#E0F2FE' : '#F3F4F6',
                alignItems: 'center',
                justifyContent: 'center',
                borderWidth: 1,
                borderColor: waterReminder?.enabled ? '#BAE6FD' : '#E5E7EB',
              }}
            >
              <Bell size={15} color={waterReminder?.enabled ? '#0284C7' : '#64748B'} />
            </TouchableOpacity>

            <View
              style={{
                backgroundColor: percentage >= 100 ? '#ECFDF5' : '#E0F2FE',
                paddingHorizontal: 10,
                paddingVertical: 6,
                borderRadius: 14,
                borderWidth: 1,
                borderColor: percentage >= 100 ? '#A7F3D0' : '#BAE6FD',
              }}
            >
              <Text
                style={{
                  fontSize: 12,
                  fontWeight: '800',
                  color: percentage >= 100 ? '#059669' : '#0284C7',
                }}
              >
                {percentage}%
              </Text>
            </View>
          </View>
        </View>

        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ padding: 20, paddingBottom: 60 }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* HERO CARD: NIVEL ACTUAL */}
          <View
            style={{
              backgroundColor: '#FFFFFF',
              borderRadius: 24,
              padding: 24,
              alignItems: 'center',
              marginBottom: 20,
              borderWidth: 1,
              borderColor: '#F3F4F6',
              shadowColor: '#0284C7',
              shadowOffset: { width: 0, height: 6 },
              shadowOpacity: 0.08,
              shadowRadius: 16,
              elevation: 4,
            }}
          >
            <View
              style={{
                width: 80,
                height: 80,
                borderRadius: 40,
                backgroundColor: '#E0F2FE',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: 14,
              }}
            >
              <Droplets size={40} color="#0284C7" fill="#0284C7" />
            </View>

            <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 6 }}>
              <Text style={{ fontSize: 44, fontWeight: '900', color: '#0F172A', letterSpacing: -1 }}>
                {currentLiters}
              </Text>
              <Text style={{ fontSize: 20, fontWeight: '700', color: '#64748B' }}>
                / {targetLiters} L
              </Text>
            </View>

            <Text style={{ fontSize: 13, color: '#64748B', fontWeight: '600', marginTop: 4 }}>
              {currentMl} de {targetMl} ml consumidos hoy
            </Text>

            {/* BARRA DE PROGRESO */}
            <View
              style={{
                width: '100%',
                height: 12,
                backgroundColor: '#F1F5F9',
                borderRadius: 6,
                overflow: 'hidden',
                marginTop: 18,
                marginBottom: 10,
              }}
            >
              <LinearGradient
                colors={['#38BDF8', '#0284C7']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={{
                  height: '100%',
                  width: `${percentage}%`,
                  borderRadius: 6,
                }}
              />
            </View>

            {/* MENSAJE DE ESTADO */}
            <Text style={{ fontSize: 12, fontWeight: '700', color: percentage >= 100 ? '#059669' : '#0284C7' }}>
              {percentage >= 100
                ? '🎉 ¡Objetivo de hidratación alcanzado!'
                : `Faltan ${(Math.max(0, targetMl - currentMl) / 1000).toFixed(2)} L para tu meta`}
            </Text>

            {/* BOTÓN RESTAR RÁPIDO */}
            {currentMl > 0 && (
              <TouchableOpacity
                onPress={() => handleSubtract(250)}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 4,
                  marginTop: 14,
                  paddingHorizontal: 12,
                  paddingVertical: 6,
                  borderRadius: 12,
                  backgroundColor: '#F3F4F6',
                }}
              >
                <Minus size={13} color="#6B7280" />
                <Text style={{ fontSize: 11, color: '#6B7280', fontWeight: '600' }}>
                  Restar 250 ml (por error)
                </Text>
              </TouchableOpacity>
            )}
          </View>

          {/* CARD DE RECORDATORIOS PERIÓDICOS */}
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setShowReminderModal(true);
            }}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              backgroundColor: '#FFFFFF',
              borderRadius: 20,
              padding: 16,
              marginBottom: 18,
              borderWidth: 1,
              borderColor: '#F1F5F9',
              shadowColor: '#0F172A',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.04,
              shadowRadius: 8,
              elevation: 2,
            }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1, paddingRight: 14 }}>
              <View
                style={{
                  width: 42,
                  height: 42,
                  borderRadius: 21,
                  backgroundColor: waterReminder?.enabled ? '#E0F2FE' : '#F1F5F9',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Bell size={19} color={waterReminder?.enabled ? '#0284C7' : '#94A3B8'} />
              </View>
              <View style={{ flex: 1 }}>
                <Text numberOfLines={1} style={{ fontSize: 14, fontWeight: '800', color: '#0F172A' }}>
                  Recordatorios de Agua
                </Text>
                <Text numberOfLines={1} style={{ fontSize: 12, color: '#64748B', marginTop: 2 }}>
                  {waterReminder?.enabled
                    ? `Notificación cada ${waterReminder.intervalMinutes >= 60 ? `${waterReminder.intervalMinutes / 60} hs` : `${waterReminder.intervalMinutes} min`}`
                    : 'Avisos pausados'}
                </Text>
              </View>
            </View>

            <View
              style={{
                backgroundColor: waterReminder?.enabled ? '#F0F9FF' : '#F8FAFC',
                paddingHorizontal: 14,
                paddingVertical: 8,
                borderRadius: 12,
                borderWidth: 1,
                borderColor: waterReminder?.enabled ? '#BAE6FD' : '#E2E8F0',
                flexShrink: 0,
              }}
            >
              <Text style={{ fontSize: 12, fontWeight: '800', color: waterReminder?.enabled ? '#0284C7' : '#64748B' }}>
                Configurar
              </Text>
            </View>
          </TouchableOpacity>

          {/* TABS DE SELECCIÓN */}
          <View
            style={{
              flexDirection: 'row',
              backgroundColor: '#F3F4F6',
              borderRadius: 14,
              padding: 4,
              marginBottom: 18,
            }}
          >
            <TouchableOpacity
              onPress={() => setActiveTab('quick')}
              style={{
                flex: 1,
                paddingVertical: 9,
                borderRadius: 10,
                alignItems: 'center',
                backgroundColor: activeTab === 'quick' ? '#FFFFFF' : 'transparent',
                shadowColor: '#000',
                shadowOpacity: activeTab === 'quick' ? 0.05 : 0,
                shadowRadius: 4,
              }}
            >
              <Text
                style={{
                  fontSize: 12,
                  fontWeight: activeTab === 'quick' ? '700' : '600',
                  color: activeTab === 'quick' ? '#0284C7' : '#6B7280',
                }}
              >
                Ingesta Rápida
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setActiveTab('manual')}
              style={{
                flex: 1,
                paddingVertical: 9,
                borderRadius: 10,
                alignItems: 'center',
                backgroundColor: activeTab === 'manual' ? '#FFFFFF' : 'transparent',
                shadowColor: '#000',
                shadowOpacity: activeTab === 'manual' ? 0.05 : 0,
                shadowRadius: 4,
              }}
            >
              <Text
                style={{
                  fontSize: 12,
                  fontWeight: activeTab === 'manual' ? '700' : '600',
                  color: activeTab === 'manual' ? '#0284C7' : '#6B7280',
                }}
              >
                Manual
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setActiveTab('target')}
              style={{
                flex: 1,
                paddingVertical: 9,
                borderRadius: 10,
                alignItems: 'center',
                backgroundColor: activeTab === 'target' ? '#FFFFFF' : 'transparent',
                shadowColor: '#000',
                shadowOpacity: activeTab === 'target' ? 0.05 : 0,
                shadowRadius: 4,
              }}
            >
              <Text
                style={{
                  fontSize: 12,
                  fontWeight: activeTab === 'target' ? '700' : '600',
                  color: activeTab === 'target' ? '#0284C7' : '#6B7280',
                }}
              >
                Meta Diaria
              </Text>
            </TouchableOpacity>
          </View>

          {/* TAB 1: PRESETS RÁPIDOS */}
          {activeTab === 'quick' && (
            <View style={{ marginBottom: 20 }}>
              <Text style={{ fontSize: 14, fontWeight: '700', color: '#1F2937', marginBottom: 12 }}>
                Sumá agua con un toque:
              </Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
                {QUICK_PRESETS.map((preset) => (
                  <TouchableOpacity
                    key={preset.label}
                    onPress={() => handleAddPreset(preset.ml)}
                    activeOpacity={0.8}
                    style={{
                      width: '48%',
                      backgroundColor: '#FFFFFF',
                      borderRadius: 18,
                      padding: 16,
                      borderWidth: 1,
                      borderColor: '#E5E7EB',
                      flexDirection: 'row',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      shadowColor: '#000',
                      shadowOffset: { width: 0, height: 2 },
                      shadowOpacity: 0.03,
                      shadowRadius: 6,
                      elevation: 1,
                    }}
                  >
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                      <Text style={{ fontSize: 24 }}>{preset.icon}</Text>
                      <View>
                        <Text style={{ fontSize: 13, fontWeight: '700', color: '#111827' }}>
                          +{preset.ml} ml
                        </Text>
                        <Text style={{ fontSize: 11, color: '#6B7280', fontWeight: '500' }}>
                          {preset.label}
                        </Text>
                      </View>
                    </View>
                    <View
                      style={{
                        width: 28,
                        height: 28,
                        borderRadius: 14,
                        backgroundColor: '#E0F2FE',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <Plus size={14} color="#0284C7" strokeWidth={2.5} />
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}

          {/* TAB 2: AJUSTE MANUAL */}
          {activeTab === 'manual' && (
            <View
              style={{
                backgroundColor: '#FFFFFF',
                borderRadius: 20,
                padding: 20,
                borderWidth: 1,
                borderColor: '#E5E7EB',
                marginBottom: 20,
              }}
            >
              <Text style={{ fontSize: 14, fontWeight: '700', color: '#1F2937', marginBottom: 8 }}>
                Cantidad exacta acumulada hoy
              </Text>
              <Text style={{ fontSize: 12, color: '#6B7280', marginBottom: 16 }}>
                Ingresá la cantidad en mililitros directamente si querés corregir el total:
              </Text>

              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  backgroundColor: '#F9FAFB',
                  borderWidth: 1,
                  borderColor: '#D1D5DB',
                  borderRadius: 14,
                  paddingHorizontal: 16,
                  paddingVertical: 12,
                  marginBottom: 16,
                }}
              >
                <TextInput
                  value={amountInput}
                  onChangeText={(t) => setAmountInput(t.replace(/[^0-9]/g, ''))}
                  keyboardType="number-pad"
                  placeholder="2500"
                  placeholderTextColor="#9CA3AF"
                  style={{ flex: 1, fontSize: 22, fontWeight: '800', color: '#111827', padding: 0 }}
                />
                <Text style={{ fontSize: 15, fontWeight: '700', color: '#0284C7' }}>ml</Text>
              </View>

              <TouchableOpacity
                onPress={handleSaveManual}
                style={{
                  backgroundColor: '#0284C7',
                  borderRadius: 14,
                  paddingVertical: 14,
                  alignItems: 'center',
                  flexDirection: 'row',
                  justifyContent: 'center',
                  gap: 8,
                }}
              >
                <Check size={18} color="white" strokeWidth={2.5} />
                <Text style={{ color: 'white', fontWeight: '700', fontSize: 14 }}>
                  Actualizar Total
                </Text>
              </TouchableOpacity>
            </View>
          )}

          {/* TAB 3: CONFIGURAR META */}
          {activeTab === 'target' && (
            <View
              style={{
                backgroundColor: '#FFFFFF',
                borderRadius: 20,
                padding: 20,
                borderWidth: 1,
                borderColor: '#E5E7EB',
                marginBottom: 20,
              }}
            >
              <Text style={{ fontSize: 14, fontWeight: '700', color: '#1F2937', marginBottom: 6 }}>
                Seleccioná tu objetivo diario
              </Text>
              <Text style={{ fontSize: 12, color: '#6B7280', marginBottom: 16 }}>
                Recomendamos entre 30 a 40 ml por kilo de peso corporal.
              </Text>

              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 18 }}>
                {TARGET_PRESETS.map((tgt) => {
                  const isSelected = targetMl === tgt;
                  return (
                    <TouchableOpacity
                      key={tgt}
                      onPress={() => handleSaveTarget(tgt)}
                      style={{
                        flex: 1,
                        minWidth: '45%',
                        paddingVertical: 12,
                        borderRadius: 14,
                        alignItems: 'center',
                        backgroundColor: isSelected ? '#0284C7' : '#F3F4F6',
                      }}
                    >
                      <Text
                        style={{
                          fontSize: 14,
                          fontWeight: '800',
                          color: isSelected ? '#FFFFFF' : '#374151',
                        }}
                      >
                        {(tgt / 1000).toFixed(1)} L / día
                      </Text>
                      <Text
                        style={{
                          fontSize: 11,
                          color: isSelected ? '#E0F2FE' : '#6B7280',
                          fontWeight: '500',
                          marginTop: 2,
                        }}
                      >
                        {tgt} ml
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  backgroundColor: '#F9FAFB',
                  borderWidth: 1,
                  borderColor: '#D1D5DB',
                  borderRadius: 14,
                  paddingHorizontal: 16,
                  paddingVertical: 10,
                  marginBottom: 12,
                }}
              >
                <TextInput
                  value={targetInput}
                  onChangeText={(t) => setTargetInput(t.replace(/[^0-9]/g, ''))}
                  keyboardType="number-pad"
                  placeholder="Meta personalizada en ml"
                  placeholderTextColor="#9CA3AF"
                  style={{ flex: 1, fontSize: 16, fontWeight: '700', color: '#111827', padding: 0 }}
                />
                <TouchableOpacity
                  onPress={() => handleSaveTarget(targetInput)}
                  style={{
                    backgroundColor: '#0284C7',
                    paddingHorizontal: 14,
                    paddingVertical: 6,
                    borderRadius: 10,
                  }}
                >
                  <Text style={{ color: 'white', fontWeight: '700', fontSize: 12 }}>Guardar</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* TIP DE NUTRICIÓN */}
          <View
            style={{
              backgroundColor: '#EFF6FF',
              borderRadius: 18,
              padding: 16,
              flexDirection: 'row',
              alignItems: 'center',
              gap: 12,
              borderWidth: 1,
              borderColor: '#BFDBFE',
            }}
          >
            <View
              style={{
                width: 36,
                height: 36,
                borderRadius: 18,
                backgroundColor: '#DBEAFE',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Sparkles size={18} color="#1D4ED8" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 13, fontWeight: '700', color: '#1E40AF' }}>
                Tip de Rendimiento Zenit
              </Text>
              <Text style={{ fontSize: 11, color: '#3B82F6', marginTop: 2, lineHeight: 16 }}>
                Beber agua antes y durante el entrenamiento previene la caída de hasta un 15% en la fuerza muscular y acelera la recuperación.
              </Text>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      <ZenitModalAlert
        visible={alertConfig.visible}
        title={alertConfig.title}
        message={alertConfig.message}
        type={alertConfig.type}
        onConfirm={() => setAlertConfig((prev) => ({ ...prev, visible: false }))}
        confirmText="Aceptar"
      />

      <WaterReminderModal
        visible={showReminderModal}
        onClose={() => setShowReminderModal(false)}
      />
    </SafeAreaView>
  );
}

