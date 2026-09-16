import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Dumbbell, Flame } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';

export function GymActivityCard({ onPress }) {
  return (
    <Animated.View entering={FadeInDown.delay(150).duration(450)} style={{ flex: 1 }}>
      <TouchableOpacity
        activeOpacity={0.85}
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          onPress?.();
        }}
        style={{
          backgroundColor: 'white',
          borderRadius: 24,
          padding: 16,
          borderWidth: 1,
          borderColor: '#F3F4F6',
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.05,
          shadowRadius: 10,
          elevation: 2,
          minHeight: 148,
          justifyContent: 'space-between',
        }}
      >
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#F3E8FF', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 999 }}>
            <Flame size={11} color="#9333EA" fill="#9333EA" />
            <Text style={{ color: '#9333EA', fontSize: 9, fontWeight: '800', marginLeft: 4, textTransform: 'uppercase', letterSpacing: 0.5 }}>
              Gym & Cardio
            </Text>
          </View>

          <LinearGradient
            colors={['#A855F7', '#7C3AED']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={{ width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center' }}
          >
            <Dumbbell size={16} color="white" />
          </LinearGradient>
        </View>

        <View style={{ marginTop: 12 }}>
          <Text style={{ color: '#111827', fontSize: 16, fontWeight: '800', letterSpacing: -0.3 }}>
            Actividad Física
          </Text>
          <Text style={{ color: '#9CA3AF', fontSize: 11, fontWeight: '500', marginTop: 3, lineHeight: 15 }} numberOfLines={2}>
            Registrá tu rutina de hoy y músculos trabajados.
          </Text>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
}

export default GymActivityCard;

