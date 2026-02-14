import React, { useState, useCallback, memo, useMemo, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Pressable, Switch, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { X, Dumbbell, Clock, ChevronRight, RotateCcw, Plus, ClipboardList, Layers, MousePointer, Eye } from 'lucide-react-native';
import { StatusBar } from 'expo-status-bar';
import * as Haptics from 'expo-haptics';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withTiming,
  withSpring,
  interpolate,
  Extrapolation,
  FadeIn,
  FadeOut,
  FadeInDown,
  FadeInLeft,
  Layout,
  Easing,
  runOnJS,
} from 'react-native-reanimated';

import HumanBody, { MUSCLE_COLORS } from '../components/bodyHuman';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');
const PANEL_HEIGHT = SCREEN_HEIGHT * 0.65;

const exercisesData = {
  chest: {
    name: 'Pecho',
    exercises: [
      { name: 'Press de banca', sets: '4x10', time: '12 min', calories: 85 },
      { name: 'Aperturas con mancuernas', sets: '3x12', time: '10 min', calories: 60 },
      { name: 'Flexiones', sets: '3x15', time: '8 min', calories: 50 },
      { name: 'Press inclinado', sets: '4x10', time: '12 min', calories: 80 },
    ]
  },
  shoulders: {
    name: 'Hombros',
    exercises: [
      { name: 'Press militar', sets: '4x10', time: '12 min', calories: 75 },
      { name: 'Elevaciones laterales', sets: '3x15', time: '8 min', calories: 45 },
      { name: 'Elevaciones frontales', sets: '3x12', time: '8 min', calories: 40 },
      { name: 'Pájaros', sets: '3x12', time: '8 min', calories: 40 },
    ]
  },
  biceps: {
    name: 'Bíceps',
    exercises: [
      { name: 'Curl con barra', sets: '4x10', time: '10 min', calories: 55 },
      { name: 'Curl martillo', sets: '3x12', time: '8 min', calories: 45 },
      { name: 'Curl concentrado', sets: '3x10', time: '10 min', calories: 40 },
    ]
  },
  triceps: {
    name: 'Tríceps',
    exercises: [
      { name: 'Fondos en paralelas', sets: '4x10', time: '10 min', calories: 65 },
      { name: 'Extensión con cuerda', sets: '3x12', time: '8 min', calories: 45 },
      { name: 'Press francés', sets: '3x10', time: '10 min', calories: 50 },
    ]
  },
  forearms: {
    name: 'Antebrazos',
    exercises: [
      { name: 'Curl de muñeca', sets: '3x15', time: '6 min', calories: 25 },
      { name: 'Curl invertido', sets: '3x12', time: '6 min', calories: 25 },
      { name: 'Agarre con disco', sets: '3x30s', time: '5 min', calories: 20 },
    ]
  },
  abs: {
    name: 'Abdominales',
    exercises: [
      { name: 'Crunch', sets: '4x20', time: '8 min', calories: 50 },
      { name: 'Plancha', sets: '3x45s', time: '6 min', calories: 35 },
      { name: 'Elevación de piernas', sets: '3x15', time: '8 min', calories: 45 },
      { name: 'Russian twist', sets: '3x20', time: '8 min', calories: 40 },
    ]
  },
  obliques: {
    name: 'Oblicuos',
    exercises: [
      { name: 'Plancha lateral', sets: '3x30s', time: '6 min', calories: 30 },
      { name: 'Crunch oblicuo', sets: '3x15', time: '6 min', calories: 35 },
      { name: 'Leñador con polea', sets: '3x12', time: '8 min', calories: 40 },
    ]
  },
  back: {
    name: 'Espalda',
    exercises: [
      { name: 'Dominadas', sets: '4x8', time: '12 min', calories: 80 },
      { name: 'Remo con barra', sets: '4x10', time: '12 min', calories: 75 },
      { name: 'Jalón al pecho', sets: '3x12', time: '10 min', calories: 60 },
      { name: 'Remo en máquina', sets: '3x12', time: '10 min', calories: 55 },
    ]
  },
  lats: {
    name: 'Dorsales',
    exercises: [
      { name: 'Jalón al pecho', sets: '4x10', time: '10 min', calories: 60 },
      { name: 'Pullover', sets: '3x12', time: '8 min', calories: 50 },
      { name: 'Remo unilateral', sets: '3x10', time: '10 min', calories: 55 },
    ]
  },
  lowback: {
    name: 'Lumbar',
    exercises: [
      { name: 'Hiperextensiones', sets: '3x15', time: '8 min', calories: 45 },
      { name: 'Buenos días', sets: '3x12', time: '8 min', calories: 50 },
      { name: 'Superman', sets: '3x15', time: '6 min', calories: 35 },
    ]
  },
  legs: {
    name: 'Cuádriceps',
    exercises: [
      { name: 'Sentadillas', sets: '4x12', time: '15 min', calories: 120 },
      { name: 'Prensa', sets: '4x12', time: '12 min', calories: 100 },
      { name: 'Extensión de cuádriceps', sets: '3x15', time: '8 min', calories: 55 },
      { name: 'Zancadas', sets: '3x12', time: '10 min', calories: 70 },
    ]
  },
  hamstrings: {
    name: 'Isquiotibiales',
    exercises: [
      { name: 'Curl femoral', sets: '4x12', time: '10 min', calories: 50 },
      { name: 'Peso muerto rumano', sets: '4x10', time: '12 min', calories: 85 },
      { name: 'Buenos días', sets: '3x12', time: '8 min', calories: 50 },
    ]
  },
  glutes: {
    name: 'Glúteos',
    exercises: [
      { name: 'Hip thrust', sets: '4x12', time: '12 min', calories: 90 },
      { name: 'Zancadas', sets: '3x12', time: '10 min', calories: 75 },
      { name: 'Peso muerto rumano', sets: '4x10', time: '12 min', calories: 85 },
      { name: 'Patada de glúteo', sets: '3x15', time: '8 min', calories: 45 },
    ]
  },
  calves: {
    name: 'Pantorrillas',
    exercises: [
      { name: 'Elevación de talones de pie', sets: '4x15', time: '8 min', calories: 40 },
      { name: 'Elevación de talones sentado', sets: '3x20', time: '8 min', calories: 35 },
    ]
  },
  traps: {
    name: 'Trapecios',
    exercises: [
      { name: 'Encogimientos con barra', sets: '4x12', time: '8 min', calories: 40 },
      { name: 'Encogimientos con mancuernas', sets: '3x15', time: '8 min', calories: 35 },
      { name: 'Remo al mentón', sets: '3x12', time: '8 min', calories: 45 },
    ]
  },
};

// Tarjeta de ejercicio con animación suave
const ExerciseCard = memo(({ exercise, color, index, muscleName, onPress }) => (
  <Animated.View
    entering={FadeInLeft.delay(index * 40).duration(300).easing(Easing.out(Easing.quad))}
    layout={Layout.duration(200)}
  >
    <TouchableOpacity
      activeOpacity={0.7}
      className="bg-gray-800/50 border border-gray-700 rounded-2xl p-4 mb-3 flex-row items-center"
      onPress={() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        onPress();
      }}
    >
      <View style={{ backgroundColor: `${color}20` }} className="w-12 h-12 rounded-xl items-center justify-center">
        <Dumbbell size={24} color={color} />
      </View>
      
      <View className="flex-1 ml-4">
        <Text className="text-white font-semibold text-base">{exercise.name}</Text>
        <View className="flex-row items-center mt-1 flex-wrap">
          {muscleName && (
            <View style={{ backgroundColor: color }} className="px-2 py-0.5 rounded-full mr-2">
              <Text className="text-white text-xs font-medium">{muscleName}</Text>
            </View>
          )}
          <Text className="text-gray-400 text-sm">{exercise.sets}</Text>
          <View className="w-1 h-1 bg-gray-500 rounded-full mx-2" />
          <Clock size={12} color="#9ca3af" />
          <Text className="text-gray-400 text-sm ml-1">{exercise.time}</Text>
        </View>
      </View>
      <ChevronRight size={20} color="#6b7280" />
    </TouchableOpacity>
  </Animated.View>
));

ExerciseCard.displayName = 'ExerciseCard';

// Chip con animación suave
const MuscleChip = memo(({ muscle, onRemove }) => (
  <Animated.View
    entering={FadeIn.duration(200)}
    exiting={FadeOut.duration(150)}
    layout={Layout.duration(200)}
  >
    <TouchableOpacity
      onPress={onRemove}
      activeOpacity={0.7}
      className="flex-row items-center px-3 py-1.5 rounded-full mr-2"
      style={{ backgroundColor: MUSCLE_COLORS[muscle] }}
    >
      <Text className="text-white text-sm font-medium mr-1">{exercisesData[muscle]?.name}</Text>
      <X size={14} color="white" />
    </TouchableOpacity>
  </Animated.View>
));

MuscleChip.displayName = 'MuscleChip';

const HeaderIconButton = memo(({ onPress, icon: Icon, isActive = false }) => (
  <TouchableOpacity
    onPress={onPress}
    activeOpacity={0.7}
    className={`w-10 h-10 rounded-xl items-center justify-center ${isActive ? 'bg-blue-600' : 'bg-gray-800 border border-gray-700'}`}
  >
    <Icon size={20} color={isActive ? 'white' : '#9ca3af'} />
  </TouchableOpacity>
));

HeaderIconButton.displayName = 'HeaderIconButton';

// Componente del Panel Modal
const ExercisePanel = memo(({ 
  isOpen, 
  onClose, 
  selectedMuscles, 
  combinedExercises, 
  totalStats, 
  onExercisePress 
}) => {
  const translateY = useSharedValue(PANEL_HEIGHT);
  const overlayOpacity = useSharedValue(0);
  const [shouldRender, setShouldRender] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setShouldRender(true);
      overlayOpacity.value = withTiming(1, { duration: 250, easing: Easing.out(Easing.quad) });
      translateY.value = withTiming(0, { duration: 350, easing: Easing.out(Easing.cubic) });
    } else {
      overlayOpacity.value = withTiming(0, { duration: 200, easing: Easing.in(Easing.quad) });
      translateY.value = withTiming(PANEL_HEIGHT, { duration: 280, easing: Easing.in(Easing.cubic) }, () => {
        runOnJS(setShouldRender)(false);
      });
    }
  }, [isOpen]);

  const overlayStyle = useAnimatedStyle(() => ({
    opacity: overlayOpacity.value,
  }));

  const panelStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  if (!shouldRender) return null;

  return (
    <>
      {/* Overlay */}
      <Animated.View 
        style={[
          { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }, 
          overlayStyle
        ]}
        pointerEvents={isOpen ? 'auto' : 'none'}
      >
        <Pressable onPress={onClose} className="flex-1 bg-black/60" />
      </Animated.View>

      {/* Panel */}
      <Animated.View
        style={[
          {
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            height: PANEL_HEIGHT,
            backgroundColor: '#111827',
            borderTopLeftRadius: 24,
            borderTopRightRadius: 24,
            borderTopWidth: 1,
            borderTopColor: '#374151',
          },
          panelStyle,
        ]}
      >
        {/* Handle */}
        <Pressable onPress={onClose} className="items-center pt-3 pb-2">
          <View className="w-12 h-1.5 bg-gray-600 rounded-full" />
        </Pressable>

        {/* Header del panel */}
        <View className="flex-row items-center justify-between px-6 pb-3">
          <View className="flex-1">
            {selectedMuscles.length === 1 ? (
              <View className="flex-row items-center">
                <View style={{ backgroundColor: MUSCLE_COLORS[selectedMuscles[0]] }} className="w-4 h-4 rounded-full mr-3" />
                <Text className="text-white text-xl font-bold">{exercisesData[selectedMuscles[0]]?.name}</Text>
              </View>
            ) : (
              <View>
                <Text className="text-white text-xl font-bold">{selectedMuscles.length} músculos</Text>
                <Text className="text-gray-400 text-sm">{selectedMuscles.map(m => exercisesData[m]?.name).join(' • ')}</Text>
              </View>
            )}
          </View>
          <View className="flex-row items-center mr-3">
            <View className="items-center mr-4">
              <Text className="text-white font-bold">{totalStats.totalExercises}</Text>
              <Text className="text-gray-500 text-xs">ejercicios</Text>
            </View>
            <View className="items-center">
              <Text className="text-orange-400 font-bold">{totalStats.totalCalories}</Text>
              <Text className="text-gray-500 text-xs">kcal</Text>
            </View>
          </View>
          <TouchableOpacity onPress={onClose} className="w-9 h-9 bg-gray-800 rounded-full items-center justify-center border border-gray-700">
            <X size={18} color="#9ca3af" />
          </TouchableOpacity>
        </View>

        {/* Lista de ejercicios */}
        <ScrollView className="px-6 flex-1" contentContainerStyle={{ paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
          {combinedExercises.map((exercise, index) => (
            <ExerciseCard
              key={`${exercise.muscle}-${exercise.name}`}
              exercise={exercise}
              color={exercise.color}
              index={index}
              muscleName={selectedMuscles.length > 1 ? exercise.muscleName : null}
              onPress={() => onExercisePress(exercise, exercise.color, exercise.muscleName)}
            />
          ))}
        </ScrollView>
      </Animated.View>
    </>
  );
});

ExercisePanel.displayName = 'ExercisePanel';

export default function GymScreen({ navigation }) {
  const [selectedMuscles, setSelectedMuscles] = useState([]);
  const [isFrontView, setIsFrontView] = useState(true);
  const [isMultiSelectMode, setIsMultiSelectMode] = useState(false);
  const [isPanelOpen, setIsPanelOpen] = useState(false);

  // Animación del cuerpo - más suave
  const bodyOpacity = useSharedValue(0);
  const bodyScale = useSharedValue(0.95);
  const bodyTranslateY = useSharedValue(20);

  useEffect(() => {
    // Animación de entrada suave
    bodyOpacity.value = withTiming(1, { duration: 500, easing: Easing.out(Easing.quad) });
    bodyScale.value = withTiming(1, { duration: 600, easing: Easing.out(Easing.cubic) });
    bodyTranslateY.value = withTiming(0, { duration: 500, easing: Easing.out(Easing.cubic) });
  }, []);

  const bodyAnimatedStyle = useAnimatedStyle(() => ({
    opacity: bodyOpacity.value,
    transform: [
      { scale: bodyScale.value },
      { translateY: bodyTranslateY.value },
    ],
  }));

  // Animación para cambio de vista - más suave
  const handleToggleView = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    
    // Fade out suave
    bodyOpacity.value = withTiming(0.3, { duration: 150, easing: Easing.out(Easing.quad) });
    bodyScale.value = withTiming(0.98, { duration: 150, easing: Easing.out(Easing.quad) });
    
    setTimeout(() => {
      setIsFrontView(prev => !prev);
      // Fade in suave
      bodyOpacity.value = withTiming(1, { duration: 300, easing: Easing.out(Easing.quad) });
      bodyScale.value = withTiming(1, { duration: 300, easing: Easing.out(Easing.cubic) });
    }, 150);
  }, []);

  const selectedMuscle = selectedMuscles.length > 0 ? selectedMuscles[selectedMuscles.length - 1] : null;

  const handleSelectMuscle = useCallback((muscle) => {
    if (isMultiSelectMode) {
      setSelectedMuscles(prev => prev.includes(muscle) ? prev.filter(m => m !== muscle) : [...prev, muscle]);
    } else {
      setSelectedMuscles([muscle]);
      setIsPanelOpen(true);
    }
  }, [isMultiSelectMode]);

  const handleRemoveMuscle = useCallback((muscle) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedMuscles(prev => prev.filter(m => m !== muscle));
  }, []);

  const handleOpenPanel = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setIsPanelOpen(true);
  }, []);

  const handleClosePanel = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setIsPanelOpen(false);
    if (!isMultiSelectMode) {
      setTimeout(() => setSelectedMuscles([]), 200);
    }
  }, [isMultiSelectMode]);

  const handleClearSelection = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedMuscles([]);
    setIsPanelOpen(false);
  }, []);

  const toggleMultiSelect = useCallback((value) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setIsMultiSelectMode(value);
    setIsPanelOpen(false);
    if (!value && selectedMuscles.length > 1) setSelectedMuscles(prev => [prev[prev.length - 1]]);
  }, [selectedMuscles.length]);

  const handleExercisePress = useCallback((exercise, color, muscleName) => {
    setIsPanelOpen(false);
    setTimeout(() => {
      navigation.navigate('ExerciseDetail', { exercise, color, muscleName });
    }, 200);
  }, [navigation]);

  const combinedExercises = useMemo(() => {
    const exercises = [];
    selectedMuscles.forEach(muscle => {
      const muscleData = exercisesData[muscle];
      if (muscleData) {
        muscleData.exercises.forEach(exercise => {
          exercises.push({ ...exercise, muscle, muscleName: muscleData.name, color: MUSCLE_COLORS[muscle] });
        });
      }
    });
    return exercises;
  }, [selectedMuscles]);

  const totalStats = useMemo(() => ({
    totalCalories: combinedExercises.reduce((acc, ex) => acc + ex.calories, 0),
    totalExercises: combinedExercises.length,
  }), [combinedExercises]);

  return (
    <View className="flex-1 bg-black">
      <StatusBar style="light" />
      <SafeAreaView className="flex-1">
        {/* Header */}
        <Animated.View 
          entering={FadeInDown.duration(400).easing(Easing.out(Easing.quad))}
          className="flex-row items-center justify-between px-6 pt-2 pb-3"
        >
          <View className="flex-1">
            <Text className="text-white text-2xl font-bold">Entrenamiento</Text>
            <Text className="text-gray-400 text-sm mt-0.5">
              {isMultiSelectMode ? 'Selecciona varios músculos' : 'Toca un músculo para ver ejercicios'}
            </Text>
          </View>
          <View className="flex-row items-center gap-2">
            <HeaderIconButton onPress={handleToggleView} icon={RotateCcw} />
            <HeaderIconButton onPress={() => {}} icon={ClipboardList} />
            <HeaderIconButton onPress={() => {}} icon={Plus} isActive />
          </View>
        </Animated.View>

        {/* Switch modo múltiple */}
        <Animated.View 
          entering={FadeInDown.delay(50).duration(400).easing(Easing.out(Easing.quad))}
          className="flex-row items-center justify-between px-6 py-2"
        >
          <View className="flex-row items-center">
            {isMultiSelectMode ? <Layers size={18} color="#3b82f6" /> : <MousePointer size={18} color="#9ca3af" />}
            <Text className={`ml-2 text-sm font-medium ${isMultiSelectMode ? 'text-blue-400' : 'text-gray-400'}`}>
              Selección múltiple
            </Text>
          </View>
          <Switch
            value={isMultiSelectMode}
            onValueChange={toggleMultiSelect}
            trackColor={{ false: '#374151', true: '#1d4ed8' }}
            thumbColor={isMultiSelectMode ? '#3b82f6' : '#9ca3af'}
          />
        </Animated.View>

        {/* Chips de músculos */}
        {isMultiSelectMode && selectedMuscles.length > 0 && (
          <Animated.View entering={FadeInDown.duration(300)} className="px-6 pb-2">
            <View className="flex-row items-center justify-between mb-2">
              <Text className="text-gray-400 text-xs">
                {selectedMuscles.length} músculo{selectedMuscles.length > 1 ? 's' : ''} seleccionado{selectedMuscles.length > 1 ? 's' : ''}
              </Text>
              <TouchableOpacity onPress={handleClearSelection}>
                <Text className="text-red-400 text-xs font-medium">Limpiar</Text>
              </TouchableOpacity>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View className="flex-row">
                {selectedMuscles.map(muscle => <MuscleChip key={muscle} muscle={muscle} onRemove={() => handleRemoveMuscle(muscle)} />)}
              </View>
            </ScrollView>
          </Animated.View>
        )}

        {/* Indicador de vista */}
        <Animated.View entering={FadeInDown.delay(100).duration(400)} className="items-center pb-2">
          <View className="bg-gray-800/50 px-3 py-1 rounded-full">
            <Text className="text-gray-400 text-xs font-medium">{isFrontView ? 'Vista frontal' : 'Vista trasera'}</Text>
          </View>
        </Animated.View>

        {/* Cuerpo Humano */}
        <Animated.View style={bodyAnimatedStyle} className="items-center justify-center flex-1 mb-20">
          <HumanBody
            onSelectMuscle={handleSelectMuscle}
            selectedMuscle={selectedMuscle}
            selectedMuscles={selectedMuscles}
            isFrontView={isFrontView}
          />
        </Animated.View>

        {/* Botón flotante */}
        {isMultiSelectMode && selectedMuscles.length > 0 && !isPanelOpen && (
          <Animated.View 
            entering={FadeInDown.duration(300).easing(Easing.out(Easing.quad))}
            exiting={FadeOut.duration(200)}
            className="absolute bottom-28 left-6 right-6"
          >
            <TouchableOpacity
              onPress={handleOpenPanel}
              activeOpacity={0.9}
              className="bg-blue-600 py-4 rounded-2xl flex-row items-center justify-center"
              style={{ shadowColor: '#3b82f6', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 8 }}
            >
              <Eye size={20} color="white" />
              <Text className="text-white font-bold text-base ml-2">Ver {totalStats.totalExercises} ejercicios</Text>
            </TouchableOpacity>
          </Animated.View>
        )}
      </SafeAreaView>

      {/* Panel de ejercicios */}
      <ExercisePanel
        isOpen={isPanelOpen}
        onClose={handleClosePanel}
        selectedMuscles={selectedMuscles}
        combinedExercises={combinedExercises}
        totalStats={totalStats}
        onExercisePress={handleExercisePress}
      />
    </View>
  );
}