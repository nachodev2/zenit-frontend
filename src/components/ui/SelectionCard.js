import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import Animated, { FadeInDown, Easing } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { ZENIT_GRADIENT } from '../../constants/theme';

export const SelectionCard = ({ 
    selected, 
    onPress, 
    title, 
    subtitle, 
    icon: Icon, 
    emoji, 
    style, 
    index = 0,
    variant = 'list' 
}) => {
    const isGrid = variant === 'grid';
    const cardHeight = isGrid ? {} : { height: 110 };

    const layoutClasses = isGrid 
        ? "flex-col justify-between" 
        : "flex-row items-center justify-between";

    const iconContainerStyles = isGrid 
        ? "absolute bottom-4 right-4 w-10 h-10" 
        : "w-12 h-12 ml-3";

    return (
        <Animated.View 
            // Si está seleccionado, NO animamos (undefined). Aparece sólido al instante.
            entering={selected ? undefined : FadeInDown.delay(100 + (index * 50)).duration(500).easing(Easing.out(Easing.cubic))} 
            style={[{ width: '100%', marginBottom: isGrid ? 0 : 12 }, style]} 
        >
            <TouchableOpacity 
                onPress={onPress}
                activeOpacity={0.9}
                style={[
                    styles.cardBase, 
                    cardHeight,
                    selected ? styles.selectedStyle : styles.unselectedStyle
                ]}
            >
                {selected ? (
                    <LinearGradient 
                        colors={ZENIT_GRADIENT} 
                        start={{ x: 0, y: 0 }} 
                        end={{ x: 1, y: 1 }} 
                        className={`p-6 h-full ${layoutClasses}`}
                        // FIX EXTRA: Forzamos el color de fondo en el gradiente también.
                        // Si el gradiente tarda 10ms en cargar, se verá naranja sólido, nunca blanco.
                        style={{ backgroundColor: '#F97316' }} 
                    >
                        <View className={isGrid ? "w-full" : "flex-1"}>
                            <Text 
                                className={`font-bold text-white mb-1 leading-6 ${isGrid ? 'text-2xl' : 'text-xl'}`} 
                                numberOfLines={2} 
                                adjustsFontSizeToFit
                            >
                                {title}
                            </Text>
                            {subtitle && (
                                <Text className="text-sm font-medium text-white/90 leading-5" numberOfLines={2}>
                                    {subtitle}
                                </Text>
                            )}
                        </View>

                        {(Icon || emoji) && (
                            <View 
                                className={`rounded-full items-center justify-center ${iconContainerStyles}`}
                                style={styles.iconBackgroundSelected}
                            >
                                {Icon ? (
                                    <Icon size={isGrid ? 20 : 24} color="white" />
                                ) : (
                                    <Text className={isGrid ? "text-xl" : "text-2xl"}>{emoji}</Text>
                                )}
                            </View>
                        )}
                    </LinearGradient>
                ) : (
                    <View className={`p-6 h-full ${layoutClasses}`}>
                        <View className={isGrid ? "w-full" : "flex-1"}>
                            <Text 
                                className={`font-bold text-[#0A0A0A] mb-1 leading-6 ${isGrid ? 'text-2xl' : 'text-xl'}`} 
                                numberOfLines={2} 
                                adjustsFontSizeToFit
                            >
                                {title}
                            </Text>
                            {subtitle && (
                                <Text className="text-sm font-medium text-gray-400 leading-5" numberOfLines={2}>
                                    {subtitle}
                                </Text>
                            )}
                        </View>

                        {(Icon || emoji) && (
                            <View className={`bg-gray-50 rounded-full items-center justify-center ${iconContainerStyles}`}>
                                {Icon ? (
                                    <Icon size={isGrid ? 20 : 24} color="#0A0A0A" />
                                ) : (
                                    <Text className={isGrid ? "text-xl" : "text-2xl"}>{emoji}</Text>
                                )}
                            </View>
                        )}
                    </View>
                )}
            </TouchableOpacity>
        </Animated.View>
    );
};

const styles = StyleSheet.create({
    cardBase: {
        borderRadius: 24, 
        overflow: 'hidden', 
        // SIN COLOR DE FONDO AQUÍ. Esto evita que pinte blanco antes de saber qué es.
    },
    selectedStyle: {
        borderWidth: 0,
        backgroundColor: '#F97316', // Naranja base inmediato
        shadowColor: '#F97316',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 4, 
    },
    unselectedStyle: {
        backgroundColor: '#FFFFFF', // El blanco solo se aplica si NO está seleccionado
        borderWidth: 1.5,
        borderColor: '#E5E7EB',
        elevation: 0, 
    },
    iconBackgroundSelected: {
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
    }
});