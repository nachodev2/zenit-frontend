import React, { useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import Animated, {
  FadeInDown,
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSequence,
  withRepeat,
  Easing,
} from 'react-native-reanimated';
import Svg, { Path } from 'react-native-svg';
import { Droplets } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';

import { useUserStore } from '../../store/useUserStore';

export function WaterTrackerCard({
  amountMl = 0,
  targetMl = 2000,
  onPress,
}) {
  const addWater = useUserStore((state) => state.addWater);
  const percentage = Math.min(100, Math.max(0, Math.round((amountMl / targetMl) * 100)));
  const currentLiters = (amountMl / 1000).toFixed(amountMl % 1000 === 0 ? 1 : 2);
  const targetLiters = (targetMl / 1000).toFixed(1);

  // Animación suave del nivel de agua que inunda la card
  const fillHeight = useSharedValue(percentage);
  const cardScale = useSharedValue(1);

  useEffect(() => {
    fillHeight.value = withTiming(percentage, {
      duration: 800,
      easing: Easing.out(Easing.cubic),
    });
  }, [percentage]);

  // Micro-celebración háptica al alcanzar la meta
  const prevPercentageRef = useRef(percentage);
  useEffect(() => {
    if (prevPercentageRef.current < 100 && percentage >= 100) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
    prevPercentageRef.current = percentage;
  }, [percentage]);

  const animatedWaterStyle = useAnimatedStyle(() => ({
    height: `${fillHeight.value}%`,
  }));

  const animatedCardScaleStyle = useAnimatedStyle(() => ({
    transform: [{ scale: cardScale.value }],
  }));

  // Oleaje horizontal sutil continuo
  const waveTranslateX = useSharedValue(0);

  useEffect(() => {
    waveTranslateX.value = withRepeat(
      withTiming(-180, { duration: 3800, easing: Easing.linear }),
      -1,
      false
    );
  }, []);

  const waveStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: waveTranslateX.value }],
  }));

  // Gesto Long Press para sumar +250ml directamente desde la card
  const handleLongPressAdd = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    addWater?.(250);

    // Animación elástica de pulsación sutil
    cardScale.value = withSequence(
      withTiming(0.96, { duration: 110, easing: Easing.out(Easing.ease) }),
      withTiming(1.025, { duration: 160, easing: Easing.out(Easing.ease) }),
      withTiming(1.0, { duration: 130, easing: Easing.out(Easing.ease) })
    );
  };

  const isCelebration = percentage >= 100;

  return (
    <Animated.View
      entering={FadeInDown.delay(200).duration(450)}
      style={[{ flex: 1 }, animatedCardScaleStyle]}
    >
      <TouchableOpacity
        activeOpacity={0.88}
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          onPress?.();
        }}
        onLongPress={handleLongPressAdd}
        delayLongPress={360}
        style={styles.cardContainer}
      >
        {/* CAPA DE AGUA QUE INUNDA LA CARD DESDE EL FONDO */}
        <Animated.View style={[styles.waterWrapper, animatedWaterStyle]}>
          {/* Onda sutil de superficie */}
          {percentage > 0 && (
            <View style={styles.wavesHeader}>
              <Animated.View style={[styles.waveRow, waveStyle]}>
                <Svg width="540" height="12" viewBox="0 0 540 12">
                  <Path
                    d="M 0 6 Q 45 0 90 6 T 180 6 T 270 6 T 360 6 T 450 6 T 540 6 V 12 H 0 Z"
                    fill="rgba(186, 230, 253, 0.40)"
                  />
                </Svg>
              </Animated.View>
            </View>
          )}

          {/* Gradiente líquido siempre azul/celeste natural de agua */}
          <LinearGradient
            colors={[
              'rgba(186, 230, 253, 0.22)',
              'rgba(125, 211, 252, 0.32)',
              'rgba(56, 189, 248, 0.45)',
            ]}
            start={{ x: 0, y: 0 }}
            end={{ x: 0, y: 1 }}
            style={StyleSheet.absoluteFill}
          />
        </Animated.View>

        {/* CONTENIDO MINIMALISTA, LIMPIO Y SOFT */}
        <View style={styles.contentOverlay}>
          {/* Fila Superior: Badge Hidratación + Icono circular */}
          <View style={styles.headerRow}>
            <View
              style={[
                styles.dropletBadge,
                isCelebration && styles.dropletBadgeCelebration,
              ]}
            >
              <Droplets
                size={11}
                color={isCelebration ? '#059669' : '#0284C7'}
                fill={isCelebration ? '#059669' : '#0284C7'}
              />
              <Text
                style={[
                  styles.dropletBadgeText,
                  isCelebration && styles.dropletBadgeTextCelebration,
                ]}
              >
                Hidratación
              </Text>
            </View>

            <LinearGradient
              colors={
                isCelebration
                  ? ['#10B981', '#059669']
                  : ['#38BDF8', '#0284C7']
              }
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.iconCircle}
            >
              <Droplets size={16} color="white" />
            </LinearGradient>
          </View>

          {/* Fila Inferior: Métrica Principal Limpia */}
          <View style={styles.bottomInfo}>
            <View style={styles.litersRow}>
              <Text style={styles.currentLitersText}>{currentLiters}</Text>
              <Text style={styles.targetLitersText}>/ {targetLiters} L</Text>
            </View>

            <Text
              style={[
                styles.percentageText,
                isCelebration && styles.percentageTextCelebration,
              ]}
            >
              {isCelebration ? '100% completado' : `${percentage}% del objetivo`}
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  cardContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
    minHeight: 154,
    overflow: 'hidden',
    position: 'relative',
  },
  waterWrapper: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    overflow: 'hidden',
    zIndex: 1,
  },
  wavesHeader: {
    position: 'absolute',
    top: -8,
    left: 0,
    right: 0,
    height: 12,
    overflow: 'hidden',
  },
  waveRow: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: 540,
    height: 12,
  },
  contentOverlay: {
    flex: 1,
    padding: 16,
    justifyContent: 'space-between',
    zIndex: 10,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dropletBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E0F2FE',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
  },
  dropletBadgeCelebration: {
    backgroundColor: '#ECFDF5',
  },
  dropletBadgeText: {
    color: '#0284C7',
    fontSize: 9,
    fontWeight: '800',
    marginLeft: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  dropletBadgeTextCelebration: {
    color: '#059669',
    fontSize: 9,
    fontWeight: '800',
    marginLeft: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  iconCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#0284C7',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 2,
  },
  bottomInfo: {
    marginTop: 10,
  },
  litersRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 3,
  },
  currentLitersText: {
    color: '#111827',
    fontSize: 22,
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  targetLitersText: {
    color: '#9CA3AF',
    fontSize: 12,
    fontWeight: '700',
  },
  percentageText: {
    color: '#0284C7',
    fontSize: 11,
    fontWeight: '700',
    marginTop: 2,
  },
  percentageTextCelebration: {
    color: '#059669',
    fontWeight: '800',
  },
});

export default WaterTrackerCard;
