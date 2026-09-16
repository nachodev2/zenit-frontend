import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { ChevronRight, TrendingUp, TrendingDown, Minus } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { ZENIT_GRADIENT } from '../../constants/theme';

// Determina la categoría y color según el IMC
const getBmiRange = (bmi) => {
  const value = Number(bmi) || 22.8;
  if (value < 18.5) {
    return { label: 'Bajo peso', color: '#0284C7', bg: '#F0F9FF', border: '#BAE6FD', segmentIndex: 0 };
  }
  if (value < 25.0) {
    return { label: 'Saludable', color: '#059669', bg: '#ECFDF5', border: '#A7F3D0', segmentIndex: 1 };
  }
  if (value < 30.0) {
    return { label: 'Alto', color: '#D97706', bg: '#FFFBEB', border: '#FDE68A', segmentIndex: 2 };
  }
  return { label: 'Exceso', color: '#E11D48', bg: '#FFF1F2', border: '#FECDD3', segmentIndex: 3 };
};

const RANGES = [
  { key: 'bajo', label: 'Bajo', color: '#38BDF8' },
  { key: 'saludable', label: 'Saludable', color: '#10B981' },
  { key: 'alto', label: 'Alto', color: '#FBBF24' },
  { key: 'exceso', label: 'Exceso', color: '#F43F5E' },
];

export function WeightHeroCard({
  weightTracker,
  onPress,
}) {
  const currentWeight = Number(weightTracker?.currentWeightKg) || 74.8;
  const targetWeight = Number(weightTracker?.targetWeightKg) || 78.0;
  const muscleMass = weightTracker?.muscleMassKg ? Number(weightTracker.muscleMassKg) : 35.2;
  const bodyFat = weightTracker?.bodyFatPct ? Number(weightTracker.bodyFatPct) : 15.4;
  const bmi = weightTracker?.bmi ? Number(weightTracker.bmi) : 22.8;

  const bmiStatus = getBmiRange(bmi);

  // Comparativa vs. pesaje anterior en el historial
  const history = weightTracker?.history || [];
  const previousEntry = history.find(entry => entry.date !== weightTracker?.lastUpdated) || history[0];
  const prevWeight = previousEntry ? Number(previousEntry.weightKg) : null;
  const prevDate = previousEntry?.date 
    ? previousEntry.date.split('-').slice(1).reverse().join('/') 
    : null;

  const weightDelta = prevWeight !== null ? (currentWeight - prevWeight) : null;
  const diffToTarget = Math.abs(targetWeight - currentWeight);

  return (
    <Animated.View entering={FadeInDown.delay(180).duration(450)} style={{ marginTop: 20 }}>
      <TouchableOpacity
        activeOpacity={0.88}
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          onPress?.();
        }}
        style={{
          backgroundColor: '#FFFFFF',
          borderRadius: 26,
          padding: 20,
          borderWidth: 1,
          borderColor: '#F1F5F9',
          shadowColor: '#0F172A',
          shadowOffset: { width: 0, height: 6 },
          shadowOpacity: 0.04,
          shadowRadius: 14,
          elevation: 2,
        }}
      >
        {/* CABECERA: Título limpio y estado del pesaje */}
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <LinearGradient
              colors={ZENIT_GRADIENT}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={{
                width: 24,
                height: 24,
                borderRadius: 12,
                alignItems: 'center',
                justifyContent: 'center',
                shadowColor: '#F97316',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.25,
                shadowRadius: 4,
                elevation: 2,
              }}
            >
              <TrendingUp size={13} color="#FFFFFF" strokeWidth={2.5} />
            </LinearGradient>
            <Text style={{ color: '#0F172A', fontSize: 15, fontWeight: '800', letterSpacing: -0.2 }}>
              Registro de peso
            </Text>
          </View>

          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
            <Text style={{ color: '#94A3B8', fontSize: 11, fontWeight: '600' }}>
              Pesaje semanal
            </Text>
            <ChevronRight size={13} color="#CBD5E1" />
          </View>
        </View>

        {/* PESO PRINCIPAL + BADGE DE ESTADO (Saludable / Bajo / Alto / Exceso) */}
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
          <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 4 }}>
            <Text style={{ color: '#0F172A', fontSize: 36, fontWeight: '900', letterSpacing: -1 }}>
              {currentWeight.toFixed(2)}
            </Text>
            <Text style={{ color: '#94A3B8', fontSize: 16, fontWeight: '800' }}>
              kg
            </Text>
          </View>

          <View
            style={{
              backgroundColor: bmiStatus.bg,
              borderColor: bmiStatus.border,
              borderWidth: 1,
              paddingHorizontal: 10,
              paddingVertical: 4.5,
              borderRadius: 999,
            }}
          >
            <Text
              style={{
                color: bmiStatus.color,
                fontSize: 11,
                fontWeight: '800',
                textTransform: 'uppercase',
                letterSpacing: 0.5,
              }}
            >
              {bmiStatus.label}
            </Text>
          </View>
        </View>

        {/* BARRA DE RANGO SEGMENTADA (Tipo Báscula / OKOK) */}
        <View style={{ marginBottom: 16 }}>
          <View style={{ flexDirection: 'row', gap: 6, height: 6, marginBottom: 6 }}>
            {RANGES.map((range, index) => {
              const isActive = index === bmiStatus.segmentIndex;
              return (
                <View
                  key={range.key}
                  style={{
                    flex: 1,
                    height: '100%',
                    borderRadius: 999,
                    backgroundColor: range.color,
                    opacity: isActive ? 1 : 0.28,
                  }}
                />
              );
            })}
          </View>

          {/* Rótulos bajo los segmentos */}
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 2 }}>
            {RANGES.map((range, index) => {
              const isActive = index === bmiStatus.segmentIndex;
              return (
                <Text
                  key={range.key}
                  style={{
                    fontSize: 10,
                    fontWeight: isActive ? '800' : '600',
                    color: isActive ? '#0F172A' : '#94A3B8',
                  }}
                >
                  {range.label}
                </Text>
              );
            })}
          </View>
        </View>

        {/* BLOQUE DE COMPARATIVAS: vs. última vez & vs. meta */}
        <View
          style={{
            flexDirection: 'row',
            backgroundColor: '#F8FAFC',
            borderRadius: 18,
            paddingVertical: 12,
            paddingHorizontal: 14,
            borderWidth: 1,
            borderColor: '#F1F5F9',
            marginBottom: 14,
          }}
        >
          {/* COMPARACIÓN CON LA ÚLTIMA VEZ */}
          <View style={{ flex: 1 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
              {weightDelta !== null ? (
                <>
                  {weightDelta < 0 ? (
                    <TrendingDown size={14} color="#059669" />
                  ) : weightDelta > 0 ? (
                    <TrendingUp size={14} color="#0F172A" />
                  ) : (
                    <Minus size={14} color="#64748B" />
                  )}
                  <Text
                    style={{
                      color: weightDelta < 0 ? '#059669' : '#0F172A',
                      fontSize: 17,
                      fontWeight: '900',
                      letterSpacing: -0.3,
                    }}
                  >
                    {weightDelta > 0 ? `+${weightDelta.toFixed(1)}` : weightDelta.toFixed(1)}
                    <Text style={{ fontSize: 11, fontWeight: '700', color: '#94A3B8' }}> kg</Text>
                  </Text>
                </>
              ) : (
                <Text style={{ color: '#94A3B8', fontSize: 16, fontWeight: '800' }}>--</Text>
              )}
            </View>
            <Text style={{ color: '#64748B', fontSize: 11, fontWeight: '600', marginTop: 2 }}>
              {prevDate ? `vs. última vez (${prevDate})` : 'vs. última vez'}
            </Text>
          </View>

          {/* DIVISOR VERTICAL */}
          <View style={{ width: 1, height: '80%', backgroundColor: '#E2E8F0', alignSelf: 'center', marginHorizontal: 10 }} />

          {/* META O AVANCE FIJADO */}
          <View style={{ flex: 1, alignItems: 'flex-start', paddingLeft: 4 }}>
            <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 2 }}>
              <Text style={{ color: '#0F172A', fontSize: 17, fontWeight: '900', letterSpacing: -0.3 }}>
                {targetWeight.toFixed(1)}
              </Text>
              <Text style={{ color: '#94A3B8', fontSize: 11, fontWeight: '700' }}>
                kg
              </Text>
            </View>
            <Text style={{ color: '#64748B', fontSize: 11, fontWeight: '600', marginTop: 2 }}>
              {diffToTarget < 0.1 ? 'Meta alcanzada' : `Meta (${diffToTarget.toFixed(1)} kg dif.)`}
            </Text>
          </View>
        </View>

        {/* MÉTRICAS FÁCTICAS DE BIOIMPEDANCIA (Solo lectura, reflejadas del pesaje) */}
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingTop: 10,
            borderTopWidth: 1,
            borderTopColor: '#F8FAFC',
          }}
        >
          <Text style={{ color: '#64748B', fontSize: 11, fontWeight: '600' }}>
            Músculo: <Text style={{ color: '#0F172A', fontWeight: '800' }}>{muscleMass.toFixed(1)} kg</Text>
          </Text>

          <Text style={{ color: '#CBD5E1', fontSize: 11 }}>•</Text>

          <Text style={{ color: '#64748B', fontSize: 11, fontWeight: '600' }}>
            Grasa: <Text style={{ color: '#0F172A', fontWeight: '800' }}>{bodyFat.toFixed(1)}%</Text>
          </Text>

          <Text style={{ color: '#CBD5E1', fontSize: 11 }}>•</Text>

          <Text style={{ color: '#64748B', fontSize: 11, fontWeight: '600' }}>
            IMC: <Text style={{ color: '#0F172A', fontWeight: '800' }}>{bmi.toFixed(1)}</Text>
          </Text>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
}

export default WeightHeroCard;
