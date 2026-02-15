import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { format, addDays, startOfWeek, isSameDay } from 'date-fns';
import { es } from 'date-fns/locale'; // Para que salga "L", "M", "X" en español
import { LinearGradient } from 'expo-linear-gradient';
import { ChevronDown, Calendar as CalendarIcon } from 'lucide-react-native';
import { ZENIT_GRADIENT } from '../../constants/theme'; // Asegúrate que la ruta sea correcta

export const WeekCalendar = ({ selectedDate, onSelectDate, onOpenCalendar }) => {
    const [weekDays, setWeekDays] = useState([]);

    useEffect(() => {
        // 1. Obtenemos el inicio de la semana (Lunes = 1)
        // Si quisieras que empiece en Domingo, usa weekStartsOn: 0
        const start = startOfWeek(selectedDate, { weekStartsOn: 1 });
        
        // 2. Generamos los 7 días a partir del lunes
        const days = [];
        for (let i = 0; i < 7; i++) {
            days.push(addDays(start, i));
        }
        setWeekDays(days);
    }, [selectedDate]);

    // Formato del Mes y Año (ej: "Febrero 2026")
    const monthLabel = format(selectedDate, 'MMMM yyyy', { locale: es });
    // Capitalizar primera letra
    const formattedTitle = monthLabel.charAt(0).toUpperCase() + monthLabel.slice(1);

    return (
        <View className="pt-12 pb-4 px-4 bg-white z-10">
            {/* --- HEADER: MES + TRIGGER CALENDARIO --- */}
            <View className="flex-row items-center justify-between mb-6 px-2">
                <View>
                    <Text className="text-gray-400 font-bold text-xs uppercase tracking-widest mb-1">
                        Tu Calendario
                    </Text>
                    <TouchableOpacity 
                        className="flex-row items-center"
                        onPress={onOpenCalendar} // Aquí abriremos el Modal
                    >
                        <Text className="text-3xl font-black text-zenitBlack mr-2">
                            {formattedTitle}
                        </Text>
                        <ChevronDown size={24} color="#D4D4D8" />
                    </TouchableOpacity>
                </View>

                {/* Botón visual extra (opcional) */}
                <TouchableOpacity 
                    onPress={onOpenCalendar}
                    className="w-10 h-10 bg-gray-50 rounded-full items-center justify-center border border-gray-100"
                >
                     <CalendarIcon size={20} color="#0A0A0A" />
                </TouchableOpacity>
            </View>

            {/* --- TIRA DE DÍAS (L M M J V S D) --- */}
            <View className="flex-row justify-between bg-gray-50/50 p-2 rounded-[24px]">
                {weekDays.map((day, index) => {
                    const isSelected = isSameDay(day, selectedDate);
                    const isToday = isSameDay(day, new Date());
                    
                    // Letra del día (L, M, M...)
                    const dayLetter = format(day, 'EEEEE', { locale: es }).toUpperCase();
                    // Número del día (14, 15...)
                    const dayNumber = format(day, 'd');

                    return (
                        <TouchableOpacity
                            key={index}
                            onPress={() => onSelectDate(day)}
                            activeOpacity={0.7}
                            className="items-center justify-center"
                            style={{ width: 44 }} // Ancho fijo para alineación
                        >
                            {/* Contenedor del Número (Con Gradiente si está activo) */}
                            {isSelected ? (
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
                            ) : (
                                <View className="w-11 h-14 rounded-2xl items-center justify-center bg-transparent">
                                    <Text className={`text-[10px] font-bold mb-0.5 ${isToday ? 'text-zenitRed' : 'text-gray-400'}`}>
                                        {dayLetter}
                                    </Text>
                                    <Text className={`text-lg font-bold ${isToday ? 'text-zenitBlack' : 'text-gray-600'}`}>
                                        {dayNumber}
                                    </Text>
                                    
                                    {/* Indicador de "Hoy" (Puntito) */}
                                    {isToday && (
                                        <View className="w-1 h-1 bg-zenitRed rounded-full absolute bottom-1" />
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