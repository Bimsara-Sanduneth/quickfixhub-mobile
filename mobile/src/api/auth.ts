import { apiClient } from './client';
import type { AuthResponse, LoginRequest, RefreshRequest, RegisterRequest } from './types';

export async function register(payload: RegisterRequest): Promise<AuthResponse> {
  const { data } = await apiClient.post<AuthResponse>('/auth/register', payload);
  return data;
}

export async function login(payload: LoginRequest): Promise<AuthResponse> {
  const { data } = await apiClient.post<AuthResponse>('/auth/login', payload);
  return data;
}

export async function logout(payload: RefreshRequest): Promise<void> {
  await apiClient.post('/auth/logout', payload);
}
