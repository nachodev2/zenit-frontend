import React, { useCallback, useRef, useEffect, useMemo } from 'react';
import { View, Text, Dimensions, TextInput, StyleSheet } from 'react-native';
import Animated, { 
  useSharedValue, 
  useAnimatedScrollHandler, 
  useAnimatedProps, 
  runOnJS, 
  scrollTo 
} from 'react-native-reanimated';

const { width } = Dimensions.get('window');
const AnimatedTextInput = Animated.createAnimatedComponent(TextInput);

// --- COMPONENTE DE LÍNEA ---
const RulerLine = React.memo(({ isMajor, type }) => {
    if (type === 'vertical') {
        return (
            <View className="flex-row items-center justify-end h-[10px] w-full pr-4">
                {/* Línea visual simple */}
                <View className={`bg-gray-300 rounded-l-full ${isMajor ? 'w-8 h-[2px] bg-zenitBlack' : 'w-4 h-[1px]'}`} />
            </View>
        );
    }
    // Horizontal
    return (
        <View style={{ width: 10, justifyContent: 'flex-end', alignItems: 'center' }}> 
             <View className={`rounded-full ${
                isMajor ? 'h-10 w-[2px] bg-zenitBlack' : 
                'h-5 w-[1px] bg-gray-300'
            }`} />
        </View>
    );
});

// --- REGLA HORIZONTAL (PESO) ---
export const HorizontalRuler = ({ min, max, value, onChange, unit }) => {
  const stepSize = 10;
  const segmentsPerUnit = 5; 
  const totalSteps = (max - min) * segmentsPerUnit;
  
  // Optimizacion: Memoizar array
  const data = useMemo(() => Array.from({ length: totalSteps + 1 }), [totalSteps]);
  
  const scrollX = useSharedValue(0);
  const flatListRef = useRef(null);

  useEffect(() => {
    const initialOffset = (value - min) * segmentsPerUnit * stepSize;
    setTimeout(() => {
        flatListRef.current?.scrollToOffset({ offset: initialOffset, animated: false });
    }, 100);
  }, []);

  // Función para reportar valor a JS (evita repetición)
  const reportValue = (offset) => {
    const rawVal = min + (offset / stepSize) / segmentsPerUnit;
    const rounded = Math.round(rawVal * 10) / 10;
    if (rounded >= min && rounded <= max) {
      onChange(rounded);
    }
  };

  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (event) => {
      scrollX.value = event.contentOffset.x;
      runOnJS(reportValue)(event.contentOffset.x);
    },
    // FIX BUG: Asegurar que al terminar de frenar, se actualice el valor final
    onMomentumEnd: (event) => {
      runOnJS(reportValue)(event.contentOffset.x);
    },
    onScrollEndDrag: (event) => {
      runOnJS(reportValue)(event.contentOffset.x);
    }
  });

  const animatedProps = useAnimatedProps(() => {
    const currentVal = min + (scrollX.value / stepSize) / segmentsPerUnit;
    const safeVal = Math.min(Math.max(currentVal, min), max);
    return {
      text: `${safeVal.toFixed(1)} ${unit}`, 
    };
  });

  const renderItem = useCallback(({ index }) => {
    return <RulerLine isMajor={index % segmentsPerUnit === 0} type="horizontal" />;
  }, []);

  return (
    <View className="items-center justify-center">
      <AnimatedTextInput
        underlineColorAndroid="transparent"
        editable={false}
        value={`${value.toFixed(1)} ${unit}`} 
        animatedProps={animatedProps}
        style={styles.bigNumber}
      />
      
      <View className="h-24 w-full relative">
        <Animated.FlatList
          ref={flatListRef}
          data={data}
          horizontal
          showsHorizontalScrollIndicator={false}
          snapToInterval={stepSize}
          decelerationRate="fast"
          getItemLayout={(data, index) => ({ length: stepSize, offset: stepSize * index, index })}
          
          // --- FIX DE PANTALLA BLANCA (BLANKING) ---
          initialNumToRender={50}     // Renderiza más al inicio
          maxToRenderPerBatch={50}    // Renderiza bloques más grandes
          windowSize={50}             // Mantiene mucho más contenido en memoria (evita blanco al scrollear atrás)
          removeClippedSubviews={true}
          
          onScroll={scrollHandler}
          scrollEventThrottle={16} 
          contentContainerStyle={{ paddingHorizontal: width / 2 }}
          renderItem={renderItem}
          keyExtractor={(_, i) => i.toString()}
        />
        <View className="absolute bottom-0 left-0 right-0 items-center pointer-events-none pb-2">
            <View className="w-[4px] h-14 bg-zenitRed rounded-full shadow-sm shadow-red-500" />
        </View>
      </View>
    </View>
  );
};

// --- REGLA VERTICAL (ALTURA) ---
export const VerticalRuler = ({ min, max, value, onChange, unit }) => {
  const stepSize = 10;
  const range = max - min;
  
  // FIX BLANKING: Usamos un array simple para mapear un ScrollView normal.
  // Al ser pocos items (80-100), es más rápido renderizar todo de una vez que virtualizar.
  const data = useMemo(() => Array.from({ length: range + 1 }), [range]);
  
  const scrollY = useSharedValue(0);
  const scrollViewRef = useRef(null);

  useEffect(() => {
    // FIX INVERTIDO: Ahora Offset 0 es el Mínimo.
    // Posición inicial: (Valor actual - Mínimo) * paso
    const initialOffset = (value - min) * stepSize;
    setTimeout(() => {
        scrollViewRef.current?.scrollTo({ y: initialOffset, animated: false });
    }, 100);
  }, []);

  const reportValue = (offset) => {
    // FIX INVERTIDO:
    // Offset 0 (Arriba) = Min.
    // Offset Max (Abajo) = Max.
    // Deslizar dedo Arriba (Push Up) -> Offset Aumenta -> Valor Aumenta.
    const rawVal = min + (offset / stepSize);
    const rounded = Math.round(rawVal);
    
    if (rounded >= min && rounded <= max) {
      onChange(rounded);
    }
  };

  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (event) => {
      scrollY.value = event.contentOffset.y;
      runOnJS(reportValue)(event.contentOffset.y);
    },
    // FIX BUG STUCK NUMBER:
    onMomentumEnd: (event) => {
      runOnJS(reportValue)(event.contentOffset.y);
    },
    onScrollEndDrag: (event) => {
      runOnJS(reportValue)(event.contentOffset.y);
    }
  });

  const animatedProps = useAnimatedProps(() => {
    const currentVal = min + (scrollY.value / stepSize);
    const safeVal = Math.min(Math.max(currentVal, min), max);
    return {
      text: `${Math.round(safeVal)}`, 
    };
  });

  return (
    <View className="flex-row items-center h-80">
      <View className="h-full w-24 overflow-hidden relative border-r border-gray-100">
        
        {/* Cambiamos FlatList por Animated.ScrollView para eliminar parpadeo blanco */}
        <Animated.ScrollView
            ref={scrollViewRef}
            showsVerticalScrollIndicator={false}
            snapToInterval={stepSize}
            decelerationRate="fast"
            onScroll={scrollHandler}
            scrollEventThrottle={16}
            contentContainerStyle={{ paddingVertical: 180 }}
        >
            {data.map((_, i) => (
                <RulerLine key={i} isMajor={i % 10 === 0} type="vertical" />
            ))}
        </Animated.ScrollView>

        <View className="absolute top-[50%] right-0 w-full flex-row justify-end items-center pointer-events-none mt-[-1px]">
             <View className="w-12 h-[3px] bg-zenitRed rounded-l-full shadow-sm shadow-red-500" />
        </View>
      </View>

      <View className="ml-8 justify-center h-full">
         <AnimatedTextInput
            underlineColorAndroid="transparent"
            editable={false}
            value={`${value}`} 
            animatedProps={animatedProps}
            style={styles.bigNumberVertical}
         />
         <Text className="text-2xl text-zenitTextMuted font-medium">{unit}</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
    bigNumber: {
        fontSize: 60, 
        fontFamily: 'System',
        fontWeight: '900', 
        color: '#0A0A0A', 
        textAlign: 'center',
        marginBottom: 16,
    },
    bigNumberVertical: {
        fontSize: 72, 
        fontFamily: 'System',
        fontWeight: '900',
        color: '#0A0A0A',
    }
});