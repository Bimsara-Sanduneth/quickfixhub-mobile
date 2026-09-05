import axios, { AxiosError, type InternalAxiosRequestConfig } from 'axios';

import { clearTokens, getAccessToken, getRefreshToken, saveTokens } from '@/auth/tokenStorage';

import type { AuthResponse } from './types';

export const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL ?? 'http://localhost:8080/api/v1';

export const apiClient = axios.create({ baseURL: API_BASE_URL });

let unauthenticatedHandler: (() => void) | null = null;

// Lets AuthContext learn about a session ending inside the interceptor (e.g. refresh token
// expired) without this module importing React/navigation directly.
export function setUnauthenticatedHandler(handler: (() => void) | null): void {
  unauthenticatedHandler = handler;
}

apiClient.interceptors.request.use(async (config) => {
  const accessToken = await getAccessToken();
  if (accessToken) {
    config.headers.set('Authorization', `Bearer ${accessToken}`);
  }
  return config;
});

// Concurrent requests that 401 at the same time must share a single refresh call rather than
// each firing their own — otherwise the second refresh would invalidate the first (rotation).
let refreshPromise: Promise<string | null> | null = null;

async function refreshAccessToken(): Promise<string | null> {
  const refreshToken = await getRefreshToken();
  if (!refreshToken) {
    return null;
  }
  try {
    const response = await axios.post<AuthResponse>(`${API_BASE_URL}/auth/refresh`, { refreshToken });
    await saveTokens(response.data);
    return response.data.accessToken;
  } catch {
    return null;
  }
}

type RetryableConfig = InternalAxiosRequestConfig & { _retried?: boolean };

apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as RetryableConfig | undefined;
    const isAuthEndpoint = originalRequest?.url?.startsWith('/auth/');

    if (error.response?.status !== 401 || !originalRequest || originalRequest._retried || isAuthEndpoint) {
      return Promise.reject(error);
    }

    originalRequest._retried = true;
    refreshPromise ??= refreshAccessToken().finally(() => {
      refreshPromise = null;
    });
    const newAccessToken = await refreshPromise;

    if (!newAccessToken) {
      await clearTokens();
      unauthenticatedHandler?.();
      return Promise.reject(error);
    }

    originalRequest.headers.set('Authorization', `Bearer ${newAccessToken}`);
    return apiClient(originalRequest);
  },
);
