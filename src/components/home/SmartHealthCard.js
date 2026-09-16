import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Scale, Bluetooth, Watch, ChevronRight } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';

export function SmartHealthCard({
  weightKg = 74.8,
  muscleMassKg = 35.2,
  smartDevice = null,
  onPress,
}) {
  const isConnected = smartDevice?.connected;

  return (
    <Animated.View entering={FadeInDown.delay(250).duration(450)} style={{ flex: 1 }}>
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
          minHeight: 154,
          justifyContent: 'space-between',
        }}
      >
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: isConnected ? '#ECFDF5' : '#F3F4F6', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 999 }}>
            {isConnected ? (
              <Watch size={11} color="#059669" />
            ) : (
              <Bluetooth size={11} color="#6B7280" />
            )}
            <Text
              style={{
                color: isConnected ? '#059669' : '#6B7280',
                fontSize: 9,
                fontWeight: '800',
                marginLeft: 4,
                textTransform: 'uppercase',
                letterSpacing: 0.5,
              }}
            >
              {isConnected ? smartDevice?.deviceName || 'Báscula BT' : 'Smart Hub'}
            </Text>
          </View>

          <LinearGradient
            colors={['#10B981', '#059669']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={{ width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center' }}
          >
            <Scale size={16} color="white" />
          </LinearGradient>
        </View>

        <View style={{ marginTop: 10 }}>
          <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 3 }}>
            <Text style={{ color: '#111827', fontSize: 20, fontWeight: '900', letterSpacing: -0.5 }}>
              {weightKg ? Number(weightKg).toFixed(1) : '--'}
            </Text>
            <Text style={{ color: '#9CA3AF', fontSize: 12, fontWeight: '700' }}>
              kg
            </Text>
          </View>

          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 4 }}>
            <Text style={{ color: '#059669', fontSize: 11, fontWeight: '700' }}>
              {muscleMassKg ? `Masa: ${Number(muscleMassKg).toFixed(1)} kg` : 'Registrar pesaje'}
            </Text>
            <ChevronRight size={13} color="#9CA3AF" />
          </View>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
}

export default SmartHealthCard;

