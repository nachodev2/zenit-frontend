import React, { useRef } from 'react';
import { View, Text, ScrollView, Dimensions, Vibration, Platform } from 'react-native';

const { width } = Dimensions.get('window');

// --- REGLA HORIZONTAL (PESO) ---
export const HorizontalRuler = ({ min, max, value, onChange, unit }) => {
  const stepSize = 10; // Espacio entre líneas en píxeles
  const subSegments = 10; // Divisiones entre enteros (para decimales)
  
  // Generamos más líneas para simular precisión
  const totalSteps = (max - min) * subSegments; 
  
  const handleScroll = (event) => {
    const offsetX = event.nativeEvent.contentOffset.x;
    // Fórmula ajustada: Menos recorrido para cambiar el valor
    const rawValue = min + (offsetX / stepSize) / subSegments * 2; // *2 Acelera el cambio
    
    // Redondear a 1 decimal
    const roundedValue = Math.round(rawValue * 10) / 10;

    if (roundedValue >= min && roundedValue <= max && roundedValue !== value) {
        onChange(roundedValue);
    }
  };

  return (
    <View className="items-center justify-center">
      <Text className="text-6xl font-black text-zenitBlack mb-4">
        {value.toFixed(1)} <Text className="text-xl text-zenitTextMuted font-medium">{unit}</Text>
      </Text>
      
      <View className="h-24 w-full relative">
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          snapToInterval={stepSize} 
          decelerationRate="fast"
          scrollEventThrottle={16} // 16ms = 60fps updates
          onScroll={handleScroll}
          contentContainerStyle={{ paddingHorizontal: width / 2 }}
        >
          {Array.from({ length: totalSteps + 1 }).map((_, i) => {
            const isMajor = i % 10 === 0; // Cada entero
            const isMedium = i % 5 === 0 && !isMajor; // .5
            
            return (
              <View key={i} className={`justify-end items-center w-[10px]`}> 
                <View className={`rounded-full ${
                    isMajor ? 'h-12 w-[3px] bg-zenitBlack' : 
                    isMedium ? 'h-8 w-[2px] bg-gray-400' :
                    'h-5 w-[1px] bg-gray-300'
                }`} />
              </View>
            );
          })}
        </ScrollView>
        
        {/* Indicador Fijo */}
        <View className="absolute bottom-0 left-0 right-0 items-center pointer-events-none pb-2">
            <View className="w-[4px] h-16 bg-zenitRed rounded-full shadow-sm shadow-red-500" />
        </View>
      </View>
    </View>
  );
};

// --- REGLA VERTICAL (ALTURA) ---
export const VerticalRuler = ({ min, max, value, onChange, unit }) => {
  const stepSize = 10;
  const range = max - min;
  
  const handleScroll = (event) => {
    const offsetY = event.nativeEvent.contentOffset.y;
    
    // LÓGICA INVERTIDA: 
    // Scroll hacia ABAJO (offset positivo) -> AUMENTA valor visualmente (si la regla baja, ves números más altos arriba)
    // Pero para que se sienta natural como "subir estatura", invertimos:
    // Si deslizo el dedo hacia abajo, quiero "bajar" la regla para ver los números de arriba (más altos).
    
    const rawValue = min + (offsetY / stepSize);
    const roundedValue = Math.round(rawValue);

    if (roundedValue >= min && roundedValue <= max && roundedValue !== value) {
        onChange(roundedValue);
    }
  };

  return (
    <View className="flex-row items-center h-96">
      {/* Columna de la Regla */}
      <View className="h-full w-24 overflow-hidden relative border-r border-gray-100">
        <ScrollView
            showsVerticalScrollIndicator={false}
            snapToInterval={stepSize}
            decelerationRate="fast"
            scrollEventThrottle={16}
            onScroll={handleScroll}
            contentContainerStyle={{ paddingVertical: 180 }}
        >
            {Array.from({ length: range + 1 }).map((_, i) => {
                const val = min + i; 
                const isMajor = val % 10 === 0;
                
                return (
                    <View key={i} className="flex-row items-center justify-end h-[10px] w-full pr-4">
                         {isMajor && <Text className="mr-2 text-xs text-zenitBlack font-bold">{val}</Text>}
                        <View className={`bg-gray-300 rounded-l-full ${isMajor ? 'w-8 h-[2px] bg-zenitBlack' : 'w-4 h-[1px]'}`} />
                    </View>
                );
            })}
        </ScrollView>
        
        {/* Indicador Fijo */}
        <View className="absolute top-[50%] right-0 w-full flex-row justify-end items-center pointer-events-none mt-[-1px]">
             <View className="w-12 h-[3px] bg-zenitRed rounded-l-full shadow-sm shadow-red-500" />
        </View>
      </View>

      {/* Texto Grande */}
      <View className="ml-8 justify-center h-full">
         <Text className="text-7xl font-black text-zenitBlack">
            {value} 
         </Text>
         <Text className="text-2xl text-zenitTextMuted font-medium">{unit}</Text>
      </View>
    </View>
  );
};