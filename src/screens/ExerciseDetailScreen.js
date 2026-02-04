import React, { useState, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MotiView } from 'moti';
import { 
  ArrowLeft, 
  Dumbbell, 
  Clock, 
  Flame, 
  Target, 
  TrendingUp,
  CheckCircle2,
  Play,
  Plus,
  Info
} from 'lucide-react-native';
import { StatusBar } from 'expo-status-bar';
import * as Haptics from 'expo-haptics';

// Datos de ejercicios
const exerciseDetails = {
  'Press de banca': {
    description: 'Ejercicio compuesto que trabaja principalmente el pecho, con apoyo de hombros y tríceps.',
    muscles: {
      primary: ['Pectoral mayor'],
      secondary: ['Deltoides anterior', 'Tríceps'],
    },
    difficulty: 'Intermedio',
    equipment: ['Barra', 'Banco plano'],
    instructions: [
      'Acuéstate en el banco con los pies firmes en el suelo',
      'Agarra la barra con agarre ligeramente más ancho que los hombros',
      'Baja la barra controladamente hasta tocar el pecho',
      'Empuja hacia arriba extendiendo los brazos',
      'Mantén los omóplatos retraídos durante el movimiento',
    ],
    tips: [
      'No rebotes la barra en el pecho',
      'Mantén la espalda baja ligeramente arqueada',
      'Exhala al empujar, inhala al bajar',
    ],
  },
  'Sentadillas': {
    description: 'El rey de los ejercicios de pierna. Trabaja cuádriceps, glúteos e isquiotibiales.',
    muscles: {
      primary: ['Cuádriceps', 'Glúteos'],
      secondary: ['Isquiotibiales', 'Core'],
    },
    difficulty: 'Intermedio',
    equipment: ['Barra', 'Rack'],
    instructions: [
      'Coloca la barra en la parte alta de la espalda',
      'Separa los pies al ancho de los hombros',
      'Baja flexionando rodillas y cadera',
      'Mantén el pecho arriba y espalda recta',
      'Empuja a través de los talones para subir',
    ],
    tips: [
      'Rodillas siguen la dirección de los pies',
      'No dejes que las rodillas colapsen',
      'Mantén el core apretado',
    ],
  },
  'default': {
    description: 'Ejercicio efectivo para el desarrollo muscular. Mantén una técnica correcta.',
    muscles: {
      primary: ['Músculo objetivo'],
      secondary: ['Músculos de soporte'],
    },
    difficulty: 'Intermedio',
    equipment: ['Equipamiento estándar'],
    instructions: [
      'Prepara tu posición inicial',
      'Realiza el movimiento de forma controlada',
      'Mantén tensión en el músculo objetivo',
      'Completa el rango de movimiento',
      'Regresa con control',
    ],
    tips: [
      'Prioriza técnica sobre peso',
      'Respira correctamente',
      'Descansa entre series',
    ],
  },
};

// Componente de sección compacto
const Section = ({ title, icon: Icon, iconColor, children, delay = 0 }) => (
  <MotiView
    from={{ opacity: 0, translateY: 15 }}
    animate={{ opacity: 1, translateY: 0 }}
    transition={{ type: 'timing', duration: 400, delay }}
    className="mb-4"
  >
    <View className="flex-row items-center mb-2">
      <View 
        className="w-8 h-8 rounded-md items-center justify-center mr-2"
        style={{ backgroundColor: `${iconColor}20` }}
      >
        <Icon size={18} color={iconColor} />
      </View>
      <Text className="text-white text-2xl font-semibold">{title}</Text>
    </View>
    {children}
  </MotiView>
);

// Chip compacto
const Chip = ({ label, color }) => (
  <View 
    className="px-2.5 py-1 rounded-full mr-1.5 mb-1.5"
    style={{ backgroundColor: `${color}20`, borderWidth: 1, borderColor: `${color}30` }}
  >
    <Text style={{ color }} className="text-xs font-medium">{label}</Text>
  </View>
);

// Paso de instrucción compacto
const InstructionStep = ({ number, text, delay }) => (
  <MotiView
    from={{ opacity: 0, translateX: -10 }}
    animate={{ opacity: 1, translateX: 0 }}
    transition={{ type: 'timing', duration: 300, delay }}
    className="flex-row mb-2"
  >
    <View className="w-5 h-5 rounded-full bg-blue-600 items-center justify-center mr-2 mt-0.5">
      <Text className="text-white text-xs font-bold">{number}</Text>
    </View>
    <Text className="text-gray-300 text-md flex-1 leading-6">{text}</Text>
  </MotiView>
);

// Tip compacto
const TipItem = ({ text, delay }) => (
  <MotiView
    from={{ opacity: 0, translateX: -10 }}
    animate={{ opacity: 1, translateX: 0 }}
    transition={{ type: 'timing', duration: 300, delay }}
    className="flex-row items-start mb-1.5"
  >
    <CheckCircle2 size={14} color="#22c55e" style={{ marginTop: 1, marginRight: 8 }} />
    <Text className="text-gray-300 text-md flex-1">{text}</Text>
  </MotiView>
);

export default function ExerciseDetailScreen({ route, navigation }) {
  const { exercise, color, muscleName } = route.params;
  const [isAddingToRoutine, setIsAddingToRoutine] = useState(false);

  const details = exerciseDetails[exercise.name] || exerciseDetails['default'];

  const handleGoBack = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    navigation.goBack();
  }, [navigation]);

  const handleAddToRoutine = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setIsAddingToRoutine(true);
    setTimeout(() => setIsAddingToRoutine(false), 1000);
  }, []);

  const handleStartExercise = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    console.log('Iniciar ejercicio:', exercise.name);
  }, [exercise.name]);

  return (
    <View className="flex-1 bg-black">
      <StatusBar style="light" />
      
      {/* Header compacto */}
      <View 
        className="px-5 pb-4 pt-4"
        style={{ backgroundColor: color + '50' }}
      >
        <SafeAreaView edges={['top']}>
          {/* Botón volver */}
          <TouchableOpacity
            onPress={handleGoBack}
            className="w-9 h-9 bg-black/30 rounded-full items-center justify-center mb-3"
            activeOpacity={0.7}
          >
            <ArrowLeft size={20} color="white" />
          </TouchableOpacity>

          <MotiView
            from={{ opacity: 0, translateY: 10 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ type: 'timing', duration: 400 }}
          >
            {/* Badge del músculo */}
            <View 
              className="self-start px-2.5 py-0.5 rounded-full mb-2"
              style={{ backgroundColor: color }}
            >
              <Text className="text-white text-md font-semibold">{muscleName}</Text>
            </View>

            {/* Nombre del ejercicio */}
            <Text className="text-white text-3xl font-bold mb-1.5">{exercise.name}</Text>

            {/* Stats rápidos */}
            <View className="flex-row items-center">
              <View className="flex-row items-center mr-3">
                <Dumbbell size={14} color="#9ca3af" />
                <Text className="text-gray-400 text-md ml-1">{exercise.sets}</Text>
              </View>
              <View className="flex-row items-center mr-3">
                <Clock size={14} color="#9ca3af" />
                <Text className="text-gray-400 text-md ml-1">{exercise.time}</Text>
              </View>
              <View className="flex-row items-center">
                <Flame size={14} color="#f97316" />
                <Text className="text-orange-400 text-md ml-1">{exercise.calories} kcal</Text>
              </View>
            </View>
          </MotiView>
        </SafeAreaView>
      </View>

      {/* Contenido scrolleable */}
      <ScrollView 
        className="flex-1 px-5"
        contentContainerStyle={{ paddingTop: 16, paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Descripción */}
        <Section title="Descripción" icon={Info} iconColor="#60a5fa" delay={50}>
          <Text className="text-gray-400 text-md leading-6">
            {details.description}
          </Text>
        </Section>

        {/* Músculos trabajados */}
        <Section title="Músculos trabajados" icon={Target} iconColor={color} delay={100}>
          <View className="flex-row flex-wrap items-center">
            <Text className="text-gray-500 text-md mr-2 mb-1.5">Principales:</Text>
            {details.muscles.primary.map((muscle, index) => (
              <Chip key={index} label={muscle} color={color} />
            ))}
          </View>
          <View className="flex-row flex-wrap items-center mt-1">
            <Text className="text-gray-500 text-md mr-2 mb-1.5">Secundarios:</Text>
            {details.muscles.secondary.map((muscle, index) => (
              <Chip key={index} label={muscle} color="#6b7280" />
            ))}
          </View>
        </Section>

        {/* Detalles */}
        <Section title="Detalles" icon={TrendingUp} iconColor="#a855f7" delay={150}>
          <View className="bg-gray-800/40 rounded-xl p-3 border border-gray-700/50">
            <View className="flex-row justify-between items-center mb-2">
              <Text className="text-gray-400 text-md">Dificultad</Text>
              <View className="flex-row items-center">
                <View 
                  className="w-2 h-2 rounded-full mr-1.5"
                  style={{ 
                    backgroundColor: details.difficulty === 'Principiante' ? '#22c55e' : 
                                    details.difficulty === 'Intermedio' ? '#eab308' : '#ef4444'
                  }}
                />
                <Text className="text-white text-md font-medium">{details.difficulty}</Text>
              </View>
            </View>
            <View className="h-px bg-gray-700/50 my-2" />
            <View className="flex-row items-center">
              <Text className="text-gray-400 text-md mr-2">Equipo:</Text>
              <View className="flex-row flex-wrap flex-1">
                {details.equipment.map((item, index) => (
                  <View key={index} className="bg-gray-700/50 px-2 py-0.5 rounded mr-1.5 mb-1">
                    <Text className="text-gray-300 text-md">{item}</Text>
                  </View>
                ))}
              </View>
            </View>
          </View>
        </Section>

        {/* Instrucciones */}
        <Section title="Cómo realizarlo" icon={Play} iconColor="#22c55e" delay={200}>
          <View className="bg-gray-800/30 rounded-xl p-3 border border-gray-700/30">
            {details.instructions.map((instruction, index) => (
              <InstructionStep 
                key={index} 
                number={index + 1} 
                text={instruction}
                delay={220 + (index * 30)}
              />
            ))}
          </View>
        </Section>

        {/* Tips */}
        <Section title="Consejos" icon={CheckCircle2} iconColor="#22c55e" delay={300}>
          <View className="bg-green-900/15 rounded-xl p-3 border border-green-800/20">
            {details.tips.map((tip, index) => (
              <TipItem 
                key={index} 
                text={tip}
                delay={320 + (index * 30)}
              />
            ))}
          </View>
        </Section>
      </ScrollView>

      {/* Botones de acción */}
      <View className="absolute bottom-0 left-0 right-0 px-5 pb-6 pt-4 bg-black/95 border-t border-gray-800/50">
        <View className="flex-row gap-3">
          <TouchableOpacity
            onPress={handleAddToRoutine}
            activeOpacity={0.8}
            className="flex-1 bg-gray-800 py-3.5 rounded-xl flex-row items-center justify-center border border-gray-700"
          >
            <Plus size={18} color="#9ca3af" />
            <Text className="text-gray-300 font-semibold text-sm ml-1.5">
              {isAddingToRoutine ? 'Agregando...' : 'Agregar a rutina'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={handleStartExercise}
            activeOpacity={0.9}
            className="flex-1 py-3.5 rounded-xl flex-row items-center justify-center"
            style={{ backgroundColor: color }}
          >
            <Play size={18} color="white" fill="white" />
            <Text className="text-white font-bold text-sm ml-1.5">Iniciar</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}