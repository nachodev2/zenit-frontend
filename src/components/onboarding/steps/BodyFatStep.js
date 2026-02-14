import React, { useState } from 'react';
import { View, Text, TouchableOpacity, TextInput, Platform } from 'react-native';
import Animated, { FadeInDown, FadeIn, Easing } from 'react-native-reanimated';
import { Scale, Bone, BicepsFlexed, Sandwich, X } from 'lucide-react-native';
import { SelectionCard } from '../../ui/SelectionCard'; 

const BODY_TYPES = [
    { id: '10', title: 'Definido', subtitle: '8-12% Grasa', icon: Bone },
    { id: '18', title: 'Promedio', subtitle: '15-20% Grasa', icon: Scale },
    { id: '15', title: 'Muscular', subtitle: '12-18% Grasa', icon: BicepsFlexed },
    { id: '25', title: 'Sobrepeso', subtitle: '>25% Grasa', icon: Sandwich },
];

export const BodyFatStep = ({ selected, onSelect }) => {
    const [isManualMode, setIsManualMode] = useState(false);
    const [manualValue, setManualValue] = useState('');

    const handleTextChange = (text) => {
        // 1. Reemplazamos comas por puntos automáticamente
        let formatted = text.replace(',', '.');

        // 2. Validación Regex: Permite números enteros y decimales (ej: "15", "15.", "15.5")
        // Bloquea múltiples puntos o caracteres raros.
        if (/^\d{0,3}(\.\d{0,2})?$/.test(formatted)) {
            setManualValue(formatted);
            onSelect(formatted);
        }
    };

    return (
        <View className="flex-1 bg-white">
            <Animated.View 
                entering={FadeInDown.duration(500).easing(Easing.out(Easing.cubic))} 
                className="flex-1 px-6 pt-6"
            >
                <Text className="text-zenitBlack text-4xl font-black mb-2">Tu Cuerpo</Text>
                <Text className="text-gray-500 text-lg font-medium mb-8">
                    {isManualMode ? 'Ingresa tu porcentaje de grasa.' : 'Selecciona tu composición actual.'}
                </Text>

                {isManualMode ? (
                    <Animated.View entering={FadeIn.duration(300)} className="flex-1 justify-center items-center">
                        {/* Contenedor del Input con altura fija para evitar cortes */}
                        <View className="flex-row items-center justify-center mb-12 h-32">
                            <TextInput 
                                value={manualValue}
                                onChangeText={handleTextChange}
                                placeholder="15"
                                placeholderTextColor="#E5E7EB"
                                keyboardType="decimal-pad" 
                                autoFocus
                                // FIX VISUAL: includeFontPadding={false} evita que se corte en Android
                                style={{ 
                                    includeFontPadding: false, 
                                    textAlignVertical: 'center',
                                    fontSize: 80, // Tamaño manual controlado
                                    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto', // Asegura fuente base
                                    fontWeight: '900',
                                    color: '#0A0A0A'
                                }}
                                className="text-center min-w-[140px]"
                                maxLength={5} // Aumentado para permitir decimales (ej: 15.55)
                            />
                            <Text className="text-4xl font-bold text-gray-400 ml-2 mt-4">%</Text>
                        </View>
                        
                        <TouchableOpacity 
                            onPress={() => setIsManualMode(false)}
                            className="flex-row items-center bg-gray-50 px-6 py-4 rounded-full border border-gray-100"
                        >
                            <X size={18} color="#9CA3AF" />
                            <Text className="ml-2 font-bold text-gray-500 uppercase text-xs tracking-widest">
                                VOLVER A SELECCIONAR
                            </Text>
                        </TouchableOpacity>
                    </Animated.View>
                ) : (
                    <>
                        <View className="flex-row flex-wrap justify-between gap-y-4">
                            {BODY_TYPES.map((type, index) => (
                                <View key={type.id} style={{ width: '48%' }}> 
                                    <SelectionCard
                                        variant="grid"
                                        index={index} 
                                        title={type.title}
                                        subtitle={type.subtitle}
                                        icon={type.icon}
                                        selected={selected === type.id}
                                        onSelect={onSelect}
                                        onPress={() => onSelect(type.id)}
                                        style={{ height: 165 }} 
                                    />
                                </View>
                            ))}
                        </View>

                        <TouchableOpacity 
                            onPress={() => setIsManualMode(true)}
                            className="mt-8 items-center p-4"
                        >
                            <Text className="text-zenitRed font-bold text-xs tracking-widest uppercase">
                                INGRESAR % EXACTO
                            </Text>
                        </TouchableOpacity>
                    </>
                )}
            </Animated.View>
        </View>
    );
};