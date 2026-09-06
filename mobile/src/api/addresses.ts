import { apiClient } from './client';
import type { Address, CreateAddressRequest } from './types';

export async function listAddresses(): Promise<Address[]> {
  const { data } = await apiClient.get<Address[]>('/me/addresses');
  return data;
}

export async function createAddress(payload: CreateAddressRequest): Promise<Address> {
  const { data } = await apiClient.post<Address>('/me/addresses', payload);
  return data;
}
