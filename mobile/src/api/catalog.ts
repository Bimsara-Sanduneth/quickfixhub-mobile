import { apiClient } from './client';
import type { Page, ServiceCategory, ServiceOffering } from './types';

export async function listCategories(): Promise<ServiceCategory[]> {
  const { data } = await apiClient.get<ServiceCategory[]>('/categories');
  return data;
}

export async function searchServices(params: { categoryId?: string; q?: string }): Promise<Page<ServiceOffering>> {
  const { data } = await apiClient.get<Page<ServiceOffering>>('/services', { params });
  return data;
}
