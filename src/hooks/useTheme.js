import { useEffect, useState } from 'react';
import { useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const useTheme = () => {
  const systemTheme = useColorScheme();
  const [isDarkMode, setIsDarkMode] = useState(systemTheme === 'dark');

  useEffect(() => {
    const loadTheme = async () => {
      try {
        const savedTheme = await AsyncStorage.getItem('AppTheme');
        if (savedTheme) setIsDarkMode(savedTheme === 'dark');
        else setIsDarkMode(systemTheme === 'dark');
      } catch (error) {
        setIsDarkMode(systemTheme === 'dark');
      }
    };
    loadTheme();
  }, [systemTheme]); // ✅ AGREGAR systemTheme aquí

  return { isDarkMode };
};