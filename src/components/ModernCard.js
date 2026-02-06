import React from 'react';
import { Text, Pressable, View } from 'react-native';
import { MotiView } from 'moti';
import { Sparkles } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';

export default function ModernCard() {
  
  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    console.log("Presionado");
  };

  return (
    <Pressable onPress={handlePress}>
      <MotiView
        from={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ type: 'timing', duration: 500 }}
        style={{
          backgroundColor: 'white',
          padding: 20,
          borderRadius: 24,
          flexDirection: 'row',
          alignItems: 'center',
          marginVertical: 8,
          marginHorizontal: 16,
          borderWidth: 1,
          borderColor: '#f3f4f6',
        }}
      >
        <View style={{ backgroundColor: '#eff6ff', padding: 12, borderRadius: 16 }}>
          <Sparkles color="#3b82f6" size={24} />
        </View>

        <View style={{ flex: 1, marginLeft: 16 }}>
          <Text style={{ color: '#111827', fontWeight: 'bold', fontSize: 18 }}>
            Nuevo Diseño
          </Text>
          <Text style={{ color: '#6b7280', fontSize: 14, marginTop: 4 }}>
            Usando tu stack al máximo
          </Text>
        </View>
      </MotiView>
    </Pressable>
  );
}