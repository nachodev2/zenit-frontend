import React, { useRef, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Image,
  ScrollView,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import {
  X,
  Sparkles,
  Plus,
  Heart,
  ChevronDown,
} from 'lucide-react-native';
import Animated, {
  SlideInDown,
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withRepeat,
  Easing,
  withSequence,
  withDelay,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';

import { ZENIT_GRADIENT } from '../../constants/theme';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

const MacroCard = React.memo(({ label, value, onChangeText, isDark }) => (
  <View
    style={{
      flex: 1,
      backgroundColor: isDark ? '#1A1A1A' : '#F9FAFB',
      paddingVertical: 20,
      paddingHorizontal: 8,
      borderRadius: 24,
      borderWidth: 1,
      borderColor: isDark ? '#2A2A2A' : '#F3F4F6',
      alignItems: 'center',
    }}
  >
    <Text
      style={{
        color: isDark ? '#6B7280' : '#9CA3AF',
        fontSize: 10,
        fontWeight: '900',
        letterSpacing: 1.5,
        textTransform: 'uppercase',
        marginBottom: 4,
      }}
    >
      {label}
    </Text>
    <View style={{ flexDirection: 'row', alignItems: 'baseline' }}>
      <TextInput
        value={String(value)}
        onChangeText={(t) => onChangeText(t.replace(/[^0-9.]/g, ''))}
        keyboardType="numeric"
        style={{
          color: isDark ? '#F9FAFB' : '#111827',
          fontSize: 24,
          fontWeight: '900',
          padding: 0,
          margin: 0,
          minWidth: 24,
          textAlign: 'center',
        }}
        selectionColor="#F97316"
      />
      <Text style={{ color: isDark ? '#6B7280' : '#6B7280', fontWeight: '700', fontSize: 12, marginLeft: 2 }}>
        g
      </Text>
    </View>
  </View>
));

export function ScanResultModal({
  photo,
  editableData,
  setEditableData,
  baseDataRef,
  selectedMultiplierRef,
  selectedPortionLabel,
  setSelectedPortionLabel,
  isFavorite,
  setIsFavorite,
  onOpenCoach,
  onDiscard,
  onSave,
  onBack,
  showCoachChat = false,
  isDark = false,
}) {
  const resultScrollRef = useRef(null);

  // Animaciones del tutorial flotante para deslizar
  const hintOpacity = useSharedValue(0);
  const hintTranslateY = useSharedValue(16);
  const arrowTranslateY = useSharedValue(0);

  const hintStyle = useAnimatedStyle(() => ({
    opacity: hintOpacity.value,
    transform: [{ translateY: hintTranslateY.value }],
  }));

  const arrowStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: arrowTranslateY.value }],
  }));

  useEffect(() => {
    // Iniciar rebote continuo sutil de la flechita
    arrowTranslateY.value = withRepeat(
      withSequence(
        withTiming(4, { duration: 450, easing: Easing.inOut(Easing.ease) }),
        withTiming(-2, { duration: 450, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      true
    );

    // Aparece a los 400ms con suave slide up y fade in
    hintOpacity.value = withDelay(400, withTiming(1, { duration: 400, easing: Easing.out(Easing.ease) }));
    hintTranslateY.value = withDelay(400, withTiming(0, { duration: 400, easing: Easing.out(Easing.ease) }));

    const timer = setTimeout(() => {
      hintOpacity.value = withTiming(0, { duration: 500, easing: Easing.in(Easing.ease) });
    }, 4500);

    return () => clearTimeout(timer);
  }, []);

  const handleScrollToBottom = () => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch (e) {}
    hintOpacity.value = withTiming(0, { duration: 200 });
    resultScrollRef.current?.scrollToEnd({ animated: true });
  };

  // Recalcular macros según porción seleccionada
  const handleSelectPortion = (preset) => {
    if (!baseDataRef.current || !preset) return;
    try {
      Haptics.selectionAsync();
    } catch (e) {}
    const mult = typeof preset.multiplier === 'number' ? preset.multiplier : 1;
    if (selectedMultiplierRef) selectedMultiplierRef.current = mult;
    setSelectedPortionLabel(preset.label);

    const baseCals = Number(baseDataRef.current.totalCalories) || 0;
    const baseProt = Number(baseDataRef.current.totalProtein) || 0;
    const baseCarbs = Number(baseDataRef.current.totalCarbs) || 0;
    const baseFat = Number(baseDataRef.current.totalFat) || 0;

    setEditableData((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        totalCalories: Math.round(baseCals * mult),
        totalProtein: Math.round(baseProt * mult),
        totalCarbs: Math.round(baseCarbs * mult),
        totalFat: Math.round(baseFat * mult),
      };
    });
  };

  // Recalcular macros proporcionalmente y actualizar la base cuando el usuario edita las calorías a mano
  const handleCaloriesChange = (text) => {
    const cleaned = text.replace(/[^0-9]/g, '');
    const newCals = Number(cleaned) || 0;
    const base = baseDataRef.current;
    const mult =
      selectedMultiplierRef && selectedMultiplierRef.current > 0 ? selectedMultiplierRef.current : 1;

    if (base && newCals > 0) {
      const currentPortionCals = (Number(base.totalCalories) || 0) * mult;
      const ratio = currentPortionCals > 0 ? newCals / currentPortionCals : 1;

      // Calcular nueva base al 100%
      const newBaseCals = Math.round(newCals / mult);
      const newBaseProt = Math.round((Number(base.totalProtein) || 0) * ratio);
      const newBaseCarbs = Math.round((Number(base.totalCarbs) || 0) * ratio);
      const newBaseFat = Math.round((Number(base.totalFat) || 0) * ratio);

      base.totalCalories = newBaseCals;
      base.totalProtein = newBaseProt;
      base.totalCarbs = newBaseCarbs;
      base.totalFat = newBaseFat;

      setEditableData((prev) =>
        prev
          ? {
              ...prev,
              totalCalories: cleaned,
              totalProtein: Math.round(newBaseProt * mult),
              totalCarbs: Math.round(newBaseCarbs * mult),
              totalFat: Math.round(newBaseFat * mult),
            }
          : prev
      );
      return;
    }

    setEditableData((prev) => (prev ? { ...prev, totalCalories: cleaned } : prev));
  };

  // Actualizar macro individual (Proteína, Carbos, Grasas) y sincronizar la base
  const handleMacroChange = (macroKey, text) => {
    const cleaned = text.replace(/[^0-9.]/g, '');
    const numVal = Number(cleaned) || 0;
    const mult =
      selectedMultiplierRef && selectedMultiplierRef.current > 0 ? selectedMultiplierRef.current : 1;

    if (baseDataRef.current) {
      baseDataRef.current[macroKey] = Math.round(numVal / mult);
    }

    setEditableData((prev) => (prev ? { ...prev, [macroKey]: cleaned } : prev));
  };

  if (!editableData || !photo) return null;

  return (
    <Animated.View
      entering={SlideInDown.duration(360).easing(Easing.out(Easing.cubic))}
      style={StyleSheet.absoluteFill}
      className="z-50"
      renderToHardwareTextureAndroid={true}
    >
      <Image source={{ uri: photo.uri }} style={StyleSheet.absoluteFill} resizeMode="cover" />
      <LinearGradient
        colors={['transparent', 'rgba(0,0,0,0.3)', 'rgba(0,0,0,0.7)']}
        className="absolute inset-0"
        pointerEvents="none"
      />

      {!showCoachChat && (
        <SafeAreaView className="absolute top-0 w-full px-4 pt-2 z-50" pointerEvents="box-none">
          <TouchableOpacity
            onPress={onBack}
            className="bg-white/20 w-10 h-10 rounded-full items-center justify-center backdrop-blur-md border border-white/30"
          >
            <X color="white" size={24} />
          </TouchableOpacity>
        </SafeAreaView>
      )}

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView
          ref={resultScrollRef}
          className="flex-1"
          contentContainerStyle={{ flexGrow: 1, justifyContent: 'flex-end' }}
          showsVerticalScrollIndicator={false}
          bounces={true}
          keyboardShouldPersistTaps="handled"
          scrollEventThrottle={16}
          removeClippedSubviews={Platform.OS === 'android'}
          overScrollMode="never"
          keyboardDismissMode="on-drag"
          onScroll={(e) => {
            if (e.nativeEvent.contentOffset.y > 40 && hintOpacity.value > 0) {
              hintOpacity.value = withTiming(0, { duration: 250 });
            }
          }}
        >
          <View style={{ height: SCREEN_HEIGHT * 0.55 }} />
          <View
            style={{
              backgroundColor: isDark ? '#0F0F0F' : '#FFFFFF',
              borderTopLeftRadius: 40,
              borderTopRightRadius: 40,
              paddingTop: 16,
              paddingHorizontal: 24,
              paddingBottom: 40,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: -10 },
              shadowOpacity: isDark ? 0.4 : 0.12,
              shadowRadius: 20,
              elevation: 10,
            }}
          >
            {/* Drag handle */}
            <View
              style={{
                width: 48,
                height: 6,
                backgroundColor: isDark ? '#2A2A2A' : '#D1D5DB',
                borderRadius: 3,
                alignSelf: 'center',
                marginBottom: 24,
              }}
            />

            {/* Nombre + favorito */}
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginTop: 8 }}>
              <TextInput
                value={editableData.mealName}
                onChangeText={(t) => setEditableData({ ...editableData, mealName: t })}
                style={{
                  color: isDark ? '#F9FAFB' : '#111827',
                  fontSize: 30,
                  fontWeight: '900',
                  flex: 1,
                  marginRight: 8,
                  lineHeight: 36,
                  paddingVertical: 4,
                  minHeight: 44,
                  textAlignVertical: 'top',
                }}
                multiline
                textAlignVertical="top"
                selectionColor="#F97316"
              />
              <TouchableOpacity
                onPress={() => {
                  Haptics.selectionAsync();
                  setIsFavorite?.(!isFavorite);
                }}
                style={{
                  marginLeft: 8,
                  backgroundColor: isDark ? '#1A1A1A' : '#F3F4F6',
                  width: 48,
                  height: 48,
                  borderRadius: 24,
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderWidth: 1,
                  borderColor: isDark ? '#2A2A2A' : '#E5E7EB',
                  marginTop: 4,
                }}
              >
                <Heart size={22} color={isFavorite ? '#F97316' : '#9CA3AF'} fill={isFavorite ? '#F97316' : 'transparent'} />
              </TouchableOpacity>
            </View>

            {/* Badge de calorías */}
            <LinearGradient
              colors={ZENIT_GRADIENT}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={{
                alignSelf: 'flex-start',
                flexDirection: 'row',
                alignItems: 'center',
                paddingHorizontal: 16,
                paddingVertical: 8,
                borderRadius: 999,
                marginTop: 12,
                marginBottom: 20,
              }}
            >
              <Sparkles size={16} color="white" />
              <TextInput
                value={String(editableData.totalCalories)}
                onChangeText={handleCaloriesChange}
                keyboardType="numeric"
                style={{
                  color: 'white',
                  fontWeight: '900',
                  fontSize: 20,
                  marginLeft: 8,
                  padding: 0,
                  margin: 0,
                  minWidth: 30,
                  textAlign: 'center',
                }}
                selectionColor="white"
              />
              <Text style={{ color: 'white', fontWeight: '900', fontSize: 18, marginLeft: 4 }}>KCAL</Text>
            </LinearGradient>

            {/* Selector de porciones */}
            {baseDataRef?.current?.portionPresets && baseDataRef.current.portionPresets.length > 0 && (
              <View
                style={{
                  backgroundColor: isDark ? '#1A1A1A' : '#F9FAFB',
                  padding: 16,
                  borderRadius: 20,
                  borderWidth: 1,
                  borderColor: isDark ? '#2A2A2A' : '#F3F4F6',
                  marginBottom: 24,
                }}
              >
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <LinearGradient
                      colors={ZENIT_GRADIENT}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      style={{ width: 6, height: 6, borderRadius: 3, marginRight: 8 }}
                    />
                    <Text
                      style={{
                        color: isDark ? '#9CA3AF' : '#6B7280',
                        fontSize: 11,
                        fontWeight: '700',
                        letterSpacing: 0.5,
                        textTransform: 'uppercase',
                      }}
                    >
                      {baseDataRef.current.servingType === 'container_or_bulk'
                        ? 'Tamaño de tu porción'
                        : 'Porción consumida'}
                    </Text>
                  </View>
                  {baseDataRef.current.servingType === 'container_or_bulk' && (
                    <Text style={{ color: isDark ? '#6B7280' : '#9CA3AF', fontSize: 11, fontWeight: '600' }}>
                      Total: {baseDataRef.current.totalCalories} kcal
                    </Text>
                  )}
                </View>

                {/* Grid 2x2 */}
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                  {baseDataRef.current.portionPresets.slice(0, 4).map((preset, idx) => {
                    const isSelected = selectedPortionLabel === preset.label;
                    return (
                      <TouchableOpacity
                        key={idx}
                        onPress={() => handleSelectPortion(preset)}
                        activeOpacity={0.75}
                        style={{
                          width: '47.5%',
                          paddingVertical: 14,
                          paddingHorizontal: 8,
                          borderRadius: 14,
                          alignItems: 'center',
                          justifyContent: 'center',
                          borderWidth: 1.5,
                          backgroundColor: isSelected
                            ? isDark
                              ? '#2A1400'
                              : '#FFF7ED'
                            : isDark
                              ? '#141414'
                              : '#FFFFFF',
                          borderColor: isSelected ? '#F97316' : isDark ? '#2A2A2A' : '#E5E7EB',
                          ...(isSelected
                            ? {
                                shadowColor: '#F97316',
                                shadowOffset: { width: 0, height: 2 },
                                shadowOpacity: 0.2,
                                shadowRadius: 6,
                                elevation: 3,
                              }
                            : {}),
                        }}
                      >
                        <Text
                          style={{
                            fontSize: 13,
                            fontWeight: '700',
                            textAlign: 'center',
                            color: isSelected ? '#F97316' : isDark ? '#9CA3AF' : '#374151',
                          }}
                          numberOfLines={1}
                        >
                          {preset.label}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            )}

            {/* Macro cards */}
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 24, gap: 12 }}>
              <MacroCard
                isDark={isDark}
                label="Proteína"
                value={editableData.totalProtein}
                onChangeText={(t) => handleMacroChange('totalProtein', t)}
              />
              <MacroCard
                isDark={isDark}
                label="Carbos"
                value={editableData.totalCarbs}
                onChangeText={(t) => handleMacroChange('totalCarbs', t)}
              />
              <MacroCard
                isDark={isDark}
                label="Grasas"
                value={editableData.totalFat}
                onChangeText={(t) => handleMacroChange('totalFat', t)}
              />
            </View>

            {/* Consultar coach */}
            <TouchableOpacity
              activeOpacity={0.85}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                onOpenCoach?.();
              }}
              style={{ marginBottom: 24, borderRadius: 16, overflow: 'hidden' }}
            >
              <LinearGradient
                colors={ZENIT_GRADIENT}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'center',
                  paddingVertical: 16,
                  borderRadius: 16,
                }}
              >
                <Sparkles size={20} color="white" />
                <Text style={{ color: 'white', fontWeight: '900', fontSize: 16, marginLeft: 8 }}>
                  Consultar Zenit Coach
                </Text>
              </LinearGradient>
            </TouchableOpacity>

            {/* Ingredientes */}
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <Text style={{ color: isDark ? '#F9FAFB' : '#111827', fontWeight: '700', fontSize: 18 }}>Ingredientes</Text>
              <TouchableOpacity
                onPress={() => {
                  Haptics.selectionAsync();
                  setEditableData({ ...editableData, ingredients: [...editableData.ingredients, ''] });
                }}
              >
                <LinearGradient
                  colors={ZENIT_GRADIENT}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 999 }}
                >
                  <Plus size={14} color="white" />
                  <Text style={{ color: 'white', fontWeight: '700', fontSize: 12, marginLeft: 4 }}>Agregar</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>

            <View
              style={{
                backgroundColor: isDark ? '#1A1A1A' : '#F9FAFB',
                borderRadius: 20,
                padding: 8,
                borderWidth: 1,
                borderColor: isDark ? '#2A2A2A' : '#F3F4F6',
                marginBottom: 8,
              }}
            >
              {editableData.ingredients.map((ing, i) => (
                <View
                  key={i}
                  style={{
                    paddingVertical: 4,
                    paddingHorizontal: 16,
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    borderBottomWidth: i !== editableData.ingredients.length - 1 ? 1 : 0,
                    borderBottomColor: isDark ? '#1F1F1F' : '#F3F4F6',
                  }}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                    <LinearGradient
                      colors={ZENIT_GRADIENT}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      style={{ width: 8, height: 8, borderRadius: 4, marginRight: 12 }}
                    />
                    <TextInput
                      value={ing}
                      onChangeText={(t) => {
                        const newIng = [...editableData.ingredients];
                        newIng[i] = t;
                        setEditableData({ ...editableData, ingredients: newIng });
                      }}
                      placeholder="Nombre..."
                      placeholderTextColor="#9CA3AF"
                      style={{
                        color: isDark ? '#E5E7EB' : '#1F2937',
                        fontSize: 15,
                        fontWeight: '500',
                        flex: 1,
                        paddingVertical: 12,
                        padding: 0,
                        margin: 0,
                      }}
                      selectionColor="#F97316"
                    />
                  </View>
                  <TouchableOpacity
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      const newIng = [...editableData.ingredients];
                      newIng.splice(i, 1);
                      setEditableData({ ...editableData, ingredients: newIng });
                    }}
                    style={{ padding: 8 }}
                  >
                    <X size={18} color="#9CA3AF" />
                  </TouchableOpacity>
                </View>
              ))}
            </View>

            {/* Botones de acción */}
            <View style={{ flexDirection: 'row', gap: 12, marginTop: 28, marginBottom: 8 }}>
              {/* Descartar */}
              <TouchableOpacity
                activeOpacity={0.75}
                onPress={onDiscard}
                style={{
                  flex: 1,
                  borderRadius: 16,
                  borderWidth: 1.5,
                  borderColor: isDark ? '#2A2A2A' : '#E5E7EB',
                  backgroundColor: 'transparent',
                  paddingVertical: 16,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Text style={{ color: isDark ? '#6B7280' : '#9CA3AF', fontWeight: '700', fontSize: 15 }}>Descartar</Text>
              </TouchableOpacity>

              {/* Guardar Macros */}
              <TouchableOpacity
                activeOpacity={0.85}
                onPress={onSave}
                style={{ flex: 1, borderRadius: 16, overflow: 'hidden' }}
              >
                <LinearGradient
                  colors={ZENIT_GRADIENT}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={{ paddingVertical: 16, alignItems: 'center', justifyContent: 'center', borderRadius: 16 }}
                >
                  <Text style={{ color: 'white', fontWeight: '900', fontSize: 15 }}>Guardar Macros</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Hint tutorial flotante con flecha animada */}
      {!showCoachChat && (
        <Animated.View
          pointerEvents="box-none"
          style={[
            {
              position: 'absolute',
              bottom: 28,
              left: 0,
              right: 0,
              alignItems: 'center',
              zIndex: 999,
              elevation: 25,
            },
            hintStyle,
          ]}
        >
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={handleScrollToBottom}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              backgroundColor: isDark ? 'rgba(28,28,30,0.95)' : 'rgba(18,18,18,0.90)',
              paddingHorizontal: 18,
              paddingVertical: 11,
              borderRadius: 999,
              borderWidth: 1,
              borderColor: isDark ? 'rgba(255,255,255,0.15)' : 'rgba(255,255,255,0.22)',
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.3,
              shadowRadius: 8,
              elevation: 10,
              gap: 8,
            }}
          >
            <Animated.View style={arrowStyle}>
              <ChevronDown size={18} color="#F97316" strokeWidth={2.5} />
            </Animated.View>
            <Text style={{ color: '#FFFFFF', fontSize: 13, fontWeight: '700', letterSpacing: 0.2 }}>
              Deslizá para guardar la comida
            </Text>
          </TouchableOpacity>
        </Animated.View>
      )}
    </Animated.View>
  );
}

export default ScanResultModal;

