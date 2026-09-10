import * as SecureStore from 'expo-secure-store';
import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { Platform } from 'react-native';

export type ThemeMode = 'system' | 'light' | 'dark';

export const THEME_MODES: readonly ThemeMode[] = ['system', 'light', 'dark'];

export const THEME_MODE_LABEL: Record<ThemeMode, string> = {
  system: 'System',
  light: 'Light',
  dark: 'Dark',
};

const STORAGE_KEY = 'quickfixhub.themeMode';

// Same expo-secure-store + in-memory-on-web pattern as auth/tokenStorage.ts and
// onboarding/onboardingStorage.ts - not sensitive data, just this app's one small-flag store.
const isWeb = Platform.OS === 'web';
let webMemoryMode: ThemeMode | null = null;

async function loadThemeMode(): Promise<ThemeMode> {
  const raw = isWeb ? webMemoryMode : await SecureStore.getItemAsync(STORAGE_KEY);
  return raw === 'light' || raw === 'dark' ? raw : 'system';
}

async function saveThemeMode(mode: ThemeMode): Promise<void> {
  if (isWeb) {
    webMemoryMode = mode;
    return;
  }
  await SecureStore.setItemAsync(STORAGE_KEY, mode);
}

type ThemeModeContextValue = {
  mode: ThemeMode;
  setMode: (mode: ThemeMode) => void;
};

const ThemeModeContext = createContext<ThemeModeContextValue | null>(null);

// Defaults to 'system' (today's behavior - follow the device) until the persisted preference
// loads, then applies whatever the user last picked. useTheme()/useResolvedScheme() read this to
// decide between Colors.light and Colors.dark instead of trusting the OS unconditionally.
export function ThemeModeProvider({ children }: { children: ReactNode }) {
  const [mode, setModeState] = useState<ThemeMode>('system');

  useEffect(() => {
    let cancelled = false;
    loadThemeMode().then((saved) => {
      if (!cancelled) setModeState(saved);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  function setMode(next: ThemeMode) {
    setModeState(next);
    saveThemeMode(next).catch(() => {});
  }

  return <ThemeModeContext.Provider value={{ mode, setMode }}>{children}</ThemeModeContext.Provider>;
}

export function useThemeMode(): ThemeModeContextValue {
  const ctx = useContext(ThemeModeContext);
  if (!ctx) {
    throw new Error('useThemeMode must be used within a ThemeModeProvider');
  }
  return ctx;
}
