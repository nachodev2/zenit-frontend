import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Camera, Sparkles } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';

import { ZENIT_GRADIENT } from '../../constants/theme';

export function GuidedScanCard({ onPress }) {
  return (
    <Animated.View entering={FadeInDown.delay(100).duration(450)} style={{ flex: 1 }}>
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
          <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF7ED', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 999 }}>
            <Sparkles size={11} color="#F97316" />
            <Text style={{ color: '#F97316', fontSize: 9, fontWeight: '800', marginLeft: 4, textTransform: 'uppercase', letterSpacing: 0.5 }}>
              IA Asistida
            </Text>
          </View>

          <LinearGradient
            colors={ZENIT_GRADIENT}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={{ width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center' }}
          >
            <Camera size={16} color="white" />
          </LinearGradient>
        </View>

        <View style={{ marginTop: 12 }}>
          <Text style={{ color: '#111827', fontSize: 16, fontWeight: '800', letterSpacing: -0.3 }}>
            Foto Asistida
          </Text>
          <Text style={{ color: '#9CA3AF', fontSize: 11, fontWeight: '500', marginTop: 3, lineHeight: 15 }} numberOfLines={2}>
            Foto + preguntas clave para máxima precisión.
          </Text>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
}

export default GuidedScanCard;

