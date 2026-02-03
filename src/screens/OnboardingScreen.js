import React, { useState } from 'react';
import { View, Text, TouchableOpacity, SafeAreaView, Platform, StatusBar as RNStatusBar } from 'react-native';
import { ChevronLeft, Play } from 'lucide-react-native';
import { StatusBar } from 'expo-status-bar';
import { HorizontalRuler, VerticalRuler } from '../components/ui/RulerPicker';
import ProcessingScreen from '../components/onboarding/ProcessingScreen';

const STATUSBAR_HEIGHT = Platform.OS === 'android' ? RNStatusBar.currentHeight + 20 : 0;

// --- PASO 1: HERO / VIDEO ---
const HeroStep = ({ onNext }) => (
  <View className="flex-1 bg-white">
      <View className="flex-1 bg-gray-50 items-center justify-center relative overflow-hidden">
           <View className="absolute items-center justify-center">
                <View className="w-20 h-20 bg-white/20 rounded-full items-center justify-center mb-4 backdrop-blur-md">
                    <Play size={32} color="#0A0A0A" fill="#0A0A0A" />
                </View>
                <Text className="text-gray-400 text-xs uppercase tracking-widest">Video Loop Demo</Text>
           </View>
           <View className="absolute bottom-10 left-0 right-0 px-6">
                <Text className="text-zenitBlack text-6xl font-black tracking-tighter text-center mb-1">
                    ZENIT.
                </Text>
                <Text className="text-zenitTextMuted text-2xl font-medium tracking-tight text-center">
                    No hay techo.
                </Text>
           </View>
      </View>
      <View className="bg-white px-6 py-8 pb-12 rounded-t-3xl mt-[-20px] shadow-lg">
          <TouchableOpacity 
            onPress={onNext}
            className="bg-zenitRed w-full py-5 rounded-full items-center shadow-lg shadow-red-500/40 active:scale-95 transition-transform"
          >
            <Text className="text-white font-bold text-lg tracking-wide">INICIAR CALIBRACIÓN</Text>
          </TouchableOpacity>
          <TouchableOpacity className="mt-6">
            <Text className="text-center text-gray-400 font-medium text-sm">
                ¿Ya tienes cuenta? <Text className="text-zenitBlack font-bold">Inicia sesión</Text>
            </Text>
          </TouchableOpacity>
      </View>
  </View>
);

// --- PASO 2: GÉNERO ---
const GenderStep = ({ value, onChange }) => {
  const options = ['Masculino', 'Femenino', 'Otro'];
  return (
    <View className="flex-1 px-6 pt-8">
      <Text className="text-zenitBlack text-4xl font-black tracking-tight mb-2">Elegí tu género</Text>
      <Text className="text-gray-500 text-lg mb-12 font-medium">Para calibrar tu metabolismo basal.</Text>
      <View className="gap-y-4">
        {options.map((opt) => {
            const isActive = value === opt;
            return (
                <TouchableOpacity
                    key={opt}
                    onPress={() => onChange(opt)}
                    className={`py-6 rounded-3xl border-2 items-center ${
                        isActive 
                        ? 'bg-zenitRed border-zenitRed shadow-lg shadow-red-500/30' 
                        : 'bg-gray-50 border-transparent'
                    }`}
                >
                    <Text className={`text-xl font-bold ${isActive ? 'text-white' : 'text-zenitBlack'}`}>
                        {opt}
                    </Text>
                </TouchableOpacity>
            )
        })}
      </View>
    </View>
  );
};

// --- PASO 3: OBJETIVO ---
const GoalStep = ({ value, onChange }) => {
    const options = [
        { title: 'Perder Grasa', desc: 'Déficit calórico controlado' },
        { title: 'Mantenimiento', desc: 'Rendimiento y energía estable' },
        { title: 'Ganar Músculo', desc: 'Superávit estratégico' }
    ];
    return (
        <View className="flex-1 px-6 pt-8">
            <Text className="text-zenitBlack text-4xl font-black tracking-tight mb-2">Tu Objetivo</Text>
            <Text className="text-gray-500 text-lg mb-12 font-medium">El algoritmo se ajustará a esto.</Text>
            <View className="gap-y-4">
                {options.map((opt) => {
                    const isActive = value === opt.title;
                    return (
                        <TouchableOpacity
                        key={opt.title}
                        onPress={() => onChange(opt.title)}
                        className={`p-6 rounded-3xl border-2 items-start ${
                            isActive
                            ? 'bg-zenitRed border-zenitRed shadow-lg shadow-red-500/30' 
                            : 'bg-white border-gray-100'
                        }`}
                        >
                        <Text className={`text-xl font-bold mb-1 ${isActive ? 'text-white' : 'text-zenitBlack'}`}>
                            {opt.title}
                        </Text>
                        <Text className={`text-sm font-medium ${isActive ? 'text-white/80' : 'text-gray-500'}`}>
                            {opt.desc}
                        </Text>
                        </TouchableOpacity>
                    )
                })}
            </View>
        </View>
    );
};

// --- PASO 4: BIOMETRÍA ---
const BiometricsStep = ({ weight, setWeight, height, setHeight }) => (
    <View className="flex-1 pt-4">
        <View className="px-6 mb-2">
             <Text className="text-zenitBlack text-4xl font-black tracking-tight mb-2">Tus Medidas</Text>
             <Text className="text-gray-500 text-lg font-medium">Desliza las reglas para ajustar.</Text>
        </View>
        <View className="flex-1 justify-center space-y-8">
            <View className="px-6 flex-row items-center justify-between h-64">
                <VerticalRuler min={140} max={220} value={height} onChange={setHeight} unit="cm" />
            </View>
            <View className="h-[1px] bg-gray-100 mx-6" />
            <View className="w-full py-4">
                {/* CAMBIO: Rango extendido a 300kg */}
                <HorizontalRuler min={30} max={300} value={weight} onChange={setWeight} unit="kg" />
            </View>
        </View>
    </View>
);

// --- PASO FINAL: RESULTADO ---
const FinalResultStep = ({ onFinish, data, calculations }) => (
    <View className="flex-1 px-6 pt-10 items-center justify-center bg-white">
        <Text className="text-zenitRed text-sm font-bold tracking-widest uppercase mb-4">
            ANÁLISIS COMPLETADO
        </Text>
        <Text className="text-zenitBlack text-5xl font-black text-center mb-4 leading-tight">
            Tu Plan Zenit
        </Text>
        <Text className="text-gray-500 text-center text-lg mb-10 px-4 font-medium">
            Para <Text className="text-zenitRed font-bold">{data.goal.toLowerCase()}</Text>, tu cuerpo necesita esta gasolina:
        </Text>
        
        <View className="bg-white w-full p-8 rounded-[40px] items-center mb-8 border border-gray-100 shadow-xl shadow-gray-200/50">
            <Text className="text-zenitBlack text-8xl font-black tracking-tighter">
                {calculations.calories}
            </Text>
            <Text className="text-zenitRed text-sm uppercase font-bold tracking-widest mt-[-5px] mb-8">
                Calorías Diarias
            </Text>
            <View className="flex-row w-full justify-between px-2">
                <MacroStat value={calculations.protein} label="Prot" color="text-zenitBlack" />
                <View className="w-[1px] bg-gray-200 h-12 self-center" />
                <MacroStat value={calculations.carbs} label="Carb" color="text-zenitBlack" />
                <View className="w-[1px] bg-gray-200 h-12 self-center" />
                <MacroStat value={calculations.fats} label="Grasa" color="text-zenitBlack" />
            </View>
        </View>

        <TouchableOpacity 
            onPress={onFinish}
            className="w-full bg-zenitBlack py-5 rounded-full items-center mb-4 shadow-lg shadow-black/20"
        >
            <Text className="text-white font-bold text-lg">GUARDAR Y CONTINUAR</Text>
        </TouchableOpacity>
    </View>
);

const MacroStat = ({ value, label, color }) => (
    <View className="items-center">
        <Text className={`text-2xl font-black ${color}`}>{value}g</Text>
        <Text className="text-gray-400 text-[10px] uppercase font-bold tracking-wider">{label}</Text>
    </View>
);

// --- CONTROLADOR PRINCIPAL ---
export default function OnboardingScreen({ navigation }) {
  const [step, setStep] = useState(0);
  const [formData, setFormData] = useState({
    gender: null,
    goal: null,
    weight: 75.0,
    height: 175,
    age: 25, 
  });
  const [results, setResults] = useState({ calories: 0, protein: 0, carbs: 0, fats: 0 });

  const advanceStep = () => setStep(prev => prev + 1);
  const goBack = () => setStep(prev => prev - 1);

  const calculatePlan = () => {
    let bmr;
    const w = formData.weight;
    const h = formData.height;
    const a = formData.age;
    if (formData.gender === 'Femenino') {
        bmr = 447.593 + (9.247 * w) + (3.098 * h) - (4.330 * a);
    } else {
        bmr = 88.362 + (13.397 * w) + (4.799 * h) - (5.677 * a);
    }
    let tdee = bmr * 1.375; 
    if (formData.goal === 'Perder Grasa') tdee -= 500;
    if (formData.goal === 'Ganar Músculo') tdee += 400;

    const calories = Math.round(tdee);
    let pRatio = 0.3, cRatio = 0.4, fRatio = 0.3;
    if (formData.goal === 'Perder Grasa') { pRatio = 0.4; cRatio = 0.3; fRatio = 0.3; }
    if (formData.goal === 'Ganar Músculo') { pRatio = 0.3; cRatio = 0.5; fRatio = 0.2; }

    setResults({ 
        calories, 
        protein: Math.round((calories * pRatio) / 4), 
        carbs: Math.round((calories * cRatio) / 4), 
        fats: Math.round((calories * fRatio) / 9) 
    });
    advanceStep();
  };

  const renderContent = () => {
    switch(step) {
      case 0: return <HeroStep onNext={advanceStep} />;
      case 1: return <GenderStep value={formData.gender} onChange={(val) => { 
          setFormData(prev => ({...prev, gender: val})); 
          setTimeout(advanceStep, 50); 
      }} />;
      case 2: return <BiometricsStep 
                        weight={formData.weight} setWeight={(val) => setFormData(prev => ({...prev, weight: val}))}
                        height={formData.height} setHeight={(val) => setFormData(prev => ({...prev, height: val}))}
                     />;
      case 3: return <GoalStep value={formData.goal} onChange={(val) => { 
          setFormData(prev => ({...prev, goal: val})); 
          setTimeout(advanceStep, 50); 
      }} />;
      case 4: return <ProcessingScreen onFinish={calculatePlan} />;
      case 5: return <FinalResultStep data={formData} calculations={results} onFinish={() => navigation.replace('Home')} />;
      default: return null;
    }
  };

  return (
    <View className="flex-1 bg-white">
      <StatusBar style="dark" />
      <View style={{ flex: 1, paddingTop: STATUSBAR_HEIGHT }}>
        {step > 0 && step < 4 && (
          <View className="px-4 py-2 flex-row items-center mb-2">
            <TouchableOpacity onPress={goBack} className="w-10 h-10 bg-gray-50 rounded-full items-center justify-center border border-gray-100">
              <ChevronLeft size={24} color="#0A0A0A" />
            </TouchableOpacity>
            <View className="flex-1 mx-4 h-2 bg-gray-100 rounded-full overflow-hidden">
                <View className="h-full bg-zenitRed rounded-full" style={{ width: `${(step / 4) * 100}%` }} />
            </View>
            <View className="w-10" /> 
          </View>
        )}
        {renderContent()}
        {step === 2 && (
            <View className="px-6 pb-8 pt-2 bg-white">
                <TouchableOpacity onPress={advanceStep} className="w-full bg-zenitBlack py-5 rounded-full items-center shadow-lg shadow-black/30">
                    <Text className="text-white font-bold text-lg tracking-wide">CONTINUAR</Text>
                </TouchableOpacity>
            </View>
        )}
      </View>
    </View>
  );
}