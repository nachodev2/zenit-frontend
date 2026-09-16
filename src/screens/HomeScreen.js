import React, { useState } from 'react';
import { View, ScrollView } from 'react-native';
import { useUserStore } from '../store/useUserStore';
import * as Haptics from 'expo-haptics';
import { isSameDay, format, subDays, startOfDay } from 'date-fns';

import { WeekCalendar } from '../components/home/WeekCalendar';
import { FullCalendarModal } from '../components/home/FullCalendarModal';
import { MacroAdjustmentModal } from '../components/home/MacroAdjustmentModal';
import { MacrosCard } from '../components/home/MacrosCard';
import { VisualGallery } from '../components/home/VisualGallery';

// Componentes del nuevo Tablero 2x2 y Cards Principales
import { GuidedScanCard } from '../components/home/GuidedScanCard';
import { GymActivityCard } from '../components/home/GymActivityCard';
import { WaterTrackerCard } from '../components/home/WaterTrackerCard';
import { SmartHealthCard } from '../components/home/SmartHealthCard';
import { WeightHeroCard } from '../components/home/WeightHeroCard';

export default function HomeScreen({ navigation }) {
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [isModalVisible, setModalVisible] = useState(false);
    const [isCalendarModalVisible, setCalendarModalVisible] = useState(false);

    // HACK TEMPORAL PARA PROBAR LA RACHA (3 días seguidos cumplidos)
    React.useEffect(() => {
        useUserStore.setState({ 
            createdAt: new Date(2026, 8, 1).toISOString(),
            history: {
                "2026-09-01": { status: "success", consumed: { calories: 1596, protein: 171, carbs: 122, fats: 49 } },
                "2026-09-02": { status: "success", consumed: { calories: 1650, protein: 173, carbs: 125, fats: 54 } },
                "2026-09-03": { status: "success", consumed: { calories: 1696, protein: 176, carbs: 127, fats: 54 } }
            }
        });
    }, []);

    const targetMacros = useUserStore((state) => state.targetMacros);
    const consumedMacros = useUserStore((state) => state.consumedMacros);
    const history = useUserStore((state) => state.history);
    const updateTargetMacros = useUserStore((state) => state.updateMacros); 

    // Selectores del Store para Hidratación, Peso y Dispositivos
    const dailyWater = useUserStore((state) => state.dailyWater);
    const getDailyWater = useUserStore((state) => state.getDailyWater);
    const addWater = useUserStore((state) => state.addWater);
    const setWater = useUserStore((state) => state.setWater);
    const setWaterTarget = useUserStore((state) => state.setWaterTarget);

    const weightTracker = useUserStore((state) => state.weightTracker);
    const logWeight = useUserStore((state) => state.logWeight);
    const smartDevice = useUserStore((state) => state.smartDevice);
    const setSmartDevice = useUserStore((state) => state.setSmartDevice);

    const activeWater = getDailyWater ? getDailyWater() : { amountMl: 0, targetMl: 2500 };

    const isCurrentDay = isSameDay(selectedDate, new Date());
    const dateKey = format(selectedDate, 'yyyy-MM-dd');
    const pastData = history[dateKey];

    const activeConsumed = isCurrentDay 
        ? consumedMacros 
        : (pastData?.consumed || { calories: 0, protein: 0, carbs: 0, fats: 0 });

    const calRemaining = targetMacros.calories - activeConsumed.calories;
    const protRemaining = targetMacros.protein - activeConsumed.protein;
    const carbRemaining = targetMacros.carbs - activeConsumed.carbs;
    const fatRemaining = targetMacros.fats - activeConsumed.fats;

    const getReversePercentage = (remaining, target) => {
        if (!target || target === 0) return 0;
        if (remaining <= 0) return 1; 
        return Math.min(1, Math.max(0, remaining / target));
    };

    const getStatus = (remaining, type, isToday) => {
        const margin = type === 'calories' ? 100 : 5; 
        if (remaining < -margin) return 'danger';    
        if (Math.abs(remaining) <= margin) return 'success'; 
        return isToday ? 'normal' : 'warning'; 
    };

    const dashboardStats = {
        target: targetMacros,
        consumed: activeConsumed,
        calories: { remaining: calRemaining, pct: getReversePercentage(calRemaining, targetMacros.calories), status: getStatus(calRemaining, 'calories', isCurrentDay) },
        protein: { remaining: protRemaining, pct: getReversePercentage(protRemaining, targetMacros.protein), status: getStatus(protRemaining, 'macros', isCurrentDay) },
        carbs: { remaining: carbRemaining, pct: getReversePercentage(carbRemaining, targetMacros.carbs), status: getStatus(carbRemaining, 'macros', isCurrentDay) },
        fats: { remaining: fatRemaining, pct: getReversePercentage(fatRemaining, targetMacros.fats), status: getStatus(fatRemaining, 'macros', isCurrentDay) },
    };

    const overallDayStatus = (!isCurrentDay) ? (pastData ? getStatus(calRemaining, 'calories', false) : 'unlogged') : null;

    // --- LÓGICA DE RACHA (STREAK) ---
    const calculateStreak = () => {
        let currentStreak = 0;
        let dayToCheck = startOfDay(new Date());
        
        const todayKey = format(dayToCheck, 'yyyy-MM-dd');
        if (history[todayKey]?.status === 'success') {
            currentStreak++;
        }
        
        dayToCheck = subDays(dayToCheck, 1);

        while (true) {
            const checkKey = format(dayToCheck, 'yyyy-MM-dd');
            const dayData = history[checkKey];
            if (dayData && dayData.status === 'success') {
                currentStreak++;
                dayToCheck = subDays(dayToCheck, 1);
            } else {
                break;
            }
        }
        return currentStreak;
    };
    const streakCount = calculateStreak();

    return (
        <View className="flex-1 bg-white">
            <WeekCalendar selectedDate={selectedDate} onSelectDate={setSelectedDate} onOpenCalendar={() => setCalendarModalVisible(true)} />
            <FullCalendarModal visible={isCalendarModalVisible} onClose={() => setCalendarModalVisible(false)} selectedDate={selectedDate} onSelectDate={setSelectedDate} />
            <MacroAdjustmentModal visible={isModalVisible} onClose={() => setModalVisible(false)} currentStats={targetMacros} onSave={(newTargets) => { updateTargetMacros(newTargets); setModalVisible(false); }} />

            <ScrollView className="flex-1 px-6" showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 120 }}>
                <MacrosCard 
                    stats={dashboardStats} 
                    onOpenModal={() => setModalVisible(true)} 
                    isReadOnly={!isCurrentDay}
                    pastStatus={overallDayStatus} 
                    streak={streakCount} 
                    dateKey={dateKey}
                />
                
                {/* CARD DE PROGRESO: REGISTRO DE PESO (ARRIBA DEL TABLERO) */}
                {isCurrentDay && (
                    <WeightHeroCard 
                        weightTracker={weightTracker}
                        onPress={() => navigation?.navigate?.('WeightTracker')}
                    />
                )}
                
                {/* TABLERO MODULAR 2x2 (Solo visible en el día actual) */}
                {isCurrentDay && (
                    <View style={{ marginTop: 20, gap: 14 }}>
                        {/* Fila 1: Nutrición Asistida & Entrenamiento */}
                        <View style={{ flexDirection: 'row', gap: 14 }}>
                            <GuidedScanCard onPress={() => navigation?.navigate?.('GuidedScan')} />
                            <GymActivityCard onPress={() => navigation?.navigate?.('Gym')} />
                        </View>

                        {/* Fila 2: Hidratación & Peso / Smart Health */}
                        <View style={{ flexDirection: 'row', gap: 14 }}>
                            <WaterTrackerCard 
                                amountMl={activeWater.amountMl}
                                targetMl={activeWater.targetMl}
                                onPress={() => navigation?.navigate?.('WaterTracker')}
                            />
                            <SmartHealthCard 
                                weightKg={weightTracker?.currentWeightKg}
                                muscleMassKg={weightTracker?.muscleMassKg}
                                smartDevice={smartDevice}
                                onPress={() => navigation?.navigate?.('WeightTracker')}
                            />
                        </View>
                    </View>
                )}
                
                <VisualGallery />
            </ScrollView>
        </View>
    );
}