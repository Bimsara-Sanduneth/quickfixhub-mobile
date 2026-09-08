import { apiClient } from './client';
import type { Booking, CreateBookingRequest } from './types';

export async function listMyBookings(): Promise<Booking[]> {
  const { data } = await apiClient.get<Booking[]>('/bookings');
  return data;
}

export async function createBooking(payload: CreateBookingRequest): Promise<Booking> {
  const { data } = await apiClient.post<Booking>('/bookings', payload);
  return data;
}

export async function cancelBooking(id: string): Promise<Booking> {
  const { data } = await apiClient.patch<Booking>(`/bookings/${id}/cancel`);
  return data;
}
