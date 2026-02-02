import React, { useEffect, useState } from 'react';
import { View, Text, ActivityIndicator } from 'react-native';
import { Check, Cpu } from 'lucide-react-native';

const STEPS = [
  "Analizando biometría basal...",
  "Calculando gasto energético (TMB)...",
  "Ajustando déficit calórico agresivo...",
  "Optimizando distribución de macros...",
  "Generando Plan Zenit v1.0..."
];

export default function ProcessingScreen({ onFinish }) {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    // Simular carga de barra de progreso
    const progressInterval = setInterval(() => {
      setProgress(old => {
        if (old >= 100) {
          clearInterval(progressInterval);
          return 100;
        }
        return old + 1; // Velocidad de carga
      });
    }, 50);

    // Simular pasos de "Hackeo/Cálculo"
    const stepInterval = setInterval(() => {
      setCurrentStepIndex(prev => {
        if (prev < STEPS.length - 1) return prev + 1;
        return prev;
      });
    }, 1200); // Cambia de texto cada 1.2 segundos

    // Finalizar todo
    const totalTimeout = setTimeout(() => {
      onFinish();
    }, 6000); // 6 segundos totales de drama

    return () => {
      clearInterval(progressInterval);
      clearInterval(stepInterval);
      clearTimeout(totalTimeout);
    };
  }, []);

  return (
    <View className="flex-1 bg-zenitWhite justify-center px-8">
      {/* Icono Central Pulsante */}
      <View className="items-center mb-12">
        <View className="w-24 h-24 bg-zenitRed/20 rounded-full items-center justify-center animate-pulse">
          <Cpu size={48} color="#DC2626" />
        </View>
        <Text className="text-white text-4xl font-black mt-6 text-center">
          {progress}%
        </Text>
        <Text className="text-zenitTextMuted text-sm font-medium tracking-widest uppercase mt-2">
          Sincronizando Sistema
        </Text>
      </View>

      {/* Lista de Checklists */}
      <View className="space-y-4">
        {STEPS.map((step, index) => {
          const isActive = index === currentStepIndex;
          const isDone = index < currentStepIndex;
          
          return (
            <View key={index} className="flex-row items-center space-x-4 h-8">
              <View className="w-6 items-center">
                {isDone ? (
                  <Check size={20} color="#DC2626" />
                ) : isActive ? (
                  <ActivityIndicator size="small" color="#DC2626" />
                ) : (
                  <View className="w-2 h-2 rounded-full bg-white" />
                )}
              </View>
              <Text className={`text-base font-medium ${isDone ? 'text-zenitRed' : isActive ? 'text-zenitBlack' : 'text-gray-600'}`}>
                {step}
              </Text>
            </View>
          );
        })}
      </View>
      <View className="absolute bottom-12 left-8 right-8">
        <View className="h-2 bg-gray-800 rounded-full overflow-hidden">
          <View 
            className="h-full bg-zenitRed" 
            style={{ width: `${progress}%` }} 
          />
        </View>
      </View>
    </View>
  );
}