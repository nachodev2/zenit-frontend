import React, { useCallback, useRef, useEffect, useMemo } from 'react';
import { View, Text, Dimensions, TextInput, StyleSheet } from 'react-native';
import Animated, { 
  useSharedValue, 
  useAnimatedScrollHandler, 
  useAnimatedProps, 
  runOnJS, 
  useAnimatedRef
} from 'react-native-reanimated';

const { width } = Dimensions.get('window');
const AnimatedTextInput = Animated.createAnimatedComponent(TextInput);

// =====================================================================
// CONFIGURACIÓN
// =====================================================================
const STEP_SIZE = 10;          
const LINES_PER_CHUNK = 50;    
const CHUNK_SIZE = STEP_SIZE * LINES_PER_CHUNK; 

// Altura del contenedor vertical
const CONTAINER_HEIGHT = 256;
const PADDING_VERTICAL = CONTAINER_HEIGHT / 2;

// --- COMPONENTE DE BLOQUE (CHUNK DINÁMICO) ---
const RulerChunk = React.memo(({ type, startIndex, segmentsPerUnit, totalLines }) => {
    // Generamos las 50 líneas
    const lines = useMemo(() => Array.from({ length: LINES_PER_CHUNK }), []);

    if (type === 'vertical') {
        return (
            // CAMBIO: Quitamos 'height: CHUNK_SIZE' para que se encoja al final
            <View style={{ width: '100%' }}> 
                {lines.map((_, i) => {
                    const globalIndex = startIndex + i;
                    
                    // CAMBIO CLAVE: Si nos pasamos, devolvemos NULL (no ocupa espacio)
                    if (globalIndex > totalLines) {
                        return null; 
                    }

                    const isMajor = globalIndex % 10 === 0;
                    return (
                        <View key={i} style={styles.verticalLineContainer}>
                            <View style={[
                                styles.verticalLine, 
                                isMajor ? styles.lineMajor : styles.lineMinor,
                                styles.lineRoundRight
                            ]} />
                        </View>
                    );
                })}
            </View>
        );
    }
    
    // Horizontal
    return (
        // CAMBIO: Quitamos ancho fijo para que se encoja
        <View style={{ flexDirection: 'row' }}> 
            {lines.map((_, i) => {
                const globalIndex = startIndex + i;
                
                // CAMBIO: Null si excede, corta el scroll en seco
                if (globalIndex > totalLines) {
                    return null;
                }

                const isMajor = globalIndex % segmentsPerUnit === 0;
                return (
                    <View key={i} style={styles.horizontalLineContainer}>
                         <View style={[
                             styles.horizontalLine,
                             isMajor ? styles.lineHeightMajor : styles.lineHeightMinor,
                             isMajor ? styles.bgBlack : styles.bgGray
                         ]} />
                    </View>
                );
            })}
        </View>
    );
});

// --- REGLA HORIZONTAL (PESO) ---
export const HorizontalRuler = React.memo(({ min, max, value, onChange, unit }) => {
  const segmentsPerUnit = 5; 
  const totalLines = (max - min) * segmentsPerUnit;
  const totalChunks = Math.ceil((totalLines + 1) / LINES_PER_CHUNK);
  const data = useMemo(() => Array.from({ length: totalChunks }), [totalChunks]);
  
  const initialOffset = useMemo(() => (value - min) * segmentsPerUnit * STEP_SIZE, []);
  
  const scrollX = useSharedValue(initialOffset);
  const lastUpdateTime = useRef(0);

  const reportValue = (offset, force = false) => {
    const now = Date.now();
    if (!force && now - lastUpdateTime.current < 16) return;
    lastUpdateTime.current = now;

    const rawVal = min + (offset / STEP_SIZE) / segmentsPerUnit;
    const rounded = Math.round(rawVal * 10) / 10;
    
    if (rounded >= min && rounded <= max) {
      onChange(rounded);
    }
  };

  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (event) => {
      scrollX.value = event.contentOffset.x;
      runOnJS(reportValue)(event.contentOffset.x, false);
    },
    onMomentumEnd: (event) => { runOnJS(reportValue)(event.contentOffset.x, true); },
    onScrollEndDrag: (event) => { runOnJS(reportValue)(event.contentOffset.x, true); }
  });

  const animatedProps = useAnimatedProps(() => {
    const currentVal = min + (scrollX.value / STEP_SIZE) / segmentsPerUnit;
    let displayVal = Math.min(Math.max(currentVal, min), max);
    return { text: `${displayVal.toFixed(1)}` };
  });

  const renderItem = useCallback(({ index }) => {
    return (
        <RulerChunk 
            type="horizontal" 
            startIndex={index * LINES_PER_CHUNK} 
            segmentsPerUnit={segmentsPerUnit}
            totalLines={totalLines}
        />
    );
  }, [totalLines]);

  return (
    <View className="items-center justify-center">
      <View style={styles.textRowContainer} pointerEvents="none">
          <AnimatedTextInput
            underlineColorAndroid="transparent"
            defaultValue={`${value.toFixed(1)}`} 
            animatedProps={animatedProps}
            style={styles.bigNumberUnified}
          />
          <Text style={styles.unitText}>{unit}</Text>
      </View>
      
      <View className="h-24 w-full relative">
        <Animated.FlatList
          data={data}
          horizontal
          showsHorizontalScrollIndicator={false}
          snapToInterval={STEP_SIZE} 
          decelerationRate="fast"
          
          contentOffset={{ x: initialOffset, y: 0 }}
          
          // CAMBIO: Quitamos getItemLayout para permitir tamaños dinámicos al final
          initialNumToRender={3}       
          maxToRenderPerBatch={2}      
          windowSize={5}               
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
});

// --- REGLA VERTICAL (ALTURA) ---
export const VerticalRuler = React.memo(({ min, max, value, onChange, unit }) => {
  const range = max - min; 
  const totalChunks = Math.ceil((range + 1) / LINES_PER_CHUNK);
  const data = useMemo(() => Array.from({ length: totalChunks }), [totalChunks]);
  
  const initialOffset = useMemo(() => (max - value) * STEP_SIZE, []);
  
  const scrollY = useSharedValue(initialOffset);
  const lastUpdateTime = useRef(0);

  const reportValue = (offset, force = false) => {
    const now = Date.now();
    if (!force && now - lastUpdateTime.current < 16) return;
    lastUpdateTime.current = now;

    const rawVal = max - (offset / STEP_SIZE);
    const rounded = Math.round(rawVal);
    
    if (rounded >= min && rounded <= max) {
      onChange(rounded);
    }
  };

  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (event) => {
      scrollY.value = event.contentOffset.y;
      runOnJS(reportValue)(event.contentOffset.y, false);
    },
    onMomentumEnd: (event) => { runOnJS(reportValue)(event.contentOffset.y, true); },
    onScrollEndDrag: (event) => { runOnJS(reportValue)(event.contentOffset.y, true); }
  });

  const animatedProps = useAnimatedProps(() => {
    const currentVal = max - (scrollY.value / STEP_SIZE);
    let displayVal = Math.min(Math.max(currentVal, min), max);
    return { text: `${Math.round(displayVal)}` };
  });

  const renderItem = useCallback(({ index }) => {
    return (
        <RulerChunk 
            type="vertical" 
            startIndex={index * LINES_PER_CHUNK}
            totalLines={range}
        />
    );
  }, [range]);

  return (
    <View className="flex-row items-center h-64 mt-52">
      <View className="h-full w-24 overflow-hidden relative border-l border-gray-200 ml-0 ">
        <Animated.FlatList
            data={data}
            showsVerticalScrollIndicator={false}
            snapToInterval={STEP_SIZE}
            decelerationRate="fast"
            contentOffset={{ x: 0, y: initialOffset }}
            initialNumToRender={3}
            maxToRenderPerBatch={2}
            windowSize={5}
            removeClippedSubviews={true}
            onScroll={scrollHandler}
            scrollEventThrottle={16}
            contentContainerStyle={{ paddingVertical: PADDING_VERTICAL }}
            renderItem={renderItem}
            keyExtractor={(_, i) => i.toString()}
        />

        <View className="absolute top-[50%] left-0 w-full flex-row justify-start items-center pointer-events-none mt-[-1px]">
             <View className="w-12 h-[3px] bg-zenitRed rounded-r-full shadow-sm shadow-red-500" />
        </View>
      </View>

      <View style={[styles.textRowContainer, { marginLeft: 0 }]} pointerEvents="none">
         <AnimatedTextInput
            underlineColorAndroid="transparent"
            defaultValue={`${value}`} 
            animatedProps={animatedProps}
            style={styles.bigNumberUnified}
         />
         <Text style={styles.unitText}>{unit}</Text>
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
    textRowContainer: {
        flexDirection: 'row',
        alignItems: 'baseline', 
        justifyContent: 'center',
    },
    bigNumberUnified: {
        fontSize: 80, 
        fontFamily: 'System',
        fontWeight: '900', 
        color: '#0A0A0A', 
        textAlign: 'center',
        includeFontPadding: false,
    },
    unitText: {
        fontSize: 24,
        fontWeight: '600',
        color: '#A1A1AA', 
        marginLeft: 6,
    },
    verticalLineContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'flex-start',
        height: STEP_SIZE, 
        width: '100%',
        paddingLeft: 1,
    },
    verticalLine: {
        backgroundColor: '#D1D5DB', 
    },
    horizontalLineContainer: {
        width: STEP_SIZE, 
        justifyContent: 'flex-end',
        alignItems: 'center',
    },
    horizontalLine: {
        borderRadius: 9999,
    },
    lineMajor: {
        width: 32, 
        height: 2,
        backgroundColor: '#0A0A0A', 
    },
    lineMinor: {
        width: 16, 
        height: 1,
    },
    lineHeightMajor: {
        height: 48, 
        width: 3,
    },
    lineHeightMinor: {
        height: 20, 
        width: 1,
    },
    bgBlack: { backgroundColor: '#0A0A0A' },
    bgGray: { backgroundColor: '#D1D5DB' },
    lineRoundRight: {
        borderTopRightRadius: 9999,
        borderBottomRightRadius: 9999,
    }
});