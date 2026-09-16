import React, { useEffect } from 'react';
import { View, Text, TouchableOpacity, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ChevronLeft, Sparkles, Zap, ZapOff, RotateCcw, Image as LucideImage, ScanBarcode, Camera } from 'lucide-react-native';
import Animated, { useSharedValue, useAnimatedStyle, withRepeat, withSequence, withTiming, Easing } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';

import { ZENIT_GRADIENT } from '../../constants/theme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const VIEWFINDER_SIZE = Math.min(SCREEN_WIDTH * 0.74, 300);
const BARCODE_WIDTH = Math.min(SCREEN_WIDTH * 0.82, 310);
const BARCODE_HEIGHT = 160;

export function CameraControlsOverlay({
  remainingScans = 8,
  flash = 'off',
  isCapturing = false,
  scanMode = 'photo',
  onSelectScanMode,
  onToggleFlash,
  onBack,
  onTakePicture,
  onPickImage,
  onToggleFacing,
  onResetDailyScans,
}) {
  // Animación continua de respiración para el visor HUD
  const hudPulse = useSharedValue(1);
  // Animación láser para el modo código de barras
  const laserPos = useSharedValue(0);

  useEffect(() => {
    hudPulse.value = withRepeat(
      withSequence(
        withTiming(1.025, { duration: 1600, easing: Easing.inOut(Easing.ease) }),
        withTiming(0.975, { duration: 1600, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      true
    );
  }, []);

  useEffect(() => {
    if (scanMode === 'barcode') {
      laserPos.value = withRepeat(
        withTiming(BARCODE_HEIGHT - 20, { duration: 1800, easing: Easing.inOut(Easing.ease) }),
        -1,
        true
      );
    }
  }, [scanMode]);

  const hudAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: hudPulse.value }],
    opacity: hudPulse.value > 1 ? 0.95 : 0.8,
  }));

  const laserAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: laserPos.value }],
  }));

  const isBarcode = scanMode === 'barcode';

  return (
    <SafeAreaView className="flex-1 justify-between">
      {/* Barra Superior */}
      <View>
        <View className="flex-row justify-between items-center px-6 pt-2">
          <TouchableOpacity
            onPress={onBack}
            activeOpacity={0.7}
            className="w-10 h-10 rounded-full bg-black/40 items-center justify-center"
          >
            <ChevronLeft size={24} color="white" />
          </TouchableOpacity>

          {isBarcode ? (
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                backgroundColor: 'rgba(0, 0, 0, 0.55)',
                paddingHorizontal: 12,
                paddingVertical: 6,
                borderRadius: 999,
                borderWidth: 1,
                borderColor: 'rgba(249, 115, 22, 0.4)',
                gap: 6,
              }}
            >
              <ScanBarcode size={13} color="#F97316" />
              <Text style={{ color: 'white', fontSize: 12, fontWeight: '700' }}>
                Ilimitado
              </Text>
            </View>
          ) : (
            /* Contador de escaneos diarios restantes (Mantener presionado para resetear en testing) */
            <TouchableOpacity
              onLongPress={() => {
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                onResetDailyScans?.();
              }}
              delayLongPress={500}
              activeOpacity={0.8}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                backgroundColor: 'rgba(0, 0, 0, 0.55)',
                paddingHorizontal: 12,
                paddingVertical: 6,
                borderRadius: 999,
                borderWidth: 1,
                borderColor: remainingScans > 0 ? 'rgba(249, 115, 22, 0.4)' : 'rgba(239, 68, 68, 0.5)',
                gap: 6,
              }}
            >
              <Sparkles size={13} color={remainingScans > 0 ? '#F97316' : '#EF4444'} />
              <Text style={{ color: 'white', fontSize: 12, fontWeight: '700' }}>
                {remainingScans}/8 hoy
              </Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            onPress={() => {
              Haptics.selectionAsync();
              onToggleFlash?.();
            }}
            activeOpacity={0.7}
            className={`w-10 h-10 rounded-full items-center justify-center ${flash === 'on' ? 'bg-[#F97316]' : 'bg-black/40'}`}
          >
            {flash === 'on' ? <Zap size={18} color="white" /> : <ZapOff size={18} color="white" />}
          </TouchableOpacity>
        </View>

        {/* Selector de Modo: Foto IA vs Código de Barras */}
        <View style={{ alignItems: 'center', marginTop: 14 }}>
          <View
            style={{
              flexDirection: 'row',
              backgroundColor: 'rgba(0, 0, 0, 0.65)',
              borderRadius: 999,
              padding: 4,
              borderWidth: 1,
              borderColor: 'rgba(255, 255, 255, 0.15)',
            }}
          >
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                onSelectScanMode?.('photo');
              }}
              style={{
                paddingVertical: 7,
                paddingHorizontal: 16,
                borderRadius: 999,
                backgroundColor: !isBarcode ? '#EA580C' : 'transparent',
                flexDirection: 'row',
                alignItems: 'center',
                gap: 6,
              }}
            >
              <Camera size={14} color={!isBarcode ? '#FFFFFF' : '#94A3B8'} />
              <Text
                style={{
                  color: !isBarcode ? '#FFFFFF' : '#94A3B8',
                  fontSize: 12,
                  fontWeight: !isBarcode ? '800' : '600',
                }}
              >
                Foto IA
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                onSelectScanMode?.('barcode');
              }}
              style={{
                paddingVertical: 7,
                paddingHorizontal: 16,
                borderRadius: 999,
                backgroundColor: isBarcode ? '#EA580C' : 'transparent',
                flexDirection: 'row',
                alignItems: 'center',
                gap: 6,
              }}
            >
              <ScanBarcode size={14} color={isBarcode ? '#FFFFFF' : '#94A3B8'} />
              <Text
                style={{
                  color: isBarcode ? '#FFFFFF' : '#94A3B8',
                  fontSize: 12,
                  fontWeight: isBarcode ? '800' : '600',
                }}
              >
                Código de Barras
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* Visor HUD Central */}
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 20 }}>
        <Animated.View
          style={[
            {
              width: isBarcode ? BARCODE_WIDTH : VIEWFINDER_SIZE,
              height: isBarcode ? BARCODE_HEIGHT : VIEWFINDER_SIZE,
              alignItems: 'center',
              justifyContent: 'center',
              overflow: 'hidden',
            },
            hudAnimatedStyle,
          ]}
        >
          {/* Esquinas HUD en naranja Zenit */}
          <View style={{ position: 'absolute', top: 0, left: 0, width: 32, height: 32, borderTopWidth: 3.5, borderLeftWidth: 3.5, borderColor: '#F97316', borderTopLeftRadius: 18 }} />
          <View style={{ position: 'absolute', top: 0, right: 0, width: 32, height: 32, borderTopWidth: 3.5, borderRightWidth: 3.5, borderColor: '#F97316', borderTopRightRadius: 18 }} />
          <View style={{ position: 'absolute', bottom: 0, left: 0, width: 32, height: 32, borderBottomWidth: 3.5, borderLeftWidth: 3.5, borderColor: '#F97316', borderBottomLeftRadius: 18 }} />
          <View style={{ position: 'absolute', bottom: 0, right: 0, width: 32, height: 32, borderBottomWidth: 3.5, borderRightWidth: 3.5, borderColor: '#F97316', borderBottomRightRadius: 18 }} />

          {isBarcode ? (
            /* Línea láser animada para código de barras */
            <Animated.View
              style={[
                {
                  position: 'absolute',
                  top: 10,
                  left: 10,
                  right: 10,
                  height: 2,
                  backgroundColor: '#EA580C',
                  shadowColor: '#EA580C',
                  shadowOffset: { width: 0, height: 0 },
                  shadowOpacity: 0.9,
                  shadowRadius: 6,
                  elevation: 5,
                },
                laserAnimatedStyle,
              ]}
            />
          ) : (
            /* Retícula / Mira central minimalista para modo foto */
            <>
              <View style={{ width: 18, height: 1.5, backgroundColor: 'rgba(255, 255, 255, 0.45)', borderRadius: 1 }} />
              <View style={{ height: 18, width: 1.5, backgroundColor: 'rgba(255, 255, 255, 0.45)', position: 'absolute', borderRadius: 1 }} />
              <View style={{ width: 5, height: 5, borderRadius: 2.5, backgroundColor: '#F97316', position: 'absolute' }} />
            </>
          )}
        </Animated.View>

        {/* Píldora de Tip */}
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            backgroundColor: 'rgba(0, 0, 0, 0.65)',
            paddingHorizontal: 16,
            paddingVertical: 8,
            borderRadius: 999,
            borderWidth: 1,
            borderColor: 'rgba(255, 255, 255, 0.12)',
            marginTop: 24,
            gap: 7,
          }}
        >
          {isBarcode ? (
            <ScanBarcode size={14} color="#F97316" />
          ) : (
            <Sparkles size={14} color="#F97316" />
          )}
          <Text style={{ color: 'white', fontSize: 13, fontWeight: '600', letterSpacing: 0.2 }}>
            {isBarcode
              ? 'Apuntá al código de barras del producto'
              : 'Centrá tu plato o porción'}
          </Text>
        </View>
      </View>

      {/* Barra Inferior de Controles */}
      <View style={{ flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center', paddingBottom: 28, paddingTop: 12, paddingHorizontal: 24 }}>
        {/* Botón de Galería */}
        <TouchableOpacity
          onPress={onPickImage}
          activeOpacity={0.75}
          style={{
            width: 52,
            height: 52,
            borderRadius: 26,
            backgroundColor: 'rgba(0, 0, 0, 0.55)',
            alignItems: 'center',
            justifyContent: 'center',
            borderWidth: 1,
            borderColor: 'rgba(255, 255, 255, 0.18)',
          }}
        >
          <LucideImage size={22} color="white" />
        </TouchableOpacity>

        {isBarcode ? (
          /* Indicador de escaneo automático en modo código de barras */
          <View
            style={{
              paddingVertical: 14,
              paddingHorizontal: 20,
              borderRadius: 999,
              backgroundColor: 'rgba(0, 0, 0, 0.7)',
              borderWidth: 1.5,
              borderColor: '#EA580C',
              flexDirection: 'row',
              alignItems: 'center',
              gap: 8,
            }}
          >
            <ScanBarcode size={18} color="#EA580C" />
            <Text style={{ color: '#FFFFFF', fontSize: 13, fontWeight: '800' }}>
              Escaneando código...
            </Text>
          </View>
        ) : (
          /* Disparador de Alta Gama con Doble Anillo en modo foto */
          <TouchableOpacity
            onPress={onTakePicture}
            disabled={isCapturing}
            activeOpacity={0.8}
            style={{
              width: 86,
              height: 86,
              borderRadius: 43,
              alignItems: 'center',
              justifyContent: 'center',
              opacity: isCapturing ? 0.6 : 1,
            }}
          >
            <LinearGradient
              colors={ZENIT_GRADIENT}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={{
                width: 84,
                height: 84,
                borderRadius: 42,
                alignItems: 'center',
                justifyContent: 'center',
                shadowColor: '#F97316',
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.35,
                shadowRadius: 10,
                elevation: 6,
              }}
            >
              <View
                style={{
                  width: 68,
                  height: 68,
                  borderRadius: 34,
                  borderWidth: 2.5,
                  borderColor: 'rgba(255, 255, 255, 0.45)',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <View
                  style={{
                    width: 54,
                    height: 54,
                    borderRadius: 27,
                    backgroundColor: 'white',
                  }}
                />
              </View>
            </LinearGradient>
          </TouchableOpacity>
        )}

        {/* Girar cámara */}
        <TouchableOpacity
          onPress={() => {
            Haptics.selectionAsync();
            onToggleFacing?.();
          }}
          activeOpacity={0.75}
          style={{
            width: 52,
            height: 52,
            borderRadius: 26,
            backgroundColor: 'rgba(0, 0, 0, 0.55)',
            alignItems: 'center',
            justifyContent: 'center',
            borderWidth: 1,
            borderColor: 'rgba(255, 255, 255, 0.18)',
          }}
        >
          <RotateCcw size={22} color="white" />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}
export default CameraControlsOverlay;
