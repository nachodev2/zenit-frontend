import { Tabs } from 'expo-router';
import { View } from 'react-native';
import { Home, Search, ScanLine, Dumbbell, Cog } from 'lucide-react-native';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: false,
        tabBarStyle: {
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          elevation: 0,
          backgroundColor: '#ffffff',
          height: 90,
          paddingTop: 15,
          paddingBottom: 25,
          borderTopWidth: 1,
          borderTopColor: '#e5e5e5',
        },
        tabBarActiveTintColor: '#3b82f6',
        tabBarInactiveTintColor: '#9CA3AF',
        tabBarItemStyle: {
          paddingTop: 8,
        },
      }}
    >
      {/* 1. HOME */}
      <Tabs.Screen
        name="index"
        options={{
          tabBarIcon: ({ color }) => <Home size={26} color={color} strokeWidth={1.5} />,
        }}
      />

      {/* 2. BÚSQUEDA */}
      <Tabs.Screen
        name="diario"
        options={{
          tabBarIcon: ({ color }) => <Search size={26} color={color} strokeWidth={1.5} />,
        }}
      />

      {/* 3. SCANNER (Botón central azul) */}
      <Tabs.Screen
        name="scanner"
        options={{
          tabBarIcon: ({ focused }) => (
            <View
              style={{
                width: 65,
                height: 65,
                borderRadius: 32.5,
                backgroundColor: '#3b82f6',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: 30,
                borderWidth: 4,
                borderColor: '#ffffff',
                shadowColor: '#3b82f6',
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.35,
                shadowRadius: 10,
                elevation: 10,
              }}
            >
              <ScanLine size={28} color="white" strokeWidth={2} />
            </View>
          ),
        }}
      />

      {/* 4. EJERCICIOS */}
      <Tabs.Screen
        name="Ejercicios"
        options={{
          tabBarIcon: ({ color }) => <Dumbbell size={26} color={color} strokeWidth={1.5} />,
        }}
      />

      {/* 5. CONFIGURACIÓN */}
      <Tabs.Screen
        name="configuraciones"
        options={{
          tabBarIcon: ({ color }) => <Cog size={26} color={color} strokeWidth={1.5} />,
        }}
      />

      {/* Ocultar GymScreen */}
      <Tabs.Screen
        name="GymScreen"
        options={{
          href: null,
        }}
      />
    </Tabs>
  );
}