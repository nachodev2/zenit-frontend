import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { NavigationContainer } from "@react-navigation/native";
import { StatusBar } from "expo-status-bar";
import { Text, View } from "react-native";
import "./global.css"; // Importante para que NativeWind funcione

// Pantalla de prueba
function HomeScreen() {
  return (
    <View className="flex-1 items-center justify-center bg-zenitBlack">
      <Text className="text-zenitNeon text-3xl font-bold">Zenit V3 🚀</Text>
      <Text className="text-white mt-2">Si ves esto, todo funciona.</Text>
      <StatusBar style="light" />
    </View>
  );
}

const Tab = createBottomTabNavigator();

export default function App() {
  return (
    <NavigationContainer>
      <Tab.Navigator
        screenOptions={{
          headerShown: false,
          tabBarStyle: {
            backgroundColor: "#1E1E1E",
            borderTopColor: "#333",
            height: 60,
            paddingBottom: 10,
          },
          tabBarActiveTintColor: "#D4FF00", // Tu color neón
          tabBarInactiveTintColor: "#888",
        }}
      >
        <Tab.Screen name="Home" component={HomeScreen} />
      </Tab.Navigator>
    </NavigationContainer>
  );
}
