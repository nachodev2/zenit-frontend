import React, { memo, useCallback, useState } from 'react';
import { View, Text } from 'react-native';
import Body from 'react-native-body-highlighter';
import * as Haptics from 'expo-haptics';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  runOnJS,
} from 'react-native-reanimated';
import {
  GestureDetector,
  Gesture,
  GestureHandlerRootView,
} from 'react-native-gesture-handler';

// Mapeo de slugs de la librería a nuestros nombres
const MUSCLE_MAP = {
  'chest': 'chest',
  'upper-back': 'back',
  'abs': 'abs',
  'obliques': 'obliques',
  'front-deltoids': 'shoulders',
  'back-deltoids': 'shoulders',
  'deltoids': 'shoulders',
  'biceps': 'biceps',
  'forearm': 'forearms',
  'quadriceps': 'legs',
  'calves': 'calves',
  'adductors': 'legs',
  'trapezius': 'traps',
  'triceps': 'triceps',
  'lower-back': 'lowback',
  'gluteal': 'glutes',
  'hamstring': 'hamstrings',
  'neck': 'traps',
  'head': null,
  'hands': null,
  'feet': null,
};

// Colores de los músculos exportados
export const MUSCLE_COLORS = {
  chest: '#ef4444',
  shoulders: '#f97316',
  biceps: '#eab308',
  triceps: '#84cc16',
  forearms: '#06b6d4',
  abs: '#22c55e',
  obliques: '#10b981',
  back: '#14b8a6',
  lats: '#0891b2',
  lowback: '#6366f1',
  legs: '#3b82f6',
  hamstrings: '#8b5cf6',
  glutes: '#a855f7',
  calves: '#ec4899',
  traps: '#f43f5e',
};

const MIN_SCALE = 1;
const MAX_SCALE = 3;

const HumanBody = memo(({ onSelectMuscle, selectedMuscle, selectedMuscles = [], isFrontView }) => {
  const [isZoomed, setIsZoomed] = useState(false);
  
  const scale = useSharedValue(1);
  const savedScale = useSharedValue(1);
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const savedTranslateX = useSharedValue(0);
  const savedTranslateY = useSharedValue(0);

  // Usar selectedMuscles si existe, sino usar selectedMuscle
  const musclesToHighlight = selectedMuscles.length > 0 ? selectedMuscles : (selectedMuscle ? [selectedMuscle] : []);

  const getBodyData = useCallback(() => {
    if (musclesToHighlight.length === 0) return [];
    
    const allSlugs = [];
    musclesToHighlight.forEach(muscle => {
      const slugs = Object.entries(MUSCLE_MAP)
        .filter(([_, value]) => value === muscle)
        .map(([slug, _]) => ({ 
          slug, 
          intensity: 2,
          color: MUSCLE_COLORS[muscle]
        }));
      allSlugs.push(...slugs);
    });
    
    return allSlugs;
  }, [musclesToHighlight]);

  const handleBodyPress = useCallback((muscle) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    
    const mappedMuscle = MUSCLE_MAP[muscle.slug];
    
    if (mappedMuscle) {
      onSelectMuscle(mappedMuscle);
    }
  }, [onSelectMuscle]);

  const toggleZoom = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setIsZoomed(prev => !prev);
  }, []);

  const pinchGesture = Gesture.Pinch()
    .onUpdate((event) => {
      const newScale = savedScale.value * event.scale;
      scale.value = Math.min(Math.max(newScale, MIN_SCALE), MAX_SCALE);
    })
    .onEnd(() => {
      savedScale.value = scale.value;
      if (scale.value <= 1.1) {
        scale.value = withSpring(1);
        savedScale.value = 1;
        translateX.value = withSpring(0);
        translateY.value = withSpring(0);
        savedTranslateX.value = 0;
        savedTranslateY.value = 0;
        runOnJS(setIsZoomed)(false);
      } else {
        runOnJS(setIsZoomed)(true);
      }
    });

  const panGesture = Gesture.Pan()
    .minPointers(2)
    .onUpdate((event) => {
      if (scale.value > 1) {
        translateX.value = savedTranslateX.value + event.translationX;
        translateY.value = savedTranslateY.value + event.translationY;
      }
    })
    .onEnd(() => {
      savedTranslateX.value = translateX.value;
      savedTranslateY.value = translateY.value;
    });

  const doubleTapGesture = Gesture.Tap()
    .numberOfTaps(2)
    .maxDuration(250)
    .onStart(() => {
      runOnJS(toggleZoom)();
      
      if (scale.value > 1) {
        scale.value = withSpring(1);
        savedScale.value = 1;
        translateX.value = withSpring(0);
        translateY.value = withSpring(0);
        savedTranslateX.value = 0;
        savedTranslateY.value = 0;
      } else {
        scale.value = withSpring(2);
        savedScale.value = 2;
      }
    });

  const pinchPanGesture = Gesture.Simultaneous(pinchGesture, panGesture);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
      { scale: scale.value },
    ],
  }));

  // Color principal (último seleccionado o primero)
  const primaryColor = musclesToHighlight.length > 0 
    ? MUSCLE_COLORS[musclesToHighlight[musclesToHighlight.length - 1]] 
    : '#ef4444';

  return (
    <GestureHandlerRootView className="flex-1 overflow-hidden">
      <GestureDetector gesture={pinchPanGesture}>
        <Animated.View 
          className="flex-1 items-center justify-center"
          style={animatedStyle}
        >
          <GestureDetector gesture={doubleTapGesture}>
            <View className="items-center justify-center">
              <View className="items-center justify-center">
                <Body
                  data={getBodyData()}
                  onBodyPartPress={handleBodyPress}
                  gender="male"
                  side={isFrontView ? 'front' : 'back'}
                  scale={1.5}
                  colors={['#1f2937', primaryColor + '99', primaryColor]}
                  border="#4b5563"
                  defaultFill="#1f2937"
                  defaultStroke="#374151"
                  defaultStrokeWidth={0.5}
                />
              </View>
            </View>
          </GestureDetector>
        </Animated.View>
      </GestureDetector>
    </GestureHandlerRootView>
  );
});

HumanBody.displayName = 'HumanBody';

export default HumanBody;