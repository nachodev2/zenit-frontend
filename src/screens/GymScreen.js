import React, { useState, useCallback, memo, useMemo } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Pressable, Switch } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MotiView, AnimatePresence } from 'moti';
import { X, Dumbbell, Clock, Flame, ChevronRight, RotateCcw, Plus, ClipboardList, Layers, MousePointer, Eye } from 'lucide-react-native';
import { StatusBar } from 'expo-status-bar';
import * as Haptics from 'expo-haptics';
import { useNavigation } from '@react-navigation/native';

import HumanBody, { MUSCLE_COLORS } from '../components/bodyHuman';

// Datos de ejercicios por grupo muscular
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

// Componente de tarjeta de ejercicio
const ExerciseCard = memo(({ exercise, color, index, muscleName, onPress }) => (
  <MotiView
    from={{ opacity: 0, translateX: -20 }}
    animate={{ opacity: 1, translateX: 0 }}
    transition={{ type: 'timing', duration: 400, delay: index * 50 }}
  >
    <TouchableOpacity 
      activeOpacity={0.7}
      className="bg-gray-800/50 border border-gray-700 rounded-2xl p-4 mb-3 flex-row items-center"
      onPress={() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        onPress();
      }}
    >
      <View 
        style={{ backgroundColor: `${color}20` }}
        className="w-12 h-12 rounded-xl items-center justify-center"
      >
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
  </MotiView>
));

ExerciseCard.displayName = 'ExerciseCard';

// Chip de músculo seleccionado
const MuscleChip = memo(({ muscle, onRemove }) => (
  <MotiView
    from={{ opacity: 0, scale: 0.8 }}
    animate={{ opacity: 1, scale: 1 }}
    exit={{ opacity: 0, scale: 0.8 }}
    transition={{ type: 'timing', duration: 200 }}
  >
    <TouchableOpacity
      onPress={onRemove}
      activeOpacity={0.7}
      className="flex-row items-center px-3 py-1.5 rounded-full mr-2"
      style={{ backgroundColor: MUSCLE_COLORS[muscle] }}
    >
      <Text className="text-white text-sm font-medium mr-1">
        {exercisesData[muscle]?.name}
      </Text>
      <X size={14} color="white" />
    </TouchableOpacity>
  </MotiView>
));

MuscleChip.displayName = 'MuscleChip';

// Botón de ícono para el header
const HeaderIconButton = memo(({ onPress, icon: Icon, isActive = false }) => (
  <TouchableOpacity
    onPress={onPress}
    activeOpacity={0.7}
    className={`w-10 h-10 rounded-xl items-center justify-center ${
      isActive ? 'bg-blue-600' : 'bg-gray-800 border border-gray-700'
    }`}
  >
    <Icon size={20} color={isActive ? 'white' : '#9ca3af'} />
  </TouchableOpacity>
));

HeaderIconButton.displayName = 'HeaderIconButton';

export default function GymScreen() {
  const [selectedMuscles, setSelectedMuscles] = useState([]);
  const [isFrontView, setIsFrontView] = useState(true);
  const [isMultiSelectMode, setIsMultiSelectMode] = useState(false);
  const [isPanelOpen, setIsPanelOpen] = useState(false); // Controla si el panel está abierto
  const navigation = useNavigation();

  const [isZoomed, setIsZoomed] = useState(false);
  
  const selectedMuscle = selectedMuscles.length > 0 ? selectedMuscles[selectedMuscles.length - 1] : null;

  const handleSelectMuscle = useCallback((muscle) => {
    if (isMultiSelectMode) {
      // Modo múltiple: agregar o quitar, NO abrir panel automáticamente
      setSelectedMuscles(prev => {
        if (prev.includes(muscle)) {
          return prev.filter(m => m !== muscle);
        } else {
          return [...prev, muscle];
        }
      });
    } else {
      // Modo simple: reemplazar y abrir panel
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
    // En modo simple, también limpiamos la selección
    if (!isMultiSelectMode) {
      setSelectedMuscles([]);
    }
  }, [isMultiSelectMode]);

  const handleClearSelection = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedMuscles([]);
    setIsPanelOpen(false);
  }, []);

  const toggleView = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setIsFrontView(prev => !prev);
  }, []);

  const toggleMultiSelect = useCallback((value) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setIsMultiSelectMode(value);
    setIsPanelOpen(false);
    if (!value && selectedMuscles.length > 1) {
      // Al desactivar, mantener solo el último
      setSelectedMuscles(prev => [prev[prev.length - 1]]);
    }
  }, [selectedMuscles.length]);

  const handleAddRoutine = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    console.log('Agregar rutina');
  }, []);

  const handleViewRoutines = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    console.log('Ver rutinas');
  }, []);

  // Función para navegar al detalle 
  const handleExercisePress = useCallback((exercise, color, muscleName) => {
    navigation.navigate('ExerciseDetail', {
      exercise,
      color,
      muscleName,
    });
  }, [navigation]);

  // Combinar ejercicios de todos los músculos seleccionados
  const combinedExercises = useMemo(() => {
    const exercises = [];
    selectedMuscles.forEach(muscle => {
      const muscleData = exercisesData[muscle];
      if (muscleData) {
        muscleData.exercises.forEach(exercise => {
          exercises.push({
            ...exercise,
            muscle,
            muscleName: muscleData.name,
            color: MUSCLE_COLORS[muscle],
          });
        });
      }
    });
    return exercises;
  }, [selectedMuscles]);

  const totalStats = useMemo(() => {
    const totalCalories = combinedExercises.reduce((acc, ex) => acc + ex.calories, 0);
    const totalExercises = combinedExercises.length;
    return { totalCalories, totalExercises };
  }, [combinedExercises]);

  const hasSelection = selectedMuscles.length > 0;

  return (
    <View className="flex-1 bg-black">
      <StatusBar style="light" />
      <SafeAreaView className="flex-1">
        {/* Header */}
        <View className="flex-row items-center justify-between px-6 pt-2 pb-3">
          <View className="flex-1">
            <Text className="text-white text-2xl font-bold">Entrenamiento</Text>
            <Text className="text-gray-400 text-sm mt-0.5">
              {isMultiSelectMode
                ? 'Selecciona varios músculos'
                : 'Toca un músculo para ver ejercicios'}
            </Text>
          </View>

          <View className="flex-row items-center gap-2">
            <HeaderIconButton onPress={toggleView} icon={RotateCcw} />
            <HeaderIconButton
              onPress={handleViewRoutines}
              icon={ClipboardList}
            />
            <HeaderIconButton
              onPress={handleAddRoutine}
              icon={Plus}
              isActive={true}
            />
          </View>
        </View>

        {/* Switch de modo múltiple */}
        <View className="flex-row items-center justify-between px-6 py-2">
          <View className="flex-row items-center">
            {isMultiSelectMode ? (
              <Layers size={18} color="#3b82f6" />
            ) : (
              <MousePointer size={18} color="#9ca3af" />
            )}
            <Text
              className={`ml-2 text-sm font-medium ${isMultiSelectMode ? 'text-blue-400' : 'text-gray-400'}`}
            >
              Selección múltiple
            </Text>
          </View>
          <Switch
            value={isMultiSelectMode}
            onValueChange={toggleMultiSelect}
            trackColor={{ false: '#374151', true: '#1d4ed8' }}
            thumbColor={isMultiSelectMode ? '#3b82f6' : '#9ca3af'}
          />
        </View>

        {/* Chips de músculos seleccionados (modo múltiple) */}
        {isMultiSelectMode && selectedMuscles.length > 0 && (
          <MotiView
            from={{ opacity: 0, translateY: -10 }}
            animate={{ opacity: 1, translateY: 0 }}
            className="px-6 pb-2"
          >
            <View className="flex-row items-center justify-between mb-2">
              <Text className="text-gray-400 text-xs">
                {selectedMuscles.length} músculo
                {selectedMuscles.length > 1 ? 's' : ''} seleccionado
                {selectedMuscles.length > 1 ? 's' : ''}
              </Text>
              <TouchableOpacity onPress={handleClearSelection}>
                <Text className="text-red-400 text-xs font-medium">
                  Limpiar
                </Text>
              </TouchableOpacity>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View className="flex-row">
                <AnimatePresence>
                  {selectedMuscles.map((muscle) => (
                    <MuscleChip
                      key={muscle}
                      muscle={muscle}
                      onRemove={() => handleRemoveMuscle(muscle)}
                    />
                  ))}
                </AnimatePresence>
              </View>
            </ScrollView>
          </MotiView>
        )}

        {/* Indicador de vista actual */}
        <View className="items-center pb-2">
          <View className="bg-gray-800/50 px-3 py-1 rounded-full flex-row items-center">
            <Text className="text-gray-400 text-xs font-medium">
              {isFrontView ? 'Vista frontal' : 'Vista trasera'}
            </Text>
          </View>
        </View>

        {/* Cuerpo Humano */}
        <View className="items-center justify-center flex-1">
          <HumanBody
            onSelectMuscle={handleSelectMuscle}
            selectedMuscle={selectedMuscle}
            selectedMuscles={selectedMuscles}
            isFrontView={isFrontView}
          />
        </View>

        {/* Botón flotante para ver ejercicios (modo múltiple) */}
        {isMultiSelectMode && selectedMuscles.length > 0 && !isPanelOpen && (
          <MotiView
            from={{ opacity: 0, scale: 0.8, translateY: 20 }}
            animate={{ opacity: 1, scale: 1, translateY: 0 }}
            className="absolute bottom-6 left-6 right-6"
          >
            <TouchableOpacity
              onPress={handleOpenPanel}
              activeOpacity={0.9}
              className="bg-blue-600 py-4 rounded-2xl flex-row items-center justify-center"
              style={{
                shadowColor: '#3b82f6',
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.3,
                shadowRadius: 8,
                elevation: 8,
              }}
            >
              <Eye size={20} color="white" />
              <Text className="text-white font-bold text-base ml-2">
                Ver {totalStats.totalExercises} ejercicios
              </Text>
            </TouchableOpacity>
          </MotiView>
        )}

        {/* Hint cuando no hay selección */}
        {/* {!hasSelection && (
          <View className="absolute bottom-8 left-0 right-0 items-center pointer-events-none">
            <MotiView
              from={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 500 }}
            >
              <View className="bg-gray-800/80 px-3 py-1.5 rounded-full border border-gray-600/50 flex-row items-center gap-2">
                {isZoomed ? (
                  <Text className="text-gray-400 text-xs">
                    Doble tap para resetear
                  </Text>
                ) : (
                  <>
                    <View className="flex-row items-center gap-1">
                      <View className="w-1.5 h-1.5 rounded-full bg-gray-400" />
                      <View className="w-1.5 h-1.5 rounded-full bg-gray-400" />
                    </View>
                    <Text className="text-gray-400 text-xs">
                      Pellizca o doble tap
                    </Text>
                  </>
                )}
              </View>
            </MotiView>
          </View>
        )} */}
      </SafeAreaView>

      {/* Overlay + Panel de ejercicios */}
      {isPanelOpen && (
        <>
          {/* Overlay oscuro */}
          <MotiView
            from={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ type: 'timing', duration: 300 }}
            className="absolute inset-0"
          >
            <Pressable
              onPress={handleClosePanel}
              className="flex-1 bg-black/50"
            />
          </MotiView>

          {/* Panel de ejercicios */}
          <MotiView
            from={{ opacity: 0, translateY: 100 }}
            animate={{ opacity: 1, translateY: 0 }}
            exit={{ opacity: 0, translateY: 100 }}
            transition={{ type: 'timing', duration: 400 }}
            className="absolute bottom-0 left-0 right-0 bg-gray-900 rounded-t-3xl border-t border-gray-700"
            style={{ maxHeight: '65%' }}
          >
            {/* Handle */}
            <Pressable
              onPress={handleClosePanel}
              className="items-center pt-3 pb-2"
            >
              <View className="w-12 h-1.5 bg-gray-600 rounded-full" />
            </Pressable>

            {/* Header del panel */}
            <View className="flex-row items-center justify-between px-6 pb-3">
              <View className="flex-1">
                {selectedMuscles.length === 1 ? (
                  <View className="flex-row items-center">
                    <View
                      style={{
                        backgroundColor: MUSCLE_COLORS[selectedMuscles[0]],
                      }}
                      className="w-4 h-4 rounded-full mr-3"
                    />
                    <Text className="text-white text-xl font-bold">
                      {exercisesData[selectedMuscles[0]]?.name}
                    </Text>
                  </View>
                ) : (
                  <View>
                    <Text className="text-white text-xl font-bold">
                      {selectedMuscles.length} músculos
                    </Text>
                    <ScrollView
                      horizontal
                      showsHorizontalScrollIndicator={false}
                    >
                      <Text className="text-gray-400 text-sm">
                        {selectedMuscles
                          .map((m) => exercisesData[m]?.name)
                          .join(' • ')}
                      </Text>
                    </ScrollView>
                  </View>
                )}
              </View>

              {/* Stats */}
              <View className="flex-row items-center mr-3">
                <View className="items-center mr-4">
                  <Text className="text-white font-bold">
                    {totalStats.totalExercises}
                  </Text>
                  <Text className="text-gray-500 text-xs">ejercicios</Text>
                </View>
                <View className="items-center">
                  <Text className="text-orange-400 font-bold">
                    {totalStats.totalCalories}
                  </Text>
                  <Text className="text-gray-500 text-xs">kcal</Text>
                </View>
              </View>

              <TouchableOpacity
                onPress={handleClosePanel}
                className="w-9 h-9 bg-gray-800 rounded-full items-center justify-center border border-gray-700"
                activeOpacity={0.7}
              >
                <X size={18} color="#9ca3af" />
              </TouchableOpacity>
            </View>

            {/* Lista de ejercicios */}
            <ScrollView
              className="px-6"
              contentContainerStyle={{ paddingBottom: 40 }}
              showsVerticalScrollIndicator={false}
            >
              {combinedExercises.map((exercise, index) => (
                <ExerciseCard
                  key={`${exercise.muscle}-${exercise.name}`}
                  exercise={exercise}
                  color={exercise.color}
                  index={index}
                  muscleName={
                    selectedMuscles.length > 1 ? exercise.muscleName : null
                  }
                  onPress={() =>
                    handleExercisePress(
                      exercise,
                      exercise.color,
                      exercise.muscleName,
                    )
                  }
                />
              ))}
            </ScrollView>
          </MotiView>
        </>
      )}
    </View>
  );
}