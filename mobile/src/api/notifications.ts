import { apiClient } from './client';
import type { AppNotification } from './types';

export async function listMyNotifications(): Promise<AppNotification[]> {
  const { data } = await apiClient.get<AppNotification[]>('/me/notifications');
  return data;
}

export async function getUnreadNotificationCount(): Promise<number> {
  const { data } = await apiClient.get<{ count: number }>('/me/notifications/unread-count');
  return data.count;
}

export async function markNotificationRead(id: string): Promise<AppNotification> {
  const { data } = await apiClient.patch<AppNotification>(`/me/notifications/${id}/read`);
  return data;
}

export async function markAllNotificationsRead(): Promise<void> {
  await apiClient.patch('/me/notifications/read-all');
}
