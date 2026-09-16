import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Modal,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { ScanBarcode, X, Sparkles, AlertCircle } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';

import { ZENIT_GRADIENT } from '../../constants/theme';
import { ZenitHighlightCard } from '../ui/ZenitHighlightCard';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

export function BarcodeProductModal({
  visible,
  barcode,
  onClose,
  onSaveProduct,
  isDark = false,
}) {
  const [name, setName] = useState('');
  const [brand, setBrand] = useState('');
  const [servingSize, setServingSize] = useState('1 porción (100g)');
  const [calories, setCalories] = useState('');
  const [protein, setProtein] = useState('');
  const [carbs, setCarbs] = useState('');
  const [fats, setFats] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    if (visible) {
      setName('');
      setBrand('');
      setServingSize('1 porción (100g)');
      setCalories('');
      setProtein('');
      setCarbs('');
      setFats('');
      setErrorMessage('');
    }
  }, [visible, barcode]);

  const handleSave = () => {
    if (!name.trim()) {
      setErrorMessage('Ingresá el nombre del producto.');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      return;
    }
    if (!calories || isNaN(Number(calories))) {
      setErrorMessage('Ingresá las calorías del producto (número válido).');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      return;
    }

    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    const newProduct = {
      id: Date.now().toString(),
      barcode: barcode ? String(barcode).trim() : '',
      name: name.trim(),
      brand: brand.trim() || 'Genérico',
      servingSize: servingSize.trim() || '1 porción (100g)',
      unitName: servingSize.trim() || '1 porción',
      unitGrams: 100,
      defaultPortionType: 'unit',
      calories: Math.round(Number(calories)) || 0,
      protein: Number(Number(protein || 0).toFixed(1)),
      carbs: Number(Number(carbs || 0).toFixed(1)),
      fats: Number(Number(fats || 0).toFixed(1)),
      unitCalories: Math.round(Number(calories)) || 0,
      unitProtein: Number(Number(protein || 0).toFixed(1)),
      unitCarbs: Number(Number(carbs || 0).toFixed(1)),
      unitFats: Number(Number(fats || 0).toFixed(1)),
      image: null,
      category: 'Personalizado',
      source: 'user_created',
    };

    onSaveProduct(newProduct);
  };

  const bgCard = isDark ? '#1E293B' : '#FFFFFF';
  const textPrimary = isDark ? '#FFFFFF' : '#0F172A';
  const textSecondary = isDark ? '#94A3B8' : '#64748B';
  const inputBg = isDark ? '#0F172A' : '#F8FAFC';
  const inputBorder = isDark ? '#334155' : '#E2E8F0';

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{
          flex: 1,
          backgroundColor: 'rgba(15, 23, 42, 0.7)',
          justifyContent: 'flex-end',
        }}
      >
        <View
          style={{
            backgroundColor: bgCard,
            borderTopLeftRadius: 32,
            borderTopRightRadius: 32,
            maxHeight: SCREEN_HEIGHT * 0.88,
            paddingTop: 20,
            paddingHorizontal: 22,
            paddingBottom: Platform.OS === 'ios' ? 38 : 24,
            shadowColor: '#0F172A',
            shadowOffset: { width: 0, height: -4 },
            shadowOpacity: 0.15,
            shadowRadius: 18,
            elevation: 10,
          }}
        >
          {/* Header */}
          <View
            style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: 12,
            }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              <View
                style={{
                  width: 38,
                  height: 38,
                  borderRadius: 12,
                  backgroundColor: isDark ? '#334155' : '#F1F5F9',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <ScanBarcode size={20} color="#EA580C" />
              </View>
              <View>
                <Text style={{ fontSize: 18, fontWeight: '900', color: textPrimary }}>
                  Producto no encontrado
                </Text>
                <Text style={{ fontSize: 11, fontWeight: '600', color: textSecondary }}>
                  Cargalo para sumarlo a la base de datos
                </Text>
              </View>
            </View>

            <TouchableOpacity
              onPress={onClose}
              style={{
                width: 34,
                height: 34,
                borderRadius: 17,
                backgroundColor: isDark ? '#334155' : '#F1F5F9',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <X size={18} color={textSecondary} />
            </TouchableOpacity>
          </View>

          {/* Tarjeta de Código de Barras Detectado con ZenitHighlightCard */}
          <ZenitHighlightCard
            isDark={isDark}
            style={{ marginBottom: 14 }}
            innerStyle={{
              paddingVertical: 10,
              paddingHorizontal: 14,
            }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <ScanBarcode size={16} color="#EA580C" />
                <Text style={{ fontSize: 12, fontWeight: '800', color: '#EA580C' }}>
                  CÓDIGO DE BARRAS:
                </Text>
              </View>
              <Text
                style={{
                  fontSize: 13,
                  fontWeight: '900',
                  color: textPrimary,
                  letterSpacing: 1.2,
                }}
              >
                {barcode || '---'}
              </Text>
            </View>
          </ZenitHighlightCard>

          {errorMessage ? (
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 6,
                backgroundColor: '#FEE2E2',
                borderRadius: 12,
                paddingHorizontal: 12,
                paddingVertical: 8,
                marginBottom: 12,
              }}
            >
              <AlertCircle size={15} color="#DC2626" />
              <Text style={{ color: '#DC2626', fontSize: 12, fontWeight: '700', flex: 1 }}>
                {errorMessage}
              </Text>
            </View>
          ) : null}

          <ScrollView
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={{ paddingBottom: 16 }}
          >
            {/* Nombre del Producto */}
            <Text style={{ fontSize: 12, fontWeight: '800', color: textSecondary, marginBottom: 5 }}>
              NOMBRE DEL PRODUCTO *
            </Text>
            <TextInput
              value={name}
              onChangeText={(t) => {
                setName(t);
                if (errorMessage) setErrorMessage('');
              }}
              placeholder="Ej: Yogur Griego Natural"
              placeholderTextColor={textSecondary}
              style={{
                backgroundColor: inputBg,
                borderRadius: 14,
                borderWidth: 1,
                borderColor: inputBorder,
                paddingHorizontal: 14,
                paddingVertical: 11,
                fontSize: 14,
                fontWeight: '700',
                color: textPrimary,
                marginBottom: 12,
              }}
            />

            {/* Marca y Porción en fila */}
            <View style={{ flexDirection: 'row', gap: 10, marginBottom: 12 }}>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 12, fontWeight: '800', color: textSecondary, marginBottom: 5 }}>
                  MARCA
                </Text>
                <TextInput
                  value={brand}
                  onChangeText={setBrand}
                  placeholder="Ej: Danone"
                  placeholderTextColor={textSecondary}
                  style={{
                    backgroundColor: inputBg,
                    borderRadius: 14,
                    borderWidth: 1,
                    borderColor: inputBorder,
                    paddingHorizontal: 14,
                    paddingVertical: 11,
                    fontSize: 14,
                    fontWeight: '700',
                    color: textPrimary,
                  }}
                />
              </View>

              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 12, fontWeight: '800', color: textSecondary, marginBottom: 5 }}>
                  PORCIÓN
                </Text>
                <TextInput
                  value={servingSize}
                  onChangeText={setServingSize}
                  placeholder="1 porción (100g)"
                  placeholderTextColor={textSecondary}
                  style={{
                    backgroundColor: inputBg,
                    borderRadius: 14,
                    borderWidth: 1,
                    borderColor: inputBorder,
                    paddingHorizontal: 14,
                    paddingVertical: 11,
                    fontSize: 14,
                    fontWeight: '700',
                    color: textPrimary,
                  }}
                />
              </View>
            </View>

            {/* Fila de Macros */}
            <Text style={{ fontSize: 12, fontWeight: '800', color: textSecondary, marginBottom: 6 }}>
              INFORMACIÓN NUTRICIONAL (POR PORCIÓN)
            </Text>
            <View style={{ flexDirection: 'row', gap: 8, marginBottom: 20 }}>
              {/* Calorías */}
              <View style={{ flex: 1.2 }}>
                <Text style={{ fontSize: 11, fontWeight: '800', color: '#EA580C', marginBottom: 4 }}>
                  Kcal *
                </Text>
                <TextInput
                  value={calories}
                  onChangeText={(t) => {
                    setCalories(t.replace(/[^0-9]/g, ''));
                    if (errorMessage) setErrorMessage('');
                  }}
                  placeholder="0"
                  placeholderTextColor={textSecondary}
                  keyboardType="numeric"
                  style={{
                    backgroundColor: inputBg,
                    borderRadius: 14,
                    borderWidth: 1.5,
                    borderColor: '#EA580C',
                    paddingHorizontal: 10,
                    paddingVertical: 10,
                    fontSize: 15,
                    fontWeight: '900',
                    color: textPrimary,
                    textAlign: 'center',
                  }}
                />
              </View>

              {/* Proteína */}
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 11, fontWeight: '800', color: textSecondary, marginBottom: 4 }}>
                  Prot (g)
                </Text>
                <TextInput
                  value={protein}
                  onChangeText={(t) => setProtein(t.replace(/[^0-9.]/g, ''))}
                  placeholder="0"
                  placeholderTextColor={textSecondary}
                  keyboardType="numeric"
                  style={{
                    backgroundColor: inputBg,
                    borderRadius: 14,
                    borderWidth: 1,
                    borderColor: inputBorder,
                    paddingHorizontal: 8,
                    paddingVertical: 10,
                    fontSize: 14,
                    fontWeight: '800',
                    color: textPrimary,
                    textAlign: 'center',
                  }}
                />
              </View>

              {/* Carbos */}
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 11, fontWeight: '800', color: textSecondary, marginBottom: 4 }}>
                  Carb (g)
                </Text>
                <TextInput
                  value={carbs}
                  onChangeText={(t) => setCarbs(t.replace(/[^0-9.]/g, ''))}
                  placeholder="0"
                  placeholderTextColor={textSecondary}
                  keyboardType="numeric"
                  style={{
                    backgroundColor: inputBg,
                    borderRadius: 14,
                    borderWidth: 1,
                    borderColor: inputBorder,
                    paddingHorizontal: 8,
                    paddingVertical: 10,
                    fontSize: 14,
                    fontWeight: '800',
                    color: textPrimary,
                    textAlign: 'center',
                  }}
                />
              </View>

              {/* Grasas */}
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 11, fontWeight: '800', color: textSecondary, marginBottom: 4 }}>
                  Gras (g)
                </Text>
                <TextInput
                  value={fats}
                  onChangeText={(t) => setFats(t.replace(/[^0-9.]/g, ''))}
                  placeholder="0"
                  placeholderTextColor={textSecondary}
                  keyboardType="numeric"
                  style={{
                    backgroundColor: inputBg,
                    borderRadius: 14,
                    borderWidth: 1,
                    borderColor: inputBorder,
                    paddingHorizontal: 8,
                    paddingVertical: 10,
                    fontSize: 14,
                    fontWeight: '800',
                    color: textPrimary,
                    textAlign: 'center',
                  }}
                />
              </View>
            </View>

            {/* DUO-ACTION BUTTONS (DESIGN_SYSTEM.md 4.D) */}
            <View style={{ flexDirection: 'row', gap: 12 }}>
              {/* Botón Secundario Contrastante: fondo del contenedor, borde y texto naranja */}
              <TouchableOpacity
                onPress={onClose}
                activeOpacity={0.8}
                style={{
                  flex: 1,
                  height: 50,
                  borderRadius: 16,
                  backgroundColor: bgCard,
                  borderWidth: 1.5,
                  borderColor: '#EA580C',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Text style={{ color: '#EA580C', fontSize: 14, fontWeight: '800' }}>
                  Cancelar
                </Text>
              </TouchableOpacity>

              {/* Botón Primario: Linear Gradient Zenit */}
              <TouchableOpacity
                onPress={handleSave}
                activeOpacity={0.88}
                style={{
                  flex: 2,
                  height: 50,
                  borderRadius: 16,
                  overflow: 'hidden',
                  shadowColor: '#EA580C',
                  shadowOffset: { width: 0, height: 4 },
                  shadowOpacity: 0.28,
                  shadowRadius: 8,
                  elevation: 4,
                }}
              >
                <LinearGradient
                  colors={ZENIT_GRADIENT}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={{
                    flex: 1,
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 8,
                  }}
                >
                  <Sparkles size={16} color="#FFFFFF" />
                  <Text style={{ color: '#FFFFFF', fontSize: 14, fontWeight: '900' }}>
                    Guardar y Registrar
                  </Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

export default BarcodeProductModal;
