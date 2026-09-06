import { apiClient } from './client';
import type { User } from './types';

export async function getCurrentUser(): Promise<User> {
  const { data } = await apiClient.get<User>('/me');
  return data;
}
