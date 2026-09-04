import React, { useState, useEffect } from 'react';
import { View, Text, Modal, TouchableOpacity, TouchableWithoutFeedback } from 'react-native';
import { ChevronLeft, ChevronRight, X } from 'lucide-react-native';
import Animated, { FadeIn, SlideInDown, Easing } from 'react-native-reanimated';
import { format, addMonths, subMonths, startOfMonth, startOfWeek, addDays, isSameMonth, isSameDay, isAfter, isBefore, startOfDay } from 'date-fns';
import { es } from 'date-fns/locale';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { ZENIT_GRADIENT } from '../../constants/theme';
import { useUserStore } from '../../store/useUserStore';

export const FullCalendarModal = ({ visible, onClose, selectedDate, onSelectDate }) => {
    const [currentMonth, setCurrentMonth] = useState(selectedDate);
    
    const createdAtString = useUserStore(state => state.createdAt);
    const history = useUserStore(state => state.history);
    
    const accountCreatedAt = createdAtString ? startOfDay(new Date(createdAtString)) : startOfDay(new Date());
    const today = startOfDay(new Date());

    useEffect(() => {
        if (visible) setCurrentMonth(selectedDate);
    }, [visible, selectedDate]);

    const nextMonth = () => {
        Haptics.selectionAsync();
        setCurrentMonth(addMonths(currentMonth, 1));
    };
    
    const prevMonth = () => {
        Haptics.selectionAsync();
        setCurrentMonth(subMonths(currentMonth, 1));
    };

    const renderHeader = () => {
        const monthLabel = format(currentMonth, 'MMMM yyyy', { locale: es });
        const formattedTitle = monthLabel.charAt(0).toUpperCase() + monthLabel.slice(1);
        
        const isCurrentMonth = isSameMonth(currentMonth, today);
        const isBeforeCreationMonth = isBefore(subMonths(currentMonth, 1), startOfMonth(accountCreatedAt));

        return (
            <View className="flex-row justify-between items-center mb-6">
                <TouchableOpacity 
                    onPress={prevMonth} 
                    disabled={isBeforeCreationMonth}
                    className={`p-2 rounded-full ${isBeforeCreationMonth ? 'bg-transparent' : 'bg-gray-50'}`}
                >
                    <ChevronLeft size={24} color={isBeforeCreationMonth ? "transparent" : "#0A0A0A"} />
                </TouchableOpacity>
                
                <Text 
                    className="text-xl font-black text-zenitBlack text-center flex-1 mx-2"
                    numberOfLines={1}
                    adjustsFontSizeToFit
                >
                    {formattedTitle}
                </Text>
                
                <TouchableOpacity 
                    onPress={nextMonth} 
                    disabled={isCurrentMonth}
                    className={`p-2 rounded-full ${isCurrentMonth ? 'bg-transparent' : 'bg-gray-50'}`}
                >
                    <ChevronRight size={24} color={isCurrentMonth ? "transparent" : "#0A0A0A"} />
                </TouchableOpacity>
            </View>
        );
    };

    const renderDays = () => {
        const days = ['L', 'M', 'M', 'J', 'V', 'S', 'D'];
        return (
            <View className="flex-row justify-between mb-4 px-2">
                {days.map((day, i) => (
                    <Text key={i} className="text-gray-400 font-bold text-xs w-8 text-center">{day}</Text>
                ))}
            </View>
        );
    };

    const renderCells = () => {
        const monthStart = startOfMonth(currentMonth);
        const startDate = startOfWeek(monthStart, { weekStartsOn: 1 });

        const rows = [];
        let day = startDate;

        for (let i = 0; i < 6; i++) {
            let days = [];
            for (let j = 0; j < 7; j++) {
                const formattedDate = format(day, 'd');
                const cloneDay = day;
                const isSelected = isSameDay(day, selectedDate);
                const isToday = isSameDay(day, today);
                
                const isFuture = isAfter(day, today);
                const isBeforeCreation = isBefore(day, accountCreatedAt);
                const isDisabled = isFuture || isBeforeCreation;
                const isCurrentMonthDay = isSameMonth(day, monthStart);

                const dateKey = format(day, 'yyyy-MM-dd');
                const dayHistory = history[dateKey];
                
                // --- LÓGICA DE 3 COLORES ---
                let textColor = 'text-gray-600';
                let dotColor = null;

                if (isDisabled) {
                    textColor = 'text-gray-300';
                } else if (isToday) {
                    textColor = 'text-zenitRed';
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

                days.push(
                    <TouchableOpacity
                        key={day.toISOString()}
                        disabled={isDisabled}
                        activeOpacity={0.7}
                        onPress={() => {
                            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                            onSelectDate(cloneDay);
                            onClose();
                        }}
                        className={`w-10 h-10 items-center justify-center rounded-full mx-0.5 mb-2 ${
                            !isCurrentMonthDay ? 'opacity-30' : ''
                        }`}
                    >
                        {isSelected ? (
                            <Animated.View entering={FadeIn.duration(150)}>
                                <LinearGradient
                                    colors={ZENIT_GRADIENT}
                                    className="w-10 h-10 rounded-full items-center justify-center shadow-sm shadow-orange-200"
                                >
                                    <Text className="text-white font-bold">{formattedDate}</Text>
                                </LinearGradient>
                            </Animated.View>
                        ) : (
                            <View className="w-full h-full rounded-full items-center justify-center">
                                <Text className={`font-bold ${textColor}`}>
                                    {formattedDate}
                                </Text>
                                {dotColor && !isSelected && (
                                    <View className={`w-1 h-1 rounded-full absolute bottom-1 ${dotColor}`} />
                                )}
                            </View>
                        )}
                    </TouchableOpacity>
                );
                day = addDays(day, 1);
            }
            rows.push(
                <View className="flex-row justify-between w-full" key={`row-${i}`}>
                    {days}
                </View>
            );
        }
        
        return (
            <Animated.View key={currentMonth.toISOString()} entering={FadeIn.duration(200)}>
                {rows}
            </Animated.View>
        );
    };

    return (
        <Modal animationType="fade" transparent={true} visible={visible} onRequestClose={onClose}>
            <View className="flex-1 bg-black/50 justify-end">
                <TouchableWithoutFeedback onPress={onClose}>
                    <View className="absolute inset-0 w-full h-full" />
                </TouchableWithoutFeedback>
                
                <Animated.View 
                    entering={SlideInDown.duration(400).easing(Easing.out(Easing.cubic))}
                    className="bg-white rounded-t-[32px] p-8 pb-12 shadow-xl"
                >
                    <View className="flex-row justify-between items-center mb-4">
                        <Text className="text-lg font-bold text-gray-400 uppercase tracking-widest">
                            Historial
                        </Text>
                        <TouchableOpacity onPress={onClose} className="bg-gray-50 p-2 rounded-full">
                            <X size={20} color="#9CA3AF" />
                        </TouchableOpacity>
                    </View>
                    
                    {renderHeader()}
                    {renderDays()}
                    {renderCells()}
                </Animated.View>
            </View>
        </Modal>
    );
};