import React, { useState } from 'react';
import { View, TouchableOpacity, Platform, StatusBar as RNStatusBar } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';
import Animated from 'react-native-reanimated';
import { ChevronLeft, Move, Zap, Flame, Trophy } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';

// --- IMPORTS DE LOS PASOS MODULARES ---
import { HeroStep } from '../components/onboarding/steps/HeroStep';
import { SelectionStep } from '../components/onboarding/steps/SelectionStep';
import { BiometricsStep } from '../components/onboarding/steps/BiometricsStep';
import { BodyFatStep } from '../components/onboarding/steps/BodyFatStep';
import { AgeStep } from '../components/onboarding/steps/AgeStep';
import { TargetWeightStep } from '../components/onboarding/steps/TargetWeightStep';
import { ProjectionStep } from '../components/onboarding/steps/ProjectionStep';
import { SocialProofStep } from '../components/onboarding/steps/SocialProofStep';
import { FinalResultStep } from '../components/onboarding/steps/FinalResultStep';
import { SignUpStep } from '../components/onboarding/steps/SignUpStep';
import ProcessingScreen from '../components/onboarding/ProcessingScreen'; 
import { GradientButton } from '../components/ui/GradientButton';
import { ZENIT_GRADIENT } from '../constants/theme';
import { useUserStore } from '../store/useUserStore';


const STATUSBAR_HEIGHT = Platform.OS === 'android' ? RNStatusBar.currentHeight + 20 : 0;

export default function OnboardingScreen({ navigation }) {
    const [step, setStep] = useState(0);
    const [formData, setFormData] = useState({ 
        gender: null, 
        goal: null, 
        weight: 75.0, 
        height: 175, 
        age: '', 
        bodyFat: null, 
        activityFactor: null, 
        pace: null,
        targetWeight: 70.0 
    });
    const [results, setResults] = useState({ calories: 0, protein: 0, carbs: 0, fats: 0 });

    const advanceStep = () => setStep(p => p + 1);
    const goBack = () => setStep(p => p - 1);

    const handleGoalSelection = (goal) => {
        let smartTarget = formData.weight;
        if (goal === 'Perder Grasa') smartTarget = formData.weight - 5;
        if (goal === 'Ganar Músculo') smartTarget = formData.weight + 3;
        setFormData(prev => ({ ...prev, goal, targetWeight: smartTarget }));
    };

    // ==========================================
    // LÓGICA DE CÁLCULO ULTRA-PRECISA (MODO ZENIT)
    // ==========================================
    const calculatePlan = () => {
        const { weight, height, age, activityFactor, goal, bodyFat, pace } = formData;
        const fatPercentage = parseFloat(bodyFat);

        // 1. MASA MAGRA (LBM) - Base fundamental para evitar sobreestimaciones
        const lbm = weight * (1 - (fatPercentage / 100));

        // 2. TMB (Katch-McArdle) - No depende del género, sino del músculo metabólicamente activo
        const bmr = 370 + (21.6 * lbm);

        // 3. FACTOR DE ACTIVIDAD (Multiplicadores Conservadores para Déficit Agresivo)
        const activityMultipliers = {
            1.2: 1.1,   // Sedentario
            1.375: 1.2, // Ligero
            1.55: 1.35, // Moderado (Tu caso actual)
            1.725: 1.5  // Intenso
        };
        const tdee = bmr * (activityMultipliers[activityFactor] || 1.1);

        // 4. DÉFICIT AGRESIVO REAL
        const paceMultipliers = {
            'relaxed': 0.15,
            'normal': 0.25,
            'aggressive': 0.38 // Incremento al 38% para alcanzar el rango de 1800kcal
        };
        const intensity = paceMultipliers[pace] || 0.20;

        let finalCalories = tdee;
        if (goal === 'Perder Grasa') {
            finalCalories = tdee * (1 - intensity);
        } else if (goal === 'Ganar Músculo') {
            finalCalories = tdee * 1.1; 
        }

        // 5. REPARTO DE MACROS BASADO EN MASA MAGRA (LBM)
        // Proteína: Ajustada para proteger el músculo en déficit agresivo
        const proteinGrams = Math.round(lbm * 2.3); // Proporción de 2.3g por kg de masa magra
        
        // Grasas: Mínimo necesario para salud hormonal
        const fatGrams = Math.round(lbm * 0.7); 
        
        // Carbohidratos: El remanente calórico para energía
        const remainingCals = finalCalories - (proteinGrams * 4) - (fatGrams * 9);
        const carbGrams = Math.max(50, Math.round(remainingCals / 4));

        setResults({
            calories: Math.round(finalCalories),
            protein: proteinGrams,
            carbs: carbGrams,
            fats: fatGrams
        });

        advanceStep(); 
    };

    const renderContent = () => {
        switch(step) {
            case 0: return <HeroStep onNext={advanceStep} onLogin={() => navigation.replace('Main')} />;
            case 1: return <SelectionStep 
                        title="Elegí tu género" subtitle="Para calibrar tu metabolismo basal."
                        value={formData.gender} onChange={(val) => setFormData({...formData, gender: val})}
                        options={[{title:'Masculino'}, {title:'Femenino'}, {title:'Otro'}]} />;
            case 2: return <BiometricsStep weight={formData.weight} setWeight={(val) => setFormData({...formData, weight: val})} height={formData.height} setHeight={(val) => setFormData({...formData, height: val})} />;
            case 3: return <BodyFatStep selected={formData.bodyFat} onSelect={(val) => setFormData({...formData, bodyFat: val})} />;
            case 4: return <AgeStep value={formData.age} onChange={(val) => setFormData({...formData, age: val})} />;
            case 5: return <SelectionStep 
                        title="Tu Ritmo" subtitle="¿Cuánto te mueves hoy?"
                        value={formData.activityFactor} onChange={(val) => setFormData({...formData, activityFactor: val})}
                        options={[
                            {id:1.2, title:'Sedentario', desc:'Poco o nada', icon: Move},
                            {id:1.375, title:'Ligero', desc:'1-3 días/sem', icon: Zap},
                            {id:1.55, title:'Moderado', desc:'3-5 días/sem', icon: Flame},
                            {id:1.725, title:'Intenso', desc:'6-7 días/sem', icon: Trophy}
                        ]} />;
            case 6: return <SelectionStep 
                        title="Tu Objetivo" subtitle="El algoritmo se ajustará a esto."
                        value={formData.goal} onChange={handleGoalSelection}
                        options={[{title:'Perder Grasa', desc:'Déficit calórico'}, {title:'Mantenimiento', desc:'Energía estable'}, {title:'Ganar Músculo', desc:'Superávit estratégico'}]} />;
            case 7: return <TargetWeightStep targetWeight={formData.targetWeight} setTargetWeight={(val) => setFormData({...formData, targetWeight: val})} currentWeight={formData.weight} goal={formData.goal} />;
            case 8: return <SelectionStep 
                        title="Intensidad" subtitle="Define la agresividad del plan."
                        value={formData.pace} onChange={(val) => setFormData({...formData, pace: val})}
                        options={[
                            {id:'relaxed', title:'Sostenible', desc: formData.goal==='Ganar Músculo' ? '+0.2kg/sem':'-0.5kg/sem', emoji:'🌱'},
                            {id:'normal', title:'Exigente', desc: formData.goal==='Ganar Músculo' ? '+0.4kg/sem':'-1.0kg/sem', emoji:'⚡'},
                            {id:'aggressive', title:'MODO ZENIT', desc: formData.goal==='Ganar Músculo' ? '+0.6kg/sem':'-1.5kg/sem', emoji:'🔥'}
                        ]} />;
            case 9: return <ProjectionStep currentWeight={formData.weight} targetWeight={formData.targetWeight} pace={formData.pace} goal={formData.goal} onNext={advanceStep} />;
            case 10: return <SocialProofStep onNext={advanceStep} />;
            case 11: return <ProcessingScreen onFinish={calculatePlan} pace={formData.pace} goal={formData.goal} />;
            case 12: return <FinalResultStep calculations={results} setResults={setResults} onFinish={advanceStep} />;
            case 13: 
                return <SignUpStep onFinish={() => {
                    // 1. Instanciamos la función de guardado directamente aquí
                    useUserStore.getState().saveOnboardingData({
                        calories: results.calories,
                        protein: results.protein,
                        carbs: results.carbs,
                        fats: results.fats
                    });
                    
                    // 2. Navegamos al Dashboard
                    navigation.replace('Main');
                }} />;
            default: return null;
        }
    };

    let canContinue = false;
    if (step === 1) canContinue = formData.gender !== null;
    else if (step === 3) canContinue = formData.bodyFat !== null;
    else if (step === 4) canContinue = formData.age !== '' && parseInt(formData.age) > 10;
    else if (step === 5) canContinue = formData.activityFactor !== null;
    else if (step === 6) canContinue = formData.goal !== null;
    else if (step === 8) canContinue = formData.pace !== null;
    else if ([2, 7].includes(step)) canContinue = true;

    const showContinueButton = [1, 2, 3, 4, 5, 6, 7, 8].includes(step);
    const showProgressBar = step > 0 && step < 11;

    return (
        <View className="flex-1 bg-white">
            <StatusBar style="dark" />
            <View style={{ flex: 1, paddingTop: STATUSBAR_HEIGHT }}>
                {showProgressBar && (
                  <View className="px-4 py-2 flex-row items-center mb-2">
                    <TouchableOpacity onPress={goBack} className="w-10 h-10 bg-gray-50 rounded-full items-center justify-center border border-gray-100">
                        <ChevronLeft size={24} color="#0A0A0A" />
                    </TouchableOpacity>
                    <View className="flex-1 mx-4 h-2 bg-gray-100 rounded-full overflow-hidden">
                        <Animated.View className="h-full rounded-full w-full bg-gray-100">
                            <LinearGradient colors={ZENIT_GRADIENT} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={{ height: '100%', width: `${(step / 11) * 100}%` }} />
                        </Animated.View>
                    </View>
                    <View className="w-10" /> 
                  </View>
                )}
                {renderContent()}
                {showContinueButton && (
                    <View className="px-6 pb-8 pt-2 bg-white">
                        <GradientButton text="CONTINUAR" disabled={!canContinue} onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); advanceStep(); }} />
                    </View>
                )}
            </View>
        </View>
    );
}