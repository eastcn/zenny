import { useEffect, useState } from 'react';
import { useColorScheme } from 'react-native';
import { lightColors, darkColors } from '../theme/colors';

export function useTheme() {
  const systemColorScheme = useColorScheme();
  const [isDark, setIsDark] = useState(systemColorScheme === 'dark');

  useEffect(() => {
    setIsDark(systemColorScheme === 'dark');
  }, [systemColorScheme]);

  const colors = isDark ? darkColors : lightColors;

  return {
    isDark,
    colors,
    systemColorScheme,
  };
}

export { lightColors, darkColors };
