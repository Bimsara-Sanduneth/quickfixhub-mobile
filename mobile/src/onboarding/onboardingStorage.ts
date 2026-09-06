import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

// Not sensitive data, but expo-secure-store is already the app's persistence layer for small
// key-value flags (see auth/tokenStorage.ts) and adding a second storage dependency for one
// boolean isn't worth it.
const SEEN_KEY = 'quickfixhub.hasSeenOnboarding';
const isWeb = Platform.OS === 'web';
let webMemoryFlag = false;

export async function hasSeenOnboarding(): Promise<boolean> {
  if (isWeb) return webMemoryFlag;
  return (await SecureStore.getItemAsync(SEEN_KEY)) === 'true';
}

export async function markOnboardingSeen(): Promise<void> {
  if (isWeb) {
    webMemoryFlag = true;
    return;
  }
  await SecureStore.setItemAsync(SEEN_KEY, 'true');
}
