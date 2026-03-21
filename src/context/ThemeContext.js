import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { useColorScheme } from 'react-native';
import { lightColors, darkColors } from '../theme/colors';
import { useSettingsStore } from '../stores/useSettingsStore';

const ThemeContext = createContext({
  isDark: false,
  colors: lightColors,
  themeMode: 'system',
  setThemeMode: () => {},
});

export function ThemeProvider({ children }) {
  const systemColorScheme = useColorScheme();
  const { themeMode, loaded } = useSettingsStore();

  const getIsDark = useCallback(() => {
    if (themeMode === 'system') {
      return systemColorScheme === 'dark';
    }
    return themeMode === 'dark';
  }, [themeMode, systemColorScheme]);

  const [isDark, setIsDark] = useState(getIsDark());

  useEffect(() => {
    if (loaded) {
      setIsDark(getIsDark());
    }
  }, [themeMode, systemColorScheme, loaded, getIsDark]);

  const colors = isDark ? darkColors : lightColors;

  const setThemeModeCallback = useCallback((mode) => {
    useSettingsStore.getState().update('themeMode', mode);
  }, []);

  return (
    <ThemeContext.Provider value={{ isDark, colors, themeMode, setThemeMode: setThemeModeCallback }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
