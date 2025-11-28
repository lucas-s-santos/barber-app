// Backup copy of contexts/ThemeContext.js - 2025-11-28
export const __backup = `import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { useColorScheme } from 'react-native';
import { Colors } from '../constants/theme';

// <<< MUDANÇA 1: Definimos um valor inicial SEGURO para o contexto >>>
const initialThemeState = {
  theme: Colors.light, // Começa com o tema claro como padrão seguro
  themeMode: 'system',
  toggleTheme: () => {}, // Uma função vazia para evitar erros
};

const ThemeContext = createContext(initialThemeState);

export const ThemeProvider = ({ children }) => {
  const systemScheme = useColorScheme();
  const [themeMode, setThemeMode] = useState('system');

  // <<< MUDANÇA 2: O estado inicial agora é baseado no tema do sistema >>>
  const [activeTheme, setActiveTheme] = useState(
    systemScheme === 'dark' ? Colors.dark : Colors.light,
  );

  useEffect(() => {
    const loadThemeMode = async () => {
      try {
        const savedMode = await AsyncStorage.getItem('themeMode');
        if (savedMode) {
          setThemeMode(savedMode);
        }
      } catch (e) {
        console.error('Failed to load theme mode from storage', e);
      }
    };
    loadThemeMode();
  }, []);

  useEffect(() => {
    let newTheme;
    if (themeMode === 'light') {
      newTheme = Colors.light;
    } else if (themeMode === 'dark') {
      newTheme = Colors.dark;
    } else {
      newTheme = systemScheme === 'dark' ? Colors.dark : Colors.light;
    }
    setActiveTheme(newTheme);
  }, [themeMode, systemScheme]);

  const toggleTheme = useCallback(async (mode) => {
    try {
      setThemeMode(mode);
      await AsyncStorage.setItem('themeMode', mode);
    } catch (e) {
      console.error('Failed to save theme mode to storage', e);
    }
  }, []);

  return (
    <ThemeContext.Provider value={{ theme: activeTheme, themeMode, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useAppTheme = () => useContext(ThemeContext);
`;
