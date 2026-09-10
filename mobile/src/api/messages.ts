import { apiClient } from './client';
import type { Conversation, CreateMessageRequest, Message } from './types';

export async function listMessages(bookingId: string): Promise<Message[]> {
  const { data } = await apiClient.get<Message[]>(`/bookings/${bookingId}/messages`);
  return data;
}

export async function listConversations(): Promise<Conversation[]> {
  const { data } = await apiClient.get<Conversation[]>('/me/conversations');
  return data;
}

export async function sendMessage(bookingId: string, payload: CreateMessageRequest): Promise<Message> {
  const { data } = await apiClient.post<Message>(`/bookings/${bookingId}/messages`, payload);
  return data;
}
