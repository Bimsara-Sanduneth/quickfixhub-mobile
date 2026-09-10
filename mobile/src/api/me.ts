import { apiClient } from './client';
import type { User } from './types';

export async function getCurrentUser(): Promise<User> {
  const { data } = await apiClient.get<User>('/me');
  return data;
}

export async function updateMyPhoto(photoDataUri: string): Promise<User> {
  const { data } = await apiClient.put<User>('/me/photo', { photoDataUri });
  return data;
}

export async function deleteMyPhoto(): Promise<User> {
  const { data } = await apiClient.delete<User>('/me/photo');
  return data;
}

export async function updateMyCoverPhoto(photoDataUri: string): Promise<User> {
  const { data } = await apiClient.put<User>('/me/cover-photo', { photoDataUri });
  return data;
}

export async function deleteMyCoverPhoto(): Promise<User> {
  const { data } = await apiClient.delete<User>('/me/cover-photo');
  return data;
}
