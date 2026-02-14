import './global.css';
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Home, Search, ScanLine, Dumbbell, Cog } from 'lucide-react-native';

// Screens existentes
import HomeScreen from './src/screens/HomeScreen';
import DiarioScreen from './src/screens/DiarioScreen.js';
import ScannerScreen from './src/screens/ScanScreen.js';
import GymScreen from './src/screens/GymScreen';
import ConfigScreen from './src/screens/ConfigScreen';
import ExerciseDetailScreen from './src/screens/ExerciseDetailScreen';

// --- NUEVO: Importamos el Onboarding ---
import OnboardingScreen from './src/screens/OnboardingScreen'; 

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

function TabNavigator() {
  return (
    <Tab.Navigator
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
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{
          tabBarIcon: ({ color }) => <Home size={26} color={color} strokeWidth={1.5} />,
        }}
      />
      <Tab.Screen
        name="Diario"
        component={DiarioScreen}
        options={{
          tabBarIcon: ({ color }) => <Search size={26} color={color} strokeWidth={1.5} />,
        }}
      />
      <Tab.Screen
        name="Scanner"
        component={ScannerScreen}
        options={{
          tabBarStyle: { display: 'none' }, // Oculta la barra en esta pantalla
          tabBarIcon: () => (
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
      <Tab.Screen
        name="Gym"
        component={GymScreen}
        options={{
          tabBarIcon: ({ color }) => <Dumbbell size={26} color={color} strokeWidth={1.5} />,
        }}
      />
      <Tab.Screen
        name="Config"
        component={ConfigScreen}
        options={{
          tabBarIcon: ({ color }) => <Cog size={26} color={color} strokeWidth={1.5} />,
        }}
      />
    </Tab.Navigator>
  );
}

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <StatusBar style="auto" />
        <NavigationContainer>
          <Stack.Navigator 
            // CAMBIO CLAVE: Arrancamos por el Onboarding
            initialRouteName="Onboarding" 
            screenOptions={{ headerShown: false }}
          >
            {/* Agregamos la pantalla de Onboarding al Stack */}
            <Stack.Screen name="Onboarding" component={OnboardingScreen} />

            {/* Pantalla principal (Tabs) */}
            <Stack.Screen name="Main" component={TabNavigator} />
            
            {/* Detalles */}
            <Stack.Screen name="ExerciseDetail" component={ExerciseDetailScreen} />
          </Stack.Navigator>
        </NavigationContainer>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}