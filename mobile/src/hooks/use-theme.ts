/**
 * Learn more about light and dark modes:
 * https://docs.expo.dev/guides/color-schemes/
 */

import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useThemeMode } from '@/theme/theme-mode';

// 'system' (the default) follows the device's own setting, same as before this was
// user-selectable; 'light'/'dark' pin the app regardless of the device.
export function useResolvedScheme(): 'light' | 'dark' {
  const { mode } = useThemeMode();
  const systemScheme = useColorScheme();

  if (mode !== 'system') {
    return mode;
  }
  return systemScheme === 'dark' ? 'dark' : 'light';
}

export function useTheme() {
  const scheme = useResolvedScheme();
  return Colors[scheme];
}
