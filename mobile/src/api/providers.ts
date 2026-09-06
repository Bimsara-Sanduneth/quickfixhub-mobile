import { apiClient } from './client';
import type { Page, ProviderDetail, ProviderSummary } from './types';

export async function getProvider(providerId: string): Promise<ProviderDetail> {
  const { data } = await apiClient.get<ProviderDetail>(`/providers/${providerId}`);
  return data;
}

export interface ProviderSearchParams {
  categoryId?: string;
  serviceId?: string;
  q?: string;
  city?: string;
  verified?: boolean;
}

export async function searchProviders(params: ProviderSearchParams): Promise<Page<ProviderSummary>> {
  const { data } = await apiClient.get<Page<ProviderSummary>>('/providers', { params });
  return data;
}
