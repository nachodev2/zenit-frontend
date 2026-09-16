import React, { useState, useEffect } from 'react';
import { View, Text, Modal, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, TouchableWithoutFeedback, Keyboard } from 'react-native';
import { X, AlertTriangle, Check } from 'lucide-react-native';
import Animated, { FadeInDown, Easing } from 'react-native-reanimated';
import { GradientButton } from '../ui/GradientButton'; 

export const MacroAdjustmentModal = ({ visible, onClose, currentStats, onSave }) => {
    const [values, setValues] = useState({
        calories: '',
        protein: '',
        carbs: '',
        fats: ''
    });

    useEffect(() => {
        if (visible && currentStats) {
            setValues({
                calories: currentStats.calories?.toString() || '',
                protein: currentStats.protein?.toString() || '',
                carbs: currentStats.carbs?.toString() || '',
                fats: currentStats.fats?.toString() || ''
            });
        }
    }, [visible, currentStats]);

    const handleSave = () => {
        onSave({
            calories: parseInt(values.calories) || 0,
            protein: parseInt(values.protein) || 0,
            carbs: parseInt(values.carbs) || 0,
            fats: parseInt(values.fats) || 0
        });
        onClose();
    };

    return (
        <Modal animationType="fade" transparent={true} visible={visible} onRequestClose={onClose}>
            <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
                <View className="flex-1 bg-black/60 justify-end">
                    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
                        <Animated.View 
                            entering={FadeInDown.duration(400).easing(Easing.out(Easing.cubic))}
                            className="bg-white rounded-t-[32px] p-8 pb-10"
                        >
                            <View className="flex-row justify-between items-center mb-6">
                                <Text className="text-2xl font-black text-zenitBlack">Ajustar Metas</Text>
                                <TouchableOpacity onPress={onClose} className="bg-gray-50 p-2 rounded-full border border-gray-100">
                                    <X size={24} color="#9CA3AF" />
                                </TouchableOpacity>
                            </View>

                            {/* CÁPSULA NEGRA DE AVISO (Estilo Smart Coach) */}
                            <View className="bg-[#0A0A0A] p-3 rounded-2xl flex-row items-center mb-8 shadow-lg shadow-gray-200/50">
                                <View className="bg-orange-500/20 p-1.5 rounded-full mr-3">
                                    <AlertTriangle size={16} color="#F97316" />
                                </View>
                                <Text className="text-white text-[11px] font-bold flex-1 leading-4 pr-2">
                                    Aviso: Modifica estos valores con responsabilidad. Un déficit extremo puede afectar tu salud.
                                </Text>
                            </View>

                            <View className="flex-row flex-wrap justify-between gap-y-4 mb-8">
                                <View className="w-full">
                                    <Text className="text-gray-400 tracking-widest text-[10px] font-bold uppercase mb-2 ml-1">Meta Calórica Diaria</Text>
                                    <View className="bg-gray-50 rounded-2xl px-4 py-4 border border-gray-100 flex-row justify-between items-center">
                                        <TextInput 
                                            value={values.calories}
                                            onChangeText={(t) => setValues({...values, calories: t})}
                                            keyboardType="numeric"
                                            className="text-2xl font-black text-zenitBlack flex-1"
                                            placeholder="2000"
                                        />
                                        <Text className="text-orange-500 font-black tracking-widest text-[10px]">KCAL</Text>
                                    </View>
                                </View>

                                {/* IMPUTS UNIFICADOS SIN COLORES EXTRA */}
                                <MacroInput label="Proteína" value={values.protein} onChange={(t) => setValues({...values, protein: t})} unit="g" />
                                <MacroInput label="Carbos" value={values.carbs} onChange={(t) => setValues({...values, carbs: t})} unit="g" />
                                <MacroInput label="Grasas" value={values.fats} onChange={(t) => setValues({...values, fats: t})} unit="g" />
                            </View>

                            <GradientButton text="ACTUALIZAR PLAN" onPress={handleSave} icon={Check} />
                            
                        </Animated.View>
                    </KeyboardAvoidingView>
                </View>
            </TouchableWithoutFeedback>
        </Modal>
    );
};

const MacroInput = ({ label, value, onChange, unit }) => (
    <View className="w-[31%]">
        <Text className="text-gray-400 tracking-widest text-[10px] font-bold uppercase mb-2 ml-1 text-center">{label}</Text>
        <View className="bg-gray-50 rounded-2xl px-3 py-3 border border-gray-100 flex-row items-center">
            <TextInput 
                value={value}
                onChangeText={onChange}
                keyboardType="numeric"
                className="text-lg font-black text-zenitBlack flex-1 text-center"
                placeholder="0"
            />
            <Text className="text-gray-300 font-bold text-[10px]">{unit}</Text>
        </View>
    </View>
);