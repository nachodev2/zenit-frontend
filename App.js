import { StatusBar } from 'expo-status-bar';
import { Text, View } from 'react-native';

export default function App() {
  return (
    <View className="flex-1 items-center justify-center bg-zenitBlack">
      <Text className="text-zenitNeon text-3xl font-bold">Zenit Renacido 🚀</Text>
      <StatusBar style="light" />
    </View>
  );
}
