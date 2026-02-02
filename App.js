import React from 'react';
import { View, Text } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { StatusBar } from 'expo-status-bar';
import { Home } from 'lucide-react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import OnboardingScreen from './src/screens/OnboardingScreen';

// --- PANTALLA HOME PROVISIONAL ---
function HomeScreen() {
  return (
    <View className="flex-1 items-center justify-center bg-zenitWhite dark:bg-zenitBlack">
      <Text className="text-zenitRed text-3xl font-bold">Dashboard Zenit</Text>
      <Text className="text-gray-500 dark:text-zenitTextMuted mt-2">Modo Claro por Defecto ☀️</Text>
      <StatusBar style="auto" />
    </View>
  );
}

// --- CONFIGURACIÓN DE NAVEGACIÓN ---
const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();


function MainAppTabs() {
  return (
    <Tab.Navigator 
      screenOptions={{
        headerShown: false,
        tabBarStyle: { 
          backgroundColor: '#0A0A0A',
          borderTopColor: '#171717',
          height: 60,
          paddingBottom: 10,
          paddingTop: 10
        },
        tabBarActiveTintColor: '#DC2626',
        tabBarInactiveTintColor: '#666',
        tabBarShowLabel: false,
      }}
    >
      <Tab.Screen 
        name="Dashboard" 
        component={HomeScreen} 
        options={{ tabBarIcon: ({color}) => <Home color={color} size={28} /> }}
      />
    </Tab.Navigator>
  );
}

// --- COMPONENTE PRINCIPAL ---
export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <NavigationContainer>
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          <Stack.Screen name="Onboarding" component={OnboardingScreen} />
          <Stack.Screen name="Home" component={MainAppTabs} />
        </Stack.Navigator>
      </NavigationContainer>
    </GestureHandlerRootView>
  );
}