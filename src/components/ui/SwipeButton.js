import React, { useState } from 'react';
import { View, Dimensions } from 'react-native';
import { GestureDetector, Gesture } from 'react-native-gesture-handler';
import Animated, { useSharedValue, useAnimatedStyle, withSpring, runOnJS } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { ArrowRight } from 'lucide-react-native';
import { ZENIT_GRADIENT } from '../../constants/theme'; // Asegúrate de que esta ruta sea correcta

const { width } = Dimensions.get('window');

const SwipeButton = ({ onConfirm }) => {
    const BUTTON_HEIGHT = 60;
    const PADDING = 4;
    // Ajustamos el ancho restando el padding de la pantalla (48px aprox)
    const BUTTON_WIDTH = width - 48; 
    const SWIPEABLE_DIMENSIONS = BUTTON_HEIGHT - 2 * PADDING;
    const H_SWIPE_RANGE = BUTTON_WIDTH - 2 * PADDING - SWIPEABLE_DIMENSIONS;

    const X = useSharedValue(0);
    const [toggled, setToggled] = useState(false);

    const animatedStyles = useAnimatedStyle(() => ({ 
        transform: [{ translateX: X.value }] 
    }));
    
    const AnimatedLinearGradient = Animated.createAnimatedComponent(LinearGradient);
    
    const fillStyle = useAnimatedStyle(() => ({ 
        width: X.value + SWIPEABLE_DIMENSIONS 
    }));
    
    const textOpacityStyle = useAnimatedStyle(() => ({ 
        opacity: 1 - (X.value / H_SWIPE_RANGE) * 1.5 
    }));

    const panGesture = Gesture.Pan()
        .onUpdate((e) => {
            if (toggled) return;
            let newValue = e.translationX;
            if (newValue >= 0 && newValue <= H_SWIPE_RANGE) {
                X.value = newValue;
            }
        })
        .onEnd(() => {
            if (toggled) return;
            if (X.value > H_SWIPE_RANGE * 0.75) {
                X.value = withSpring(H_SWIPE_RANGE, { damping: 20 });
                runOnJS(setToggled)(true);
                runOnJS(Haptics.notificationAsync)(Haptics.NotificationFeedbackType.Success);
                runOnJS(onConfirm)();
            } else {
                X.value = withSpring(0, { damping: 20 });
            }
        });

    return (
        <View 
            className="bg-gray-100 rounded-full justify-center m-0 relative" 
            style={{ width: BUTTON_WIDTH, height: BUTTON_HEIGHT }}
        >
            <AnimatedLinearGradient 
                colors={ZENIT_GRADIENT} 
                start={{ x: 0, y: 0 }} 
                end={{ x: 1, y: 0 }} 
                style={[{ height: BUTTON_HEIGHT, borderRadius: 99, position: 'absolute', left: 0 }, fillStyle]} 
            />
            <View className="absolute w-full items-center justify-center">
                <Animated.Text 
                    style={[{ fontSize: 14, fontWeight: '800', letterSpacing: 1, color: '#A1A1AA', textTransform: 'uppercase' }, textOpacityStyle]}
                >
                    Desliza para comenzar
                </Animated.Text>
            </View>
            <GestureDetector gesture={panGesture}>
                <Animated.View 
                    style={[
                        animatedStyles, 
                        { 
                            width: SWIPEABLE_DIMENSIONS, 
                            height: SWIPEABLE_DIMENSIONS, 
                            borderRadius: 99, 
                            backgroundColor: 'white', 
                            marginLeft: PADDING, 
                            alignItems: 'center', 
                            justifyContent: 'center', 
                            shadowColor: "#000", 
                            shadowOffset: { width: 0, height: 2 }, 
                            shadowOpacity: 0.15, 
                            shadowRadius: 3.84, 
                            elevation: 5 
                        }
                    ]}
                >
                    <ArrowRight size={24} color="#F97316" strokeWidth={3} />
                </Animated.View>
            </GestureDetector>
        </View>
    );
};

export default SwipeButton;