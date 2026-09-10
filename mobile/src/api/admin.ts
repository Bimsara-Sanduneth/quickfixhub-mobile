import { apiClient } from './client';
import type {
  AdminOverview,
  AdminProvider,
  AdminProviderDetail,
  DocumentStatus,
  Page,
  Payment,
  RefundRequest,
  VerificationStatus,
} from './types';

export async function getAdminOverview(): Promise<AdminOverview> {
  const { data } = await apiClient.get<AdminOverview>('/admin/overview');
  return data;
}

export async function listProvidersByStatus(status: VerificationStatus): Promise<AdminProvider[]> {
  const { data } = await apiClient.get<AdminProvider[]>('/admin/providers', { params: { status } });
  return data;
}

export async function getAdminProvider(providerId: string): Promise<AdminProviderDetail> {
  const { data } = await apiClient.get<AdminProviderDetail>(`/admin/providers/${providerId}`);
  return data;
}

export async function verifyProvider(providerId: string): Promise<AdminProviderDetail> {
  const { data } = await apiClient.patch<AdminProviderDetail>(`/admin/providers/${providerId}/verify`);
  return data;
}

export async function rejectProvider(providerId: string, reason: string): Promise<AdminProviderDetail> {
  const { data } = await apiClient.patch<AdminProviderDetail>(`/admin/providers/${providerId}/reject`, { reason });
  return data;
}

export async function requestProviderDocs(providerId: string, reason: string): Promise<AdminProviderDetail> {
  const { data } = await apiClient.patch<AdminProviderDetail>(`/admin/providers/${providerId}/request-docs`, { reason });
  return data;
}

export async function setProviderInternalNote(providerId: string, note: string): Promise<AdminProviderDetail> {
  const { data } = await apiClient.put<AdminProviderDetail>(`/admin/providers/${providerId}/note`, { note });
  return data;
}

export async function reviewProviderDocument(
  providerId: string,
  documentId: string,
  status: DocumentStatus,
  reviewNote?: string,
): Promise<AdminProviderDetail> {
  const { data } = await apiClient.patch<AdminProviderDetail>(`/admin/providers/${providerId}/documents/${documentId}`, {
    status,
    reviewNote,
  });
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
