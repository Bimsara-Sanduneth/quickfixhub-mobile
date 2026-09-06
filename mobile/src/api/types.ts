export type Role = 'CUSTOMER' | 'PROVIDER' | 'ADMIN';

export interface RegisterRequest {
  email: string;
  password: string;
  fullName: string;
  phone?: string;
  // Self-registration as ADMIN is rejected by the backend.
  role: Exclude<Role, 'ADMIN'>;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RefreshRequest {
  refreshToken: string;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  tokenType: string;
  expiresInSeconds: number;
}

export interface ApiError {
  timestamp: string;
  status: number;
  error: string;
  message: string;
  path: string;
}

export interface ServiceCategory {
  id: string;
  name: string;
  slug: string;
  description: string | null;
}

export interface ServiceOffering {
  id: string;
  categoryId: string;
  categoryName: string;
  name: string;
  slug: string;
  description: string | null;
}

// Mirrors Spring Data's Page<T> JSON shape.
export interface Page<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
}

export interface User {
  id: string;
  email: string;
  fullName: string;
  phone: string | null;
  role: Role;
}

export interface Address {
  id: string;
  label: string;
  addressText: string;
}

export interface CreateAddressRequest {
  label: string;
  addressText: string;
}

export interface ProviderServiceItem {
  serviceId: string;
  serviceName: string;
  price: number;
  durationMinutes: number | null;
}

export interface ProviderDetail {
  id: string;
  businessName: string;
  bio: string | null;
  yearsExperience: number | null;
  city: string | null;
  verified: boolean;
  services: ProviderServiceItem[];
}
