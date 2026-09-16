import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Modal,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  ChevronLeft,
  Scale,
  Eye,
  EyeOff,
  Activity,
  Sparkles,
  TrendingDown,
  TrendingUp,
  Minus,
  Percent,
  Droplets,
  Flame,
  Shield,
  Heart,
  Clock,
  Plus,
  Check,
  X,
  Info,
  AlertTriangle,
} from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';

import { useUserStore } from '../store/useUserStore';
import { ZenitModalAlert } from '../components/ui/ZenitModalAlert';
import { ZENIT_GRADIENT } from '../constants/theme';

// Rangos de IMC para la barra segmentada y thresholds
const BMI_RANGES = [
  { key: 'bajo', label: 'Bajo', color: '#38BDF8', maxBmi: 18.5 },
  { key: 'saludable', label: 'Saludable', color: '#10B981', maxBmi: 24.9 },
  { key: 'alto', label: 'Alto', color: '#FBBF24', maxBmi: 29.9 },
  { key: 'exceso', label: 'Exceso', color: '#F43F5E', maxBmi: 45.0 },
];

export default function WeightTrackerScreen({ navigation }) {
  const weightTracker = useUserStore((state) => state.weightTracker);
  const logWeight = useUserStore((state) => state.logWeight);

  const currentWeight = Number(weightTracker?.currentWeightKg) || 74.8;
  const targetWeight = Number(weightTracker?.targetWeightKg) || 78.0;
  const muscleMass = Number(weightTracker?.muscleMassKg) || 35.2;
  const bodyFat = Number(weightTracker?.bodyFatPct) || 15.4;
  const bmi = Number(weightTracker?.bmi) || 22.8;
  const history = weightTracker?.history || [];

  // Estados UI
  const [activeTab, setActiveTab] = useState('metrics'); // 'metrics' | 'history'
  const [showValues, setShowValues] = useState(true);
  const [selectedMetric, setSelectedMetric] = useState(null);
  const [isWeighInModalOpen, setIsWeighInModalOpen] = useState(false);

  // Formulario nuevo pesaje
  const [formWeight, setFormWeight] = useState(String(currentWeight));
  const [formMuscle, setFormMuscle] = useState(String(muscleMass));
  const [formFat, setFormFat] = useState(String(bodyFat));

  const [alertConfig, setAlertConfig] = useState({
    visible: false,
    title: '',
    message: '',
    type: 'success',
  });

  // Comparativas con pesajes anteriores
  const previousEntry = useMemo(() => {
    return history.find((h) => h.date !== weightTracker?.lastUpdated) || history[0] || null;
  }, [history, weightTracker?.lastUpdated]);

  const prevWeight = previousEntry ? Number(previousEntry.weightKg) : null;
  const prevDateStr = previousEntry?.date
    ? previousEntry.date.split('-').slice(1).reverse().join('/')
    : null;

  const weightDelta = prevWeight !== null ? currentWeight - prevWeight : null;
  const diffToTarget = Math.abs(targetWeight - currentWeight);

  // Segmento activo del IMC
  const activeBmiSegment = useMemo(() => {
    if (bmi < 18.5) return 0;
    if (bmi < 25.0) return 1;
    if (bmi < 30.0) return 2;
    return 3;
  }, [bmi]);

  const bmiStatusConfig = useMemo(() => {
    if (bmi < 18.5) return { label: 'Bajo peso', color: '#0284C7', bg: '#F0F9FF', border: '#BAE6FD' };
    if (bmi < 25.0) return { label: 'Saludable', color: '#059669', bg: '#ECFDF5', border: '#A7F3D0' };
    if (bmi < 30.0) return { label: 'Alto', color: '#D97706', bg: '#FFFBEB', border: '#FDE68A' };
    return { label: 'Exceso', color: '#E11D48', bg: '#FFF1F2', border: '#FECDD3' };
  }, [bmi]);

  // Cálculos de las 14 métricas corporales fácticas de bioimpedancia
  const metricsData = useMemo(() => {
    const userHeightM = 1.75;
    const fatWeight = currentWeight * (bodyFat / 100);
    const fatFreeMass = currentWeight - fatWeight;
    const skeletalMusclePct = currentWeight > 0 ? (muscleMass / currentWeight) * 100 : 47.1;
    const waterPct = Math.min(Math.max((1 - bodyFat / 100) * 0.72 * 100, 45), 70);
    const waterWeight = currentWeight * (waterPct / 100);
    const visceralFat = Math.max(1, Math.min(Math.round(bodyFat * 0.28), 20));
    const boneMass = Number((currentWeight * 0.042).toFixed(1));
    const bmr = Math.round(370 + 21.6 * fatFreeMass);
    const proteinPct = Number((100 - waterPct - bodyFat - (boneMass / currentWeight) * 100).toFixed(1));
    const metabolicAge = Math.max(18, 24 - (bodyFat < 16 ? 2 : 0));

    return [
      {
        id: 'weight',
        title: 'Peso corporal',
        unit: 'kg',
        value: currentWeight.toFixed(2),
        status: bmiStatusConfig.label,
        statusColor: bmiStatusConfig.color,
        statusBg: bmiStatusConfig.bg,
        icon: Scale,
        iconColor: '#0F172A',
        iconBg: '#F1F5F9',
        desc: 'Masa corporal total medida por los sensores de carga de la báscula.',
        healthyRange: 'Rango normal para tu estatura: 58.0 - 76.5 kg',
      },
      {
        id: 'bmi',
        title: 'Índice de Masa Corporal (IMC)',
        unit: '',
        value: bmi.toFixed(1),
        status: bmiStatusConfig.label,
        statusColor: bmiStatusConfig.color,
        statusBg: bmiStatusConfig.bg,
        icon: Sparkles,
        iconColor: '#059669',
        iconBg: '#ECFDF5',
        desc: 'Relación estándar internacional entre tu peso y tu estatura (kg/m²).',
        healthyRange: 'Rango saludable estándar: 18.5 - 24.9',
      },
      {
        id: 'body_fat',
        title: 'Porcentaje de Grasa',
        unit: '%',
        value: `${bodyFat.toFixed(1)}%`,
        status: bodyFat < 18 ? 'Atlético' : bodyFat < 25 ? 'Saludable' : 'Alto',
        statusColor: bodyFat < 18 ? '#059669' : bodyFat < 25 ? '#10B981' : '#D97706',
        statusBg: bodyFat < 18 ? '#ECFDF5' : bodyFat < 25 ? '#F0FDF4' : '#FFFBEB',
        icon: Percent,
        iconColor: '#F59E0B',
        iconBg: '#FEF3C7',
        desc: 'Proporción de tejido adiposo en relación al peso corporal total.',
        healthyRange: 'Hombres atléticos: 10% - 17% | Promedio: 18% - 24%',
      },
      {
        id: 'fat_mass',
        title: 'Peso de Grasa Corporal',
        unit: 'kg',
        value: fatWeight.toFixed(1),
        status: bodyFat < 18 ? 'Saludable' : 'Alto',
        statusColor: bodyFat < 18 ? '#059669' : '#D97706',
        statusBg: bodyFat < 18 ? '#ECFDF5' : '#FFFBEB',
        icon: Flame,
        iconColor: '#EA580C',
        iconBg: '#FFEDD5',
        desc: 'Cantidad neta de kilogramos de tejido adiposo calculados.',
        healthyRange: 'Calculado: Peso actual × (% Grasa / 100)',
      },
      {
        id: 'muscle_mass',
        title: 'Masa Muscular Esquelética',
        unit: 'kg',
        value: muscleMass.toFixed(1),
        status: 'Excelente',
        statusColor: '#059669',
        statusBg: '#ECFDF5',
        icon: Activity,
        iconColor: '#2563EB',
        iconBg: '#EFF6FF',
        desc: 'Músculo que recubre los huesos y permite el movimiento activo y fuerza.',
        healthyRange: 'Óptimo para atletas y entrenamiento de hipertrofia.',
      },
      {
        id: 'muscle_pct',
        title: 'Porcentaje Muscular',
        unit: '%',
        value: `${skeletalMusclePct.toFixed(1)}%`,
        status: 'Excelente',
        statusColor: '#059669',
        statusBg: '#ECFDF5',
        icon: Activity,
        iconColor: '#3B82F6',
        iconBg: '#DBEAFE',
        desc: 'Proporción de músculo esquelético activo sobre tu peso corporal.',
        healthyRange: 'Excelente: > 45% en hombres activos.',
      },
      {
        id: 'fat_free',
        title: 'Peso Libre de Grasa (Masa Magra)',
        unit: 'kg',
        value: fatFreeMass.toFixed(1),
        status: 'Óptimo',
        statusColor: '#059669',
        statusBg: '#ECFDF5',
        icon: Shield,
        iconColor: '#4F46E5',
        iconBg: '#EEF2FF',
        desc: 'Peso del cuerpo descontando el 100% de la grasa (músculo, órganos, huesos, agua).',
        healthyRange: 'Base metabólica principal para el gasto calórico diario.',
      },
      {
        id: 'water_pct',
        title: 'Agua Corporal',
        unit: '%',
        value: `${waterPct.toFixed(1)}%`,
        status: waterPct >= 55 ? 'Saludable' : 'Bajo',
        statusColor: waterPct >= 55 ? '#0284C7' : '#D97706',
        statusBg: waterPct >= 55 ? '#F0F9FF' : '#FFFBEB',
        icon: Droplets,
        iconColor: '#0284C7',
        iconBg: '#E0F2FE',
        desc: 'Porcentaje de fluidos intracelulares y extracelulares en el organismo.',
        healthyRange: 'Rango saludable normal: 55% - 65% en adultos.',
      },
      {
        id: 'water_mass',
        title: 'Peso del Agua',
        unit: 'kg',
        value: waterWeight.toFixed(1),
        status: 'Saludable',
        statusColor: '#0284C7',
        statusBg: '#F0F9FF',
        icon: Droplets,
        iconColor: '#0EA5E9',
        iconBg: '#E0F2FE',
        desc: 'Cantidad neta de litros/kilogramos de agua presentes en el cuerpo.',
        healthyRange: 'Fundamental para el rendimiento y la hidratación deportiva.',
      },
      {
        id: 'visceral_fat',
        title: 'Grasa Visceral',
        unit: '',
        value: visceralFat.toFixed(0),
        status: visceralFat <= 9 ? 'Saludable' : 'Alerta',
        statusColor: visceralFat <= 9 ? '#059669' : '#E11D48',
        statusBg: visceralFat <= 9 ? '#ECFDF5' : '#FFF1F2',
        icon: Heart,
        iconColor: '#DC2626',
        iconBg: '#FEE2E2',
        desc: 'Grasa profunda que rodea los órganos vitales en el área abdominal.',
        healthyRange: 'Nivel 1 - 9: Saludable | 10 - 14: Alto | > 15: Crítico.',
      },
      {
        id: 'bone_mass',
        title: 'Masa Ósea (Huesos)',
        unit: 'kg',
        value: boneMass.toFixed(1),
        status: 'Perfecto',
        statusColor: '#059669',
        statusBg: '#ECFDF5',
        icon: Shield,
        iconColor: '#64748B',
        iconBg: '#F1F5F9',
        desc: 'Contenido mineral estimado de los huesos del esqueleto.',
        healthyRange: 'Rango típico en hombres: 2.8 - 3.8 kg.',
      },
      {
        id: 'bmr',
        title: 'Metabolismo Basal (TMB)',
        unit: 'kcal',
        value: `${bmr}`,
        status: 'Alto',
        statusColor: '#059669',
        statusBg: '#ECFDF5',
        icon: Flame,
        iconColor: '#F97316',
        iconBg: '#FFEDD5',
        desc: 'Calorías que tu cuerpo quema en reposo absoluto para mantenerse con vida.',
        healthyRange: 'Mayor masa muscular = mayor TMB diario en reposo.',
      },
      {
        id: 'protein_pct',
        title: 'Proteína Corporal',
        unit: '%',
        value: `${proteinPct}%`,
        status: proteinPct >= 16 ? 'Excelente' : 'Normal',
        statusColor: '#059669',
        statusBg: '#ECFDF5',
        icon: Activity,
        iconColor: '#8B5CF6',
        iconBg: '#F5F3FF',
        desc: 'Porcentaje estructural de proteínas en tejidos y fibras musculares.',
        healthyRange: 'Rango normal saludable: 16% - 20%.',
      },
      {
        id: 'metabolic_age',
        title: 'Edad Metabólica',
        unit: 'años',
        value: `${metabolicAge}`,
        status: 'Óptimo',
        statusColor: '#059669',
        statusBg: '#ECFDF5',
        icon: Clock,
        iconColor: '#10B981',
        iconBg: '#ECFDF5',
        desc: 'Edad estimada de tu condición biológica comparada con la media poblacional.',
        healthyRange: 'Si es menor a tu edad cronológica, indica excelente salud.',
      },
    ];
  }, [currentWeight, bodyFat, muscleMass, bmi, bmiStatusConfig]);

  // Guardar nuevo pesaje fáctico semanal
  const handleSaveWeighIn = () => {
    const numWeight = parseFloat(formWeight);
    const numMuscle = formMuscle ? parseFloat(formMuscle) : null;
    const numFat = formFat ? parseFloat(formFat) : null;

    if (!numWeight || numWeight <= 30 || numWeight > 300 || isNaN(numWeight)) {
      setAlertConfig({
        visible: true,
        title: 'Peso inválido',
        message: 'Por favor ingresá un número de peso válido (ej. 75.2 kg).',
        type: 'warning',
      });
      return;
    }

    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    const calculatedBmi = Number((numWeight / (1.75 * 1.75)).toFixed(1));
    logWeight(numWeight, numMuscle, numFat, calculatedBmi);

    setIsWeighInModalOpen(false);
    setAlertConfig({
      visible: true,
      title: 'Pesaje Semanal Guardado',
      message: `Se actualizaron las 14 métricas corporales fácticas con ${numWeight.toFixed(2)} kg.`,
      type: 'success',
    });
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#FAFAFA' }} edges={['top', 'left', 'right']}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {/* TOP HEADER */}
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingHorizontal: 20,
            paddingVertical: 12,
            backgroundColor: '#FFFFFF',
            borderBottomWidth: 1,
            borderBottomColor: '#F1F5F9',
          }}
        >
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={{
              width: 38,
              height: 38,
              borderRadius: 19,
              backgroundColor: '#F8FAFC',
              alignItems: 'center',
              justifyContent: 'center',
              borderWidth: 1,
              borderColor: '#E2E8F0',
            }}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <ChevronLeft size={22} color="#0F172A" />
          </TouchableOpacity>

          <View style={{ alignItems: 'center' }}>
            <Text style={{ fontSize: 16, fontWeight: '800', color: '#0F172A' }}>
              Detalles del Pesaje
            </Text>
            <Text style={{ fontSize: 11, color: '#64748B', fontWeight: '500', marginTop: 1 }}>
              {weightTracker?.lastUpdated ? `Pesaje: ${weightTracker.lastUpdated}` : 'Semanal'}
            </Text>
          </View>

          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            {/* Ocultar / Mostrar Valores */}
            <TouchableOpacity
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setShowValues((prev) => !prev);
              }}
              style={{
                width: 36,
                height: 36,
                borderRadius: 18,
                backgroundColor: '#F8FAFC',
                alignItems: 'center',
                justifyContent: 'center',
                borderWidth: 1,
                borderColor: '#E2E8F0',
              }}
            >
              {showValues ? (
                <Eye size={17} color="#64748B" />
              ) : (
                <EyeOff size={17} color="#94A3B8" />
              )}
            </TouchableOpacity>

            {/* Registrar Pesaje Semanal */}
            <TouchableOpacity
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setIsWeighInModalOpen(true);
              }}
              activeOpacity={0.85}
              style={{
                borderRadius: 18,
                shadowColor: '#F97316',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.25,
                shadowRadius: 4,
                elevation: 2,
              }}
            >
              <LinearGradient
                colors={ZENIT_GRADIENT}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 18,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Plus size={18} color="#FFFFFF" strokeWidth={2.5} />
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>

        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ padding: 20, paddingBottom: 60 }}
          showsVerticalScrollIndicator={false}
        >
          {/* HERO CARD INSPIRADA EN OKOK (Peso, Status, Barra de Rango y Comparativas) */}
          <View
            style={{
              backgroundColor: '#FFFFFF',
              borderRadius: 24,
              padding: 20,
              borderWidth: 1,
              borderColor: '#F1F5F9',
              shadowColor: '#0F172A',
              shadowOffset: { width: 0, height: 6 },
              shadowOpacity: 0.04,
              shadowRadius: 14,
              elevation: 2,
              marginBottom: 20,
            }}
          >
            {/* ESTADO & FECHA */}
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <View
                style={{
                  backgroundColor: bmiStatusConfig.bg,
                  borderColor: bmiStatusConfig.border,
                  borderWidth: 1,
                  paddingHorizontal: 10,
                  paddingVertical: 4.5,
                  borderRadius: 999,
                }}
              >
                <Text
                  style={{
                    color: bmiStatusConfig.color,
                    fontSize: 11,
                    fontWeight: '800',
                    textTransform: 'uppercase',
                    letterSpacing: 0.5,
                  }}
                >
                  {bmiStatusConfig.label}
                </Text>
              </View>

              <Text style={{ fontSize: 11, color: '#94A3B8', fontWeight: '600' }}>
                {weightTracker?.lastUpdated ? `${weightTracker.lastUpdated} • 08:30` : 'Pesaje semanal'}
              </Text>
            </View>

            {/* VALOR GIGANTE DEL PESO */}
            <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 4, marginBottom: 16 }}>
              <Text style={{ fontSize: 40, fontWeight: '900', color: '#0F172A', letterSpacing: -1.5 }}>
                {showValues ? currentWeight.toFixed(2) : '••••'}
              </Text>
              <Text style={{ fontSize: 18, fontWeight: '800', color: '#94A3B8' }}>kg</Text>
            </View>

            {/* BARRA DE RANGO SEGMENTADA CON VALORES (OKOK STYLE) */}
            <View style={{ marginBottom: 18 }}>
              <View style={{ flexDirection: 'row', gap: 6, height: 8, marginBottom: 6 }}>
                {BMI_RANGES.map((range, idx) => {
                  const isActive = idx === activeBmiSegment;
                  return (
                    <View
                      key={range.key}
                      style={{
                        flex: 1,
                        height: '100%',
                        borderRadius: 999,
                        backgroundColor: range.color,
                        opacity: isActive ? 1 : 0.25,
                      }}
                    />
                  );
                })}
              </View>

              <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                <Text style={{ fontSize: 10, fontWeight: '700', color: '#94A3B8' }}>Bajo (&lt;58)</Text>
                <Text style={{ fontSize: 10, fontWeight: '700', color: '#059669' }}>Saludable (74)</Text>
                <Text style={{ fontSize: 10, fontWeight: '700', color: '#94A3B8' }}>Alto (89)</Text>
                <Text style={{ fontSize: 10, fontWeight: '700', color: '#94A3B8' }}>Exceso</Text>
              </View>
            </View>

            {/* BLOQUE COMPARATIVO DE DOBLE COLUMNA */}
            <View
              style={{
                flexDirection: 'row',
                backgroundColor: '#F8FAFC',
                borderRadius: 18,
                paddingVertical: 14,
                paddingHorizontal: 16,
                borderWidth: 1,
                borderColor: '#F1F5F9',
              }}
            >
              {/* COMPARATIVA VS ÚLTIMA VEZ */}
              <View style={{ flex: 1 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                  {weightDelta !== null ? (
                    <>
                      {weightDelta < 0 ? (
                        <TrendingDown size={15} color="#059669" />
                      ) : weightDelta > 0 ? (
                        <TrendingUp size={15} color="#0F172A" />
                      ) : (
                        <Minus size={15} color="#64748B" />
                      )}
                      <Text
                        style={{
                          fontSize: 18,
                          fontWeight: '900',
                          color: weightDelta < 0 ? '#059669' : '#0F172A',
                          letterSpacing: -0.3,
                        }}
                      >
                        {showValues
                          ? `${weightDelta > 0 ? '+' : ''}${weightDelta.toFixed(1)} kg`
                          : '••••'}
                      </Text>
                    </>
                  ) : (
                    <Text style={{ fontSize: 16, fontWeight: '800', color: '#94A3B8' }}>--</Text>
                  )}
                </View>
                <Text style={{ fontSize: 11, color: '#64748B', fontWeight: '600', marginTop: 2 }}>
                  {prevDateStr ? `vs. última vez (${prevDateStr})` : 'En comparación con última vez'}
                </Text>
              </View>

              <View style={{ width: 1, height: '80%', backgroundColor: '#E2E8F0', alignSelf: 'center', marginHorizontal: 12 }} />

              {/* COMPARATIVA VS META */}
              <View style={{ flex: 1, paddingLeft: 4 }}>
                <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 2 }}>
                  <Text style={{ fontSize: 18, fontWeight: '900', color: '#0F172A', letterSpacing: -0.3 }}>
                    {showValues ? `${targetWeight.toFixed(1)}` : '••••'}
                  </Text>
                  <Text style={{ fontSize: 11, fontWeight: '700', color: '#94A3B8' }}>kg</Text>
                </View>
                <Text style={{ fontSize: 11, color: '#64748B', fontWeight: '600', marginTop: 2 }}>
                  {diffToTarget < 0.1 ? 'Meta alcanzada' : `Meta (${diffToTarget.toFixed(1)} kg dif.)`}
                </Text>
              </View>
            </View>
          </View>

          {/* AVISO / ADVERTENCIA ESTILO ZENIT */}
          <View
            style={{
              backgroundColor: '#FFFFFF',
              borderRadius: 20,
              padding: 16,
              borderWidth: 1,
              borderColor: '#FED7AA',
              marginBottom: 20,
              shadowColor: '#F97316',
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.06,
              shadowRadius: 10,
              elevation: 2,
            }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 }}>
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
                <AlertTriangle size={13} color="#FFFFFF" strokeWidth={2.5} />
              </LinearGradient>
              <Text style={{ fontSize: 12, fontWeight: '800', color: '#EA580C', textTransform: 'uppercase', letterSpacing: 0.6 }}>
                Aviso de Precisión
              </Text>
            </View>
            <Text style={{ fontSize: 12, color: '#475569', lineHeight: 18, fontWeight: '500' }}>
              Podés registrar tus pesajes semanales de forma manual, pero te <Text style={{ fontWeight: '800', color: '#0F172A' }}>recomendamos encarecidamente utilizar una báscula de bioimpedancia</Text>. Tené en cuenta que estas básculas presentan una <Text style={{ fontWeight: '800', color: '#EA580C' }}>mínima variación del 3% al 8% frente a estudios médicos estándares (como DEXA)</Text>, pero su gran valor radica en brindar una excelente precisión de tendencia y evolución semanal.
            </Text>
          </View>

          {/* TAB SELECTOR: MÉTRICAS CORPORALES vs HISTORIAL */}
          <View
            style={{
              flexDirection: 'row',
              backgroundColor: '#F1F5F9',
              padding: 4,
              borderRadius: 16,
              marginBottom: 16,
            }}
          >
            <TouchableOpacity
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setActiveTab('metrics');
              }}
              style={{
                flex: 1,
                paddingVertical: 9,
                alignItems: 'center',
                backgroundColor: activeTab === 'metrics' ? '#FFFFFF' : 'transparent',
                borderRadius: 12,
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 1 },
                shadowOpacity: activeTab === 'metrics' ? 0.05 : 0,
                shadowRadius: 3,
              }}
            >
              <Text
                style={{
                  fontSize: 13,
                  fontWeight: activeTab === 'metrics' ? '800' : '600',
                  color: activeTab === 'metrics' ? '#0F172A' : '#64748B',
                }}
              >
                Métricas corporales (14)
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setActiveTab('history');
              }}
              style={{
                flex: 1,
                paddingVertical: 9,
                alignItems: 'center',
                backgroundColor: activeTab === 'history' ? '#FFFFFF' : 'transparent',
                borderRadius: 12,
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 1 },
                shadowOpacity: activeTab === 'history' ? 0.05 : 0,
                shadowRadius: 3,
              }}
            >
              <Text
                style={{
                  fontSize: 13,
                  fontWeight: activeTab === 'history' ? '800' : '600',
                  color: activeTab === 'history' ? '#0F172A' : '#64748B',
                }}
              >
                Historial de pesajes
              </Text>
            </TouchableOpacity>
          </View>

          {/* TAB 1: LISTA COMPLETA DE MÉTRICAS DE BIOIMPEDANCIA (OKOK STYLE) */}
          {activeTab === 'metrics' && (
            <View style={{ gap: 10 }}>
              {metricsData.map((item) => {
                const IconComponent = item.icon;
                return (
                  <TouchableOpacity
                    key={item.id}
                    activeOpacity={0.8}
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      setSelectedMetric(item);
                    }}
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      backgroundColor: '#FFFFFF',
                      borderRadius: 18,
                      paddingVertical: 14,
                      paddingHorizontal: 16,
                      borderWidth: 1,
                      borderColor: '#F1F5F9',
                      shadowColor: '#0F172A',
                      shadowOffset: { width: 0, height: 2 },
                      shadowOpacity: 0.02,
                      shadowRadius: 6,
                    }}
                  >
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 }}>
                      <View
                        style={{
                          width: 36,
                          height: 36,
                          borderRadius: 12,
                          backgroundColor: item.iconBg,
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        <IconComponent size={18} color={item.iconColor} />
                      </View>

                      <View style={{ flex: 1, paddingRight: 8 }}>
                        <Text style={{ fontSize: 13, fontWeight: '700', color: '#0F172A' }} numberOfLines={1}>
                          {item.title}
                        </Text>
                        <Text style={{ fontSize: 11, color: '#94A3B8', fontWeight: '500', marginTop: 1 }}>
                          Toca para interpretar
                        </Text>
                      </View>
                    </View>

                    <View style={{ alignItems: 'flex-end' }}>
                      <Text style={{ fontSize: 16, fontWeight: '900', color: '#0F172A' }}>
                        {showValues ? item.value : '••••'}
                      </Text>
                      <View
                        style={{
                          backgroundColor: item.statusBg,
                          paddingHorizontal: 7,
                          paddingVertical: 2,
                          borderRadius: 6,
                          marginTop: 3,
                        }}
                      >
                        <Text
                          style={{
                            fontSize: 10,
                            fontWeight: '800',
                            color: item.statusColor,
                          }}
                        >
                          {item.status}
                        </Text>
                      </View>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          )}

          {/* TAB 2: HISTORIAL DE PESAJES SEMANALES */}
          {activeTab === 'history' && (
            <View
              style={{
                backgroundColor: '#FFFFFF',
                borderRadius: 22,
                padding: 18,
                borderWidth: 1,
                borderColor: '#F1F5F9',
              }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 14 }}>
                <Clock size={16} color="#64748B" />
                <Text style={{ fontSize: 14, fontWeight: '800', color: '#0F172A' }}>
                  Evolución Histórica
                </Text>
              </View>

              {history && history.length > 0 ? (
                <View style={{ gap: 12 }}>
                  {history.map((entry, index) => {
                    const prevEntry = history[index + 1];
                    const delta = prevEntry ? Number(entry.weightKg) - Number(prevEntry.weightKg) : null;

                    return (
                      <View
                        key={index}
                        style={{
                          flexDirection: 'row',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          paddingVertical: 12,
                          borderBottomWidth: index === history.length - 1 ? 0 : 1,
                          borderBottomColor: '#F8FAFC',
                        }}
                      >
                        <View>
                          <Text style={{ fontSize: 14, fontWeight: '800', color: '#0F172A' }}>
                            {entry.date}
                          </Text>
                          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 3 }}>
                            {entry.muscleMassKg && (
                              <Text style={{ fontSize: 11, color: '#3B82F6', fontWeight: '600' }}>
                                Músculo: {Number(entry.muscleMassKg).toFixed(1)} kg
                              </Text>
                            )}
                            {entry.bodyFatPct && (
                              <Text style={{ fontSize: 11, color: '#F59E0B', fontWeight: '600' }}>
                                Grasa: {Number(entry.bodyFatPct).toFixed(1)}%
                              </Text>
                            )}
                          </View>
                        </View>

                        <View style={{ alignItems: 'flex-end' }}>
                          <Text style={{ fontSize: 17, fontWeight: '900', color: '#0F172A' }}>
                            {showValues ? `${Number(entry.weightKg).toFixed(2)} kg` : '••••'}
                          </Text>
                          {delta !== null && (
                            <Text
                              style={{
                                fontSize: 11,
                                fontWeight: '700',
                                color: delta < 0 ? '#059669' : '#0F172A',
                                marginTop: 2,
                              }}
                            >
                              {delta > 0 ? `+${delta.toFixed(1)}` : delta.toFixed(1)} kg
                            </Text>
                          )}
                        </View>
                      </View>
                    );
                  })}
                </View>
              ) : (
                <View style={{ paddingVertical: 20, alignItems: 'center' }}>
                  <Text style={{ fontSize: 13, color: '#94A3B8', fontWeight: '600' }}>
                    No hay pesajes anteriores registrados aún.
                  </Text>
                </View>
              )}
            </View>
          )}

          {/* BOTÓN INFERIOR: REGISTRAR PESAJE ESTILO ZENIT */}
          <TouchableOpacity
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              setIsWeighInModalOpen(true);
            }}
            activeOpacity={0.88}
            style={{
              marginTop: 24,
              borderRadius: 20,
              shadowColor: '#F97316',
              shadowOffset: { width: 0, height: 6 },
              shadowOpacity: 0.28,
              shadowRadius: 14,
              elevation: 4,
            }}
          >
            <LinearGradient
              colors={ZENIT_GRADIENT}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={{
                borderRadius: 20,
                paddingVertical: 16,
                alignItems: 'center',
                flexDirection: 'row',
                justifyContent: 'center',
                gap: 10,
              }}
            >
              <Plus size={20} color="#FFFFFF" strokeWidth={2.5} />
              <Text style={{ color: '#FFFFFF', fontSize: 15, fontWeight: '800', letterSpacing: 0.3 }}>
                Registrar Nuevo Pesaje Semanal
              </Text>
            </LinearGradient>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* MODAL DETALLE DE MÉTRICA INDIVIDUAL (EXPLICACIÓN INTERPRETATIVA) */}
      <Modal
        visible={!!selectedMetric}
        transparent
        animationType="fade"
        onRequestClose={() => setSelectedMetric(null)}
      >
        <View
          style={{
            flex: 1,
            backgroundColor: 'rgba(15, 23, 42, 0.5)',
            justifyContent: 'center',
            alignItems: 'center',
            padding: 24,
          }}
        >
          <View
            style={{
              backgroundColor: '#FFFFFF',
              borderRadius: 24,
              padding: 24,
              width: '100%',
              maxWidth: 380,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 10 },
              shadowOpacity: 0.1,
              shadowRadius: 20,
            }}
          >
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <Text style={{ fontSize: 17, fontWeight: '900', color: '#0F172A', flex: 1 }}>
                {selectedMetric?.title}
              </Text>
              <TouchableOpacity
                onPress={() => setSelectedMetric(null)}
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 16,
                  backgroundColor: '#F1F5F9',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <X size={16} color="#64748B" />
              </TouchableOpacity>
            </View>

            <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 6, marginBottom: 12 }}>
              <Text style={{ fontSize: 32, fontWeight: '900', color: '#0F172A' }}>
                {selectedMetric?.value}
              </Text>
              <View
                style={{
                  backgroundColor: selectedMetric?.statusBg,
                  paddingHorizontal: 8,
                  paddingVertical: 3,
                  borderRadius: 6,
                }}
              >
                <Text style={{ fontSize: 11, fontWeight: '800', color: selectedMetric?.statusColor }}>
                  {selectedMetric?.status}
                </Text>
              </View>
            </View>

            <Text style={{ fontSize: 13, color: '#475569', lineHeight: 19, marginBottom: 14 }}>
              {selectedMetric?.desc}
            </Text>

            <View
              style={{
                backgroundColor: '#F8FAFC',
                borderRadius: 14,
                padding: 12,
                borderWidth: 1,
                borderColor: '#E2E8F0',
                marginBottom: 18,
              }}
            >
              <Text style={{ fontSize: 11, fontWeight: '700', color: '#64748B' }}>
                Referencia saludable:
              </Text>
              <Text style={{ fontSize: 12, fontWeight: '600', color: '#0F172A', marginTop: 2 }}>
                {selectedMetric?.healthyRange}
              </Text>
            </View>

            <TouchableOpacity
              onPress={() => setSelectedMetric(null)}
              activeOpacity={0.85}
              style={{
                borderRadius: 16,
                shadowColor: '#F97316',
                shadowOffset: { width: 0, height: 3 },
                shadowOpacity: 0.25,
                shadowRadius: 6,
                elevation: 3,
              }}
            >
              <LinearGradient
                colors={ZENIT_GRADIENT}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={{
                  borderRadius: 16,
                  paddingVertical: 14,
                  alignItems: 'center',
                }}
              >
                <Text style={{ color: '#FFFFFF', fontWeight: '800', fontSize: 14 }}>
                  Entendido
                </Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* MODAL REGISTRO DE NUEVO PESAJE SEMANAL */}
      <Modal
        visible={isWeighInModalOpen}
        transparent
        animationType="slide"
        onRequestClose={() => setIsWeighInModalOpen(false)}
      >
        <KeyboardAvoidingView
          style={{ flex: 1, backgroundColor: 'rgba(15, 23, 42, 0.5)', justifyContent: 'flex-end' }}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <View
            style={{
              backgroundColor: '#FFFFFF',
              borderTopLeftRadius: 28,
              borderTopRightRadius: 28,
              padding: 24,
              paddingBottom: 40,
            }}
          >
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
              <View>
                <Text style={{ fontSize: 18, fontWeight: '900', color: '#0F172A' }}>
                  Registrar Pesaje Semanal
                </Text>
                <Text style={{ fontSize: 12, color: '#64748B', marginTop: 2 }}>
                  Ingresá los datos fácticos de tu medición
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => setIsWeighInModalOpen(false)}
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 16,
                  backgroundColor: '#F1F5F9',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <X size={16} color="#64748B" />
              </TouchableOpacity>
            </View>

            {/* INPUT PESO */}
            <View style={{ marginBottom: 14 }}>
              <Text style={{ fontSize: 12, fontWeight: '700', color: '#475569', marginBottom: 6 }}>
                Peso corporal (kg) *
              </Text>
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  backgroundColor: '#F8FAFC',
                  borderWidth: 1,
                  borderColor: '#E2E8F0',
                  borderRadius: 14,
                  paddingHorizontal: 16,
                  paddingVertical: 10,
                }}
              >
                <TextInput
                  value={formWeight}
                  onChangeText={(t) => setFormWeight(t.replace(/[^0-9.]/g, ''))}
                  keyboardType="numeric"
                  placeholder="Ej: 74.8"
                  placeholderTextColor="#94A3B8"
                  style={{ flex: 1, fontSize: 18, fontWeight: '800', color: '#0F172A', padding: 0 }}
                />
                <Text style={{ fontSize: 14, fontWeight: '700', color: '#059669' }}>kg</Text>
              </View>
            </View>

            {/* INPUT MASA MUSCULAR */}
            <View style={{ marginBottom: 14 }}>
              <Text style={{ fontSize: 12, fontWeight: '700', color: '#475569', marginBottom: 6 }}>
                Masa muscular esquelética (kg, opcional)
              </Text>
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  backgroundColor: '#F8FAFC',
                  borderWidth: 1,
                  borderColor: '#E2E8F0',
                  borderRadius: 14,
                  paddingHorizontal: 16,
                  paddingVertical: 10,
                }}
              >
                <TextInput
                  value={formMuscle}
                  onChangeText={(t) => setFormMuscle(t.replace(/[^0-9.]/g, ''))}
                  keyboardType="numeric"
                  placeholder="Ej: 35.2"
                  placeholderTextColor="#94A3B8"
                  style={{ flex: 1, fontSize: 18, fontWeight: '800', color: '#0F172A', padding: 0 }}
                />
                <Text style={{ fontSize: 14, fontWeight: '700', color: '#2563EB' }}>kg</Text>
              </View>
            </View>

            {/* INPUT GRASA CORPORAL */}
            <View style={{ marginBottom: 20 }}>
              <Text style={{ fontSize: 12, fontWeight: '700', color: '#475569', marginBottom: 6 }}>
                Porcentaje de grasa corporal (% opcional)
              </Text>
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  backgroundColor: '#F8FAFC',
                  borderWidth: 1,
                  borderColor: '#E2E8F0',
                  borderRadius: 14,
                  paddingHorizontal: 16,
                  paddingVertical: 10,
                }}
              >
                <TextInput
                  value={formFat}
                  onChangeText={(t) => setFormFat(t.replace(/[^0-9.]/g, ''))}
                  keyboardType="numeric"
                  placeholder="Ej: 15.4"
                  placeholderTextColor="#94A3B8"
                  style={{ flex: 1, fontSize: 18, fontWeight: '800', color: '#0F172A', padding: 0 }}
                />
                <Text style={{ fontSize: 14, fontWeight: '700', color: '#F59E0B' }}>%</Text>
              </View>
            </View>

            <TouchableOpacity
              onPress={handleSaveWeighIn}
              activeOpacity={0.88}
              style={{
                borderRadius: 18,
                shadowColor: '#F97316',
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.28,
                shadowRadius: 10,
                elevation: 3,
              }}
            >
              <LinearGradient
                colors={ZENIT_GRADIENT}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={{
                  borderRadius: 18,
                  paddingVertical: 16,
                  alignItems: 'center',
                  flexDirection: 'row',
                  justifyContent: 'center',
                  gap: 8,
                }}
              >
                <Check size={18} color="#FFFFFF" strokeWidth={2.5} />
                <Text style={{ color: '#FFFFFF', fontWeight: '800', fontSize: 15 }}>
                  Guardar y Recalcular Métricas
                </Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      <ZenitModalAlert
        visible={alertConfig.visible}
        title={alertConfig.title}
        message={alertConfig.message}
        type={alertConfig.type}
        onConfirm={() => setAlertConfig((prev) => ({ ...prev, visible: false }))}
        confirmText="Aceptar"
      />
    </SafeAreaView>
  );
}
