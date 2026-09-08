import { apiClient } from './client';
import type { AddProviderServiceRequest, CreateProviderProfileRequest, Page, ProviderDetail, ProviderServiceItem, ProviderSummary } from './types';

export async function getProvider(providerId: string): Promise<ProviderDetail> {
  const { data } = await apiClient.get<ProviderDetail>(`/providers/${providerId}`);
  return data;
}

export async function getMyProviderProfile(): Promise<ProviderDetail> {
  const { data } = await apiClient.get<ProviderDetail>('/me/provider-profile');
  return data;
}

export async function createMyProviderProfile(payload: CreateProviderProfileRequest): Promise<ProviderDetail> {
  const { data } = await apiClient.post<ProviderDetail>('/me/provider-profile', payload);
  return data;
}

export async function addMyProviderService(payload: AddProviderServiceRequest): Promise<ProviderServiceItem> {
  const { data } = await apiClient.post<ProviderServiceItem>('/me/provider-profile/services', payload);
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
