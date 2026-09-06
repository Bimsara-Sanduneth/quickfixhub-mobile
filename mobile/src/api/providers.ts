import { apiClient } from './client';
import type { Page, ProviderDetail, ProviderSummary } from './types';

export async function getProvider(providerId: string): Promise<ProviderDetail> {
  const { data } = await apiClient.get<ProviderDetail>(`/providers/${providerId}`);
  return data;
}

export async function searchProviders(params: {
  categoryId?: string;
  serviceId?: string;
  q?: string;
}): Promise<Page<ProviderSummary>> {
  const { data } = await apiClient.get<Page<ProviderSummary>>('/providers', { params });
  return data;
}
