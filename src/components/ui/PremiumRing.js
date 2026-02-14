import React, { useEffect } from 'react';
import { View } from 'react-native';
import Animated, { useSharedValue, useAnimatedProps, withTiming, Easing } from 'react-native-reanimated';
import Svg, { Circle, G, Defs, LinearGradient as SvgLinearGradient, Stop } from 'react-native-svg';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

export const PremiumRing = ({ size = 100, strokeWidth = 8, gradientColors, percentage = 0.75, id = "ring", children }) => {
    const progress = useSharedValue(0);
    const radius = (size - strokeWidth) / 2;
    const circumference = radius * 2 * Math.PI;
    const center = size / 2;

    useEffect(() => {
        progress.value = withTiming(percentage, { duration: 2000, easing: Easing.out(Easing.exp) });
    }, [percentage]);

    const animatedProps = useAnimatedProps(() => ({
        strokeDashoffset: circumference * (1 - progress.value),
    }));

    return (
        <View style={{ width: size, height: size }} className="items-center justify-center">
            <Svg width={size} height={size} style={{ position: 'absolute' }}>
                <Defs>
                    <SvgLinearGradient id={`grad_${id}`} x1="0%" y1="0%" x2="100%" y2="100%">
                        <Stop offset="0%" stopColor={gradientColors[0]} stopOpacity="1" />
                        <Stop offset="100%" stopColor={gradientColors[1]} stopOpacity="1" />
                    </SvgLinearGradient>
                </Defs>
                <G origin={`${center}, ${center}`} rotation="-90">
                    <Circle cx={center} cy={center} r={radius} stroke="#F3F4F6" strokeWidth={strokeWidth} fill="transparent" />
                    <AnimatedCircle
                        stroke={`url(#grad_${id})`} cx={center} cy={center} r={radius} 
                        strokeWidth={strokeWidth} fill="transparent"
                        strokeDasharray={circumference} animatedProps={animatedProps} strokeLinecap="round" 
                    />
                </G>
            </Svg>
            <View className="items-center justify-center w-full h-full">{children}</View>
        </View>
    );
};