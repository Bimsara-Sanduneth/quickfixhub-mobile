import { apiClient } from './client';
import type { CreateReviewRequest, Page, Review } from './types';

export async function createReview(bookingId: string, payload: CreateReviewRequest): Promise<Review> {
  const { data } = await apiClient.post<Review>(`/bookings/${bookingId}/reviews`, payload);
  return data;
}

export async function listProviderReviews(providerId: string): Promise<Page<Review>> {
  const { data } = await apiClient.get<Page<Review>>(`/providers/${providerId}/reviews`);
  return data;
}
