import React, { useEffect } from 'react';
import { View } from 'react-native';
import Animated, { useSharedValue, useAnimatedProps, withSpring } from 'react-native-reanimated';
import Svg, { Circle, G, Defs, LinearGradient as SvgLinearGradient, Stop } from 'react-native-svg';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

export const PremiumRing = ({ size = 100, strokeWidth = 8, gradientColors, percentage = 0, id = "ring", children }) => {
    const progress = useSharedValue(0);
    const radius = (size - strokeWidth) / 2;
    const circumference = radius * 2 * Math.PI;
    const center = size / 2;

    useEffect(() => {
        // Efecto velocímetro: rebote tenso y rápido
        progress.value = withSpring(percentage, {
            mass: 1,
            damping: 15,
            stiffness: 90,
        });
    }, [percentage]);

    const animatedProps = useAnimatedProps(() => {
        // 1. Candado matemático: Forzamos a que el rebote físico nunca pase de 0 a nivel cálculo.
        const clampedProgress = Math.max(0, Math.min(1, progress.value));
        
        return {
            strokeDashoffset: circumference * (1 - clampedProgress),
            // 2. MAGIA ANTI-PARPADEO: Si la barra está vacía (o rebotando en 0), la volvemos invisible
            // para que el strokeLinecap="round" no dibuje el infame "puntito fantasma".
            strokeOpacity: clampedProgress <= 0.001 ? 0 : 1,
        };
    });

    const gradientId = `grad_${id}_${gradientColors[0].replace('#', '')}`;

    return (
        <View style={{ width: size, height: size }} className="items-center justify-center">
            <Svg width={size} height={size} style={{ position: 'absolute' }}>
                <Defs>
                    <SvgLinearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
                        <Stop offset="0%" stopColor={gradientColors[0]} stopOpacity="1" />
                        <Stop offset="100%" stopColor={gradientColors[1]} stopOpacity="1" />
                    </SvgLinearGradient>
                </Defs>
                <G origin={`${center}, ${center}`} rotation="-90">
                    <Circle cx={center} cy={center} r={radius} stroke="#F3F4F6" strokeWidth={strokeWidth} fill="transparent" />
                    <AnimatedCircle
                        stroke={`url(#${gradientId})`} cx={center} cy={center} r={radius} 
                        strokeWidth={strokeWidth} fill="transparent"
                        strokeDasharray={circumference} animatedProps={animatedProps} strokeLinecap="round" 
                    />
                </G>
            </Svg>
            <View className="items-center justify-center w-full h-full">{children}</View>
        </View>
    );
};