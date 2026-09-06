import { apiClient } from './client';
import type { ProviderDetail } from './types';

export async function getProvider(providerId: string): Promise<ProviderDetail> {
  const { data } = await apiClient.get<ProviderDetail>(`/providers/${providerId}`);
  return data;
}
