import { apiClient } from './client';
import type {
  AddProviderServiceRequest,
  Availability,
  CreateProviderProfileRequest,
  DocumentType,
  MyVerification,
  Page,
  ProviderDetail,
  ProviderDocument,
  ProviderServiceItem,
  ProviderSummary,
  UpdateAvailabilityRequest,
} from './types';

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

export async function getMyAvailability(): Promise<Availability> {
  const { data } = await apiClient.get<Availability>('/me/provider-profile/availability');
  return data;
}

export async function updateMyAvailability(payload: UpdateAvailabilityRequest): Promise<Availability> {
  const { data } = await apiClient.put<Availability>('/me/provider-profile/availability', payload);
  return data;
}

export async function getMyVerification(): Promise<MyVerification> {
  const { data } = await apiClient.get<MyVerification>('/me/provider-profile/verification');
  return data;
}

export async function uploadMyDocument(documentType: DocumentType, fileDataUri: string): Promise<ProviderDocument> {
  const { data } = await apiClient.put<ProviderDocument>('/me/provider-profile/documents', { documentType, fileDataUri });
  return data;
}

export async function listSavedProviders(): Promise<ProviderSummary[]> {
  const { data } = await apiClient.get<ProviderSummary[]>('/me/saved-providers');
  return data;
}

export async function saveProvider(providerId: string): Promise<void> {
  await apiClient.put(`/me/saved-providers/${providerId}`);
}

export async function unsaveProvider(providerId: string): Promise<void> {
  await apiClient.delete(`/me/saved-providers/${providerId}`);
}

export interface ProviderSearchParams {
  categoryId?: string;
  serviceId?: string;
  q?: string;
  city?: string;
  verified?: boolean;
  // Radius discovery (2g) - when all three are given, results are filtered/sorted by distance
  // from (lat, lng) instead of the default businessName ordering.
  lat?: number;
  lng?: number;
  radiusKm?: number;
}

export async function searchProviders(params: ProviderSearchParams): Promise<Page<ProviderSummary>> {
  const { data } = await apiClient.get<Page<ProviderSummary>>('/providers', { params });
  return data;
}
