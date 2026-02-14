import { View, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function DiarioScreen() {
  return (
    <SafeAreaView className="flex-1 bg-white">
      <View className="flex-1 justify-center items-center">
        <Text className="text-2xl font-bold">Búsqueda</Text>
        <Text className="text-gray-500 mt-2">Buscar recetas y más 🔍</Text>
      </View>
    </SafeAreaView>
  );
}