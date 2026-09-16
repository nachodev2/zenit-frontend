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
import { LinearGradient } from 'expo-linear-gradient';

// Importamos el gradiente oficial de tu theme
import { ZENIT_GRADIENT } from './src/constants/theme'; 

// Screens existentes
import HomeScreen from './src/screens/HomeScreen';
import DiarioScreen from './src/screens/DiarioScreen.js';
import ScannerScreen from './src/screens/ScanScreen.js';
import GymScreen from './src/screens/GymScreen';
import ConfigScreen from './src/screens/ConfigScreen';
import ExerciseDetailScreen from './src/screens/ExerciseDetailScreen';
import OnboardingScreen from './src/screens/OnboardingScreen'; 
import GuidedScanScreen from './src/screens/GuidedScanScreen';
import WaterTrackerScreen from './src/screens/WaterTrackerScreen';
import WeightTrackerScreen from './src/screens/WeightTrackerScreen';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

function TabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: false,
        tabBarHideOnKeyboard: true,
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
        tabBarActiveTintColor: '#F97316', 
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
          tabBarStyle: { display: 'none' }, 
          tabBarIcon: () => (
            <View
              style={{
                width: 65,
                height: 65,
                borderRadius: 32.5,
                marginBottom: 30,
                borderWidth: 4,
                borderColor: '#ffffff',
                // --- ESTILO APPLE (CLEAN) extraído de tu GradientButton ---
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.1,
                shadowRadius: 8,
                elevation: 3,
                overflow: 'hidden', 
              }}
            >
              <LinearGradient
                colors={ZENIT_GRADIENT} // Usamos tu constante oficial
                start={{ x: 0, y: 0 }}  // Gradiente horizontal
                end={{ x: 1, y: 0 }}
                style={{
                  width: '100%',
                  height: '100%',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <ScanLine size={28} color="white" strokeWidth={2} />
              </LinearGradient>
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
            initialRouteName="Onboarding" 
            screenOptions={{ headerShown: false }}
          >
            <Stack.Screen name="Onboarding" component={OnboardingScreen} />
            <Stack.Screen name="Main" component={TabNavigator} />
            <Stack.Screen name="ExerciseDetail" component={ExerciseDetailScreen} />
            <Stack.Screen name="GuidedScan" component={GuidedScanScreen} />
            <Stack.Screen name="WaterTracker" component={WaterTrackerScreen} />
            <Stack.Screen name="WeightTracker" component={WeightTrackerScreen} />
          </Stack.Navigator>
        </NavigationContainer>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}