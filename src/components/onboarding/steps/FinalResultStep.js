import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput } from 'react-native';
import Animated, { FadeInRight, FadeInDown, ZoomIn } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { PremiumRing } from '../../ui/PremiumRing'; // Importamos el componente que creamos en Paso 1
import { GradientButton } from '../../ui/GradientButton';
import SwipeButton from '../../ui/SwipeButton'; // Asumo que lo extrajiste, si no, avísame.
import { ZENIT_COLORS } from '../../../constants/theme'; // Ajusta ruta

const GRADIENTS = {
    blue:   ['#2563EB', '#60A5FA'],
    orange: ['#EA580C', '#FDBA74'],
    yellow: ['#CA8A04', '#FDE047'],
    green:  ['#16A34A', '#86EFAC'],
};

const LIMITS = {
    calories: { min: 500, max: 8000 },
    protein: { min: 20, max: 500 },
    carbs: { min: 20, max: 1000 },
    fats: { min: 10, max: 300 }
};

export const FinalResultStep = ({ onFinish, calculations, setResults }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [errors, setErrors] = useState({});
    const [editValues, setEditValues] = useState({
        calories: calculations.calories.toString(),
        protein: calculations.protein.toString(),
        carbs: calculations.carbs.toString(),
        fats: calculations.fats.toString(),
    });

    const validate = (key, val) => {
        const num = parseInt(val) || 0;
        const isInvalid = num < LIMITS[key].min || num > LIMITS[key].max;
        setErrors(prev => ({ ...prev, [key]: isInvalid }));
        return !isInvalid;
    };

    const handleSave = () => {
        const isValid = Object.keys(LIMITS).every(key => validate(key, editValues[key]));
        if (isValid) {
            setResults({
                calories: parseInt(editValues.calories), protein: parseInt(editValues.protein),
                carbs: parseInt(editValues.carbs), fats: parseInt(editValues.fats),
            });
            setIsEditing(false);
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        } else {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        }
    };

    return (
        <Animated.View entering={FadeInRight.duration(600)} className="flex-1 px-6 pt-10 bg-white justify-between pb-10">
            <ScrollView showsVerticalScrollIndicator={false}>
                <View className="items-center">
                    <Animated.Text entering={FadeInDown.delay(100)} className="text-zenitBlack text-4xl font-black text-center mb-2">Tu Meta Zenit</Animated.Text>
                    <Animated.View entering={FadeInDown.delay(200)} className="bg-amber-50 p-4 rounded-2xl border border-amber-100 mb-8 w-full">
                        <Text className="text-amber-800 text-xs font-medium text-center leading-5"><Text className="font-bold">Aviso:</Text> Ajusta con responsabilidad.</Text>
                    </Animated.View>
                    {!isEditing ? (
                        <>
                            <Animated.View entering={ZoomIn.delay(300).springify()}>
                                <PremiumRing size={220} strokeWidth={14} gradientColors={GRADIENTS.blue} percentage={0.85} id="cal">
                                    <Text numberOfLines={1} adjustsFontSizeToFit className="text-6xl font-black text-zenitBlack tracking-tighter">{calculations.calories}</Text>
                                    <Text className="text-gray-400 text-sm font-bold tracking-[3px]">KCAL</Text>
                                </PremiumRing>
                            </Animated.View>
                            <Animated.View entering={FadeInDown.delay(500)} className="flex-row justify-between w-full mt-10 mb-8 px-2">
                                <MacroRingItem value={calculations.protein} label="PROT" gradientColors={GRADIENTS.orange} id="prot" />
                                <MacroRingItem value={calculations.carbs} label="CARB" gradientColors={GRADIENTS.yellow} id="carb" />
                                <MacroRingItem value={calculations.fats} label="GRASA" gradientColors={GRADIENTS.green} id="fat" />
                            </Animated.View>
                            <TouchableOpacity onPress={() => setIsEditing(true)}><Text className="text-zenitRed font-bold text-sm uppercase tracking-widest">Personalizar Valores</Text></TouchableOpacity>
                        </>
                    ) : (
                        <View className="w-full gap-y-6">
                            <EditField label={`Calorías (${LIMITS.calories.min}-${LIMITS.calories.max})`} value={editValues.calories} error={errors.calories} onChange={(v) => {setEditValues(p=>({...p, calories:v})); validate('calories',v);}} big />
                            <View className="flex-row gap-x-2 w-full px-1">
                                <EditField label="Proteína" value={editValues.protein} error={errors.protein} color={ZENIT_COLORS.orange} onChange={(v)=>{setEditValues(p=>({...p, protein:v})); validate('protein',v);}} />
                                <EditField label="Carbos" value={editValues.carbs} error={errors.carbs} color={ZENIT_COLORS.yellow} onChange={(v)=>{setEditValues(p=>({...p, carbs:v})); validate('carbs',v);}} />
                                <EditField label="Grasas" value={editValues.fats} error={errors.fats} color={ZENIT_COLORS.green} onChange={(v)=>{setEditValues(p=>({...p, fats:v})); validate('fats',v);}} />
                            </View>
                            <GradientButton text="CONFIRMAR AJUSTES" onPress={handleSave} />
                        </View>
                    )}
                </View>
            </ScrollView>
            {!isEditing && <SwipeButton onConfirm={onFinish} />}
        </Animated.View>
    );
};

// Sub-componentes internos para limpieza
const MacroRingItem = ({ value, label, gradientColors, id }) => (
    <View className="items-center">
        <PremiumRing size={85} strokeWidth={8} gradientColors={gradientColors} percentage={0.6} id={id}>
            <Text numberOfLines={1} adjustsFontSizeToFit className="text-xl font-black text-zenitBlack">{value}g</Text>
        </PremiumRing>
        <Text className="text-gray-400 text-[10px] font-black tracking-widest mt-3">{label}</Text>
    </View>
);

const EditField = ({ label, value, color, error, onChange, big }) => (
    <View className={`flex-1 bg-gray-50 p-3 rounded-3xl border-2 ${error ? 'border-red-500' : 'border-gray-100'}`}>
        <Text style={{ color: color || '#A1A1AA' }} className="font-bold text-[10px] uppercase mb-2" numberOfLines={1} adjustsFontSizeToFit>{label}</Text>
        <TextInput value={value} onChangeText={onChange} keyboardType="numeric" className={`${big ? 'text-5xl' : 'text-2xl'} font-black text-zenitBlack p-0`} />
    </View>
);