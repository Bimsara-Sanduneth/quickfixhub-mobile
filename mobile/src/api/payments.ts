import { apiClient } from './client';
import type { Payment } from './types';

export async function getBookingPayment(bookingId: string): Promise<Payment> {
  const { data } = await apiClient.get<Payment>(`/bookings/${bookingId}/payment`);
  return data;
}
