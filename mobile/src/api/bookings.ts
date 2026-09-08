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

export async function listProviderBookings(): Promise<Booking[]> {
  const { data } = await apiClient.get<Booking[]>('/me/provider-profile/bookings');
  return data;
}

export async function acceptBooking(id: string): Promise<Booking> {
  const { data } = await apiClient.patch<Booking>(`/bookings/${id}/accept`);
  return data;
}

export async function declineBooking(id: string): Promise<Booking> {
  const { data } = await apiClient.patch<Booking>(`/bookings/${id}/decline`);
  return data;
}

export async function startTravelBooking(id: string): Promise<Booking> {
  const { data } = await apiClient.patch<Booking>(`/bookings/${id}/start-travel`);
  return data;
}

export async function startJobBooking(id: string): Promise<Booking> {
  const { data } = await apiClient.patch<Booking>(`/bookings/${id}/start-job`);
  return data;
}

export async function completeBooking(id: string): Promise<Booking> {
  const { data } = await apiClient.patch<Booking>(`/bookings/${id}/complete`);
  return data;
}
