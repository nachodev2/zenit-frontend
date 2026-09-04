import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { format, addDays, startOfWeek, isSameDay, isAfter, isBefore, startOfDay } from 'date-fns';
import { es } from 'date-fns/locale'; 
import { LinearGradient } from 'expo-linear-gradient';
import { ChevronDown, Calendar as CalendarIcon } from 'lucide-react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { ZENIT_GRADIENT } from '../../constants/theme'; 
import { useUserStore } from '../../store/useUserStore';

export const WeekCalendar = ({ selectedDate, onSelectDate, onOpenCalendar }) => {
    const [weekDays, setWeekDays] = useState([]);
    
    const createdAtString = useUserStore(state => state.createdAt);
    const history = useUserStore(state => state.history); 
    
    const accountCreatedAt = createdAtString ? startOfDay(new Date(createdAtString)) : startOfDay(new Date());
    const today = startOfDay(new Date());

    useEffect(() => {
        const start = startOfWeek(selectedDate, { weekStartsOn: 1 });
        const days = [];
        for (let i = 0; i < 7; i++) {
            days.push(addDays(start, i));
        }
        setWeekDays(days);
    }, [selectedDate]);

    const monthLabel = format(selectedDate, 'MMMM yyyy', { locale: es });
    const formattedTitle = monthLabel.charAt(0).toUpperCase() + monthLabel.slice(1);

    return (
        <View className="pt-12 pb-4 px-4 bg-white z-10">
            <View className="flex-row items-center justify-between mb-6 px-2">
                <View className="flex-1 pr-4">
                    <Text className="text-gray-400 font-bold text-xs uppercase tracking-widest mb-1">
                        Tu Calendario
                    </Text>
                    <TouchableOpacity 
                        className="flex-row items-center"
                        onPress={onOpenCalendar} 
                    >
                        <Text 
                            className="text-3xl font-black text-zenitBlack mr-2"
                            numberOfLines={1} 
                            adjustsFontSizeToFit
                        >
                            {formattedTitle}
                        </Text>
                        <ChevronDown size={24} color="#D4D4D8" />
                    </TouchableOpacity>
                </View>

                <TouchableOpacity 
                    onPress={onOpenCalendar}
                    className="w-10 h-10 bg-gray-50 rounded-full items-center justify-center border border-gray-100"
                >
                     <CalendarIcon size={20} color="#0A0A0A" />
                </TouchableOpacity>
            </View>

            <View className="flex-row justify-between bg-gray-50/50 p-2 rounded-[24px]">
                {weekDays.map((day, index) => {
                    const isSelected = isSameDay(day, selectedDate);
                    const isToday = isSameDay(day, today);
                    
                    const isFuture = isAfter(day, today);
                    const isBeforeCreation = isBefore(day, accountCreatedAt);
                    const isDisabled = isFuture || isBeforeCreation;
                    
                    const dayLetter = format(day, 'EEEEE', { locale: es }).toUpperCase();
                    const dayNumber = format(day, 'd');
                    
                    const dateKey = format(day, 'yyyy-MM-dd');
                    const dayHistory = history[dateKey];

                    // --- LÓGICA DE 3 COLORES ---
                    let textColor = 'text-gray-600';
                    let dotColor = null;

                    if (isDisabled) {
                        textColor = 'text-gray-300';
                    } else if (isToday) {
                        textColor = 'text-zenitBlack';
                        dotColor = 'bg-zenitRed';
                    } else if (dayHistory?.status) {
                        if (dayHistory.status === 'success') {
                            textColor = 'text-green-500';
                            dotColor = 'bg-green-500';
                        } else if (dayHistory.status === 'danger') {
                            textColor = 'text-red-500';
                            dotColor = 'bg-red-500';
                        } else if (dayHistory.status === 'warning') {
                            textColor = 'text-amber-500';
                            dotColor = 'bg-amber-500';
                        }
                    }

                    return (
                        <TouchableOpacity
                            key={index}
                            onPress={() => {
                                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                                onSelectDate(day);
                            }}
                            activeOpacity={0.7}
                            disabled={isDisabled} 
                            className="items-center justify-center"
                            style={{ width: 44 }} 
                        >
                            {isSelected ? (
                                <Animated.View entering={FadeIn.duration(150)}>
                                    <LinearGradient
                                        colors={ZENIT_GRADIENT}
                                        className="w-11 h-14 rounded-2xl items-center justify-center shadow-sm shadow-orange-200"
                                    >
                                        <Text className="text-white/70 text-[10px] font-bold mb-0.5">
                                            {dayLetter}
                                        </Text>
                                        <Text className="text-white text-lg font-black">
                                            {dayNumber}
                                        </Text>
                                    </LinearGradient>
                                </Animated.View>
                            ) : (
                                <View className="w-11 h-14 rounded-2xl items-center justify-center bg-transparent">
                                    <Text className={`text-[10px] font-bold mb-0.5 ${isDisabled ? 'text-gray-300' : 'text-gray-400'}`}>
                                        {dayLetter}
                                    </Text>
                                    <Text className={`text-lg font-bold ${textColor}`}>
                                        {dayNumber}
                                    </Text>
                                    
                                    {dotColor && (
                                        <View className={`w-1 h-1 rounded-full absolute bottom-1 ${dotColor}`} />
                                    )}
                                </View>
                            )}
                        </TouchableOpacity>
                    );
                })}
            </View>
        </View>
    );
};