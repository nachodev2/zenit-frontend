import React from 'react';
import { View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { ZENIT_GRADIENT } from '../../constants/theme';

/**
 * ZenitHighlightCard (DESIGN_SYSTEM.md 2.I)
 * Tarjeta de realce con borde sutil en Linear Gradient y fondo contenedor bimodal.
 * Sin rellenos color durazno ni fondos saturados.
 */
export function ZenitHighlightCard({
  children,
  style,
  innerStyle,
  borderRadius = 18,
  borderWidth = 1.5,
  isDark = false,
  containerBg,
}) {
  const bgColor = containerBg || (isDark ? '#1E293B' : '#FFFFFF');
  const innerRadius = Math.max(0, borderRadius - borderWidth);

  return (
    <LinearGradient
      colors={ZENIT_GRADIENT}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 0 }}
      style={[
        {
          borderRadius,
          padding: borderWidth,
        },
        style,
      ]}
    >
      <View
        style={[
          {
            backgroundColor: bgColor,
            borderRadius: innerRadius,
          },
          innerStyle,
        ]}
      >
        {children}
      </View>
    </LinearGradient>
  );
}

export default ZenitHighlightCard;

