import React from 'react';
import { View } from 'react-native';
import Animated, { FadeInDown, Easing } from 'react-native-reanimated';
import { SelectionCard } from '../../ui/SelectionCard'; 

export const SelectionStep = ({ 
    title, 
    subtitle, 
    options,
    value, 
    onChange 
}) => {
  return (
    // FIX MAESTRO: Eliminamos 'entering={FadeIn...}' de aquí.
    // Al quitarlo, el contenedor blanco carga instantáneo. 
    // Como tu tarjeta seleccionada tampoco tiene animación, aparecerá SÓLIDA de inmediato.
    // Adiós al efecto de "naranja desvanecido" que parecía un flash blanco.
    <View className="flex-1 px-6 pt-8 bg-white">
      {/* TÍTULO (Sigue animado) */}
      <Animated.Text 
          entering={FadeInDown.duration(500).easing(Easing.out(Easing.cubic))} 
          className="text-zenitBlack text-4xl font-black tracking-tight mb-2">
          {title}
      </Animated.Text>
      
      {/* SUBTÍTULO (Sigue animado) */}
      <Animated.Text 
          entering={FadeInDown.delay(100).duration(500).easing(Easing.out(Easing.cubic))} 
          className="text-gray-500 text-lg mb-12 font-medium">
          {subtitle}
      </Animated.Text>
      
      {/* LISTA DE OPCIONES */}
      <View className="gap-y-3"> 
        {options.map((opt, index) => (
            <SelectionCard 
                key={opt.id || opt.title} 
                variant="list" 
                index={index} 
                title={opt.title} 
                subtitle={opt.desc} 
                emoji={opt.emoji}
                icon={opt.icon}
                selected={value === (opt.id || opt.title)} 
                onPress={() => onChange(opt.id || opt.title)}
            />
        ))}
      </View>
    </View>
  );
};