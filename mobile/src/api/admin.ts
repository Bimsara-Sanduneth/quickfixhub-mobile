import { apiClient } from './client';
import type { AdminOverview, AdminProvider, Page, Payment, RefundRequest } from './types';

export async function getAdminOverview(): Promise<AdminOverview> {
  const { data } = await apiClient.get<AdminOverview>('/admin/overview');
  return data;
}

export async function listPendingProviders(): Promise<AdminProvider[]> {
  const { data } = await apiClient.get<AdminProvider[]>('/admin/providers/pending');
  return data;
}

export async function verifyProvider(providerId: string): Promise<AdminProvider> {
  const { data } = await apiClient.patch<AdminProvider>(`/admin/providers/${providerId}/verify`);
  return data;
}

export async function listAdminPayments(page = 0): Promise<Page<Payment>> {
  const { data } = await apiClient.get<Page<Payment>>('/admin/payments', { params: { page } });
  return data;
}

export async function refundPayment(paymentId: string, payload: RefundRequest): Promise<Payment> {
  const { data } = await apiClient.post<Payment>(`/admin/payments/${paymentId}/refund`, payload);
  return data;
}
