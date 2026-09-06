export type Role = 'CUSTOMER' | 'PROVIDER' | 'ADMIN';

export interface RegisterRequest {
  email: string;
  password: string;
  fullName: string;
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
