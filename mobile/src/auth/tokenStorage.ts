import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

import type { AuthResponse } from '@/api/types';

const ACCESS_TOKEN_KEY = 'quickfixhub.accessToken';
const REFRESH_TOKEN_KEY = 'quickfixhub.refreshToken';

// expo-secure-store has no web implementation. Web isn't a shipping target for this app
// (see README), but the template includes a web target, so fall back to an in-memory store
// there rather than crashing during local `npm run web` development.
const isWeb = Platform.OS === 'web';
const webMemoryStore = new Map<string, string>();

async function getItem(key: string): Promise<string | null> {
  if (isWeb) return webMemoryStore.get(key) ?? null;
  return SecureStore.getItemAsync(key);
}

async function setItem(key: string, value: string): Promise<void> {
  if (isWeb) {
    webMemoryStore.set(key, value);
    return;
  }
  await SecureStore.setItemAsync(key, value);
}

async function deleteItem(key: string): Promise<void> {
  if (isWeb) {
    webMemoryStore.delete(key);
    return;
  }
  await SecureStore.deleteItemAsync(key);
}

export async function saveTokens(tokens: Pick<AuthResponse, 'accessToken' | 'refreshToken'>): Promise<void> {
  await Promise.all([
    setItem(ACCESS_TOKEN_KEY, tokens.accessToken),
    setItem(REFRESH_TOKEN_KEY, tokens.refreshToken),
  ]);
}

export function getAccessToken(): Promise<string | null> {
  return getItem(ACCESS_TOKEN_KEY);
}

export function getRefreshToken(): Promise<string | null> {
  return getItem(REFRESH_TOKEN_KEY);
}

export async function clearTokens(): Promise<void> {
  await Promise.all([deleteItem(ACCESS_TOKEN_KEY), deleteItem(REFRESH_TOKEN_KEY)]);
}
