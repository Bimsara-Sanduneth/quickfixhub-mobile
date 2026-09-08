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
  // The provider's own priced listing id - what a booking request references (a catalog
  // serviceId alone doesn't say which provider's price/duration applies).
  providerServiceId: string;
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
  // Null (not 0) means no reviews yet - don't render a star rating in that case.
  averageRating: number | null;
  reviewCount: number;
  // Geocoded from `city` when the provider set up their profile - null if that failed or no
  // city was given.
  latitude: number | null;
  longitude: number | null;
}

export interface ProviderSummary {
  id: string;
  businessName: string;
  city: string | null;
  verified: boolean;
  yearsExperience: number | null;
  // Lowest price among the provider's listed services; null if they haven't listed any.
  fromPrice: number | null;
  // Null (not 0) means no reviews yet - don't render a star rating in that case.
  averageRating: number | null;
  reviewCount: number;
  latitude: number | null;
  longitude: number | null;
}

// Fixed vocabulary of quick-select review chips (2p). The backend stores whatever strings are
// sent, unvalidated against an enum - this list is the only place the vocabulary is defined.
export const REVIEW_TAGS = ['ON_TIME', 'TIDY_WORK', 'GREAT_COMMUNICATION', 'WOULD_REBOOK', 'FAIR_PRICE', 'SKILLED'] as const;
export type ReviewTag = (typeof REVIEW_TAGS)[number];

export const REVIEW_TAG_LABEL: Record<ReviewTag, string> = {
  ON_TIME: 'On time',
  TIDY_WORK: 'Tidy work',
  GREAT_COMMUNICATION: 'Great communication',
  WOULD_REBOOK: 'Would rebook',
  FAIR_PRICE: 'Fair price',
  SKILLED: 'Skilled',
};

export interface Review {
  id: string;
  rating: number;
  comment: string | null;
  tags: string[];
  reviewerFirstName: string;
  createdAt: string;
}

export interface CreateReviewRequest {
  rating: number;
  comment?: string;
  tags?: string[];
}

// REQUESTED -> ACCEPTED -> EN_ROUTE -> IN_PROGRESS -> COMPLETED is the happy path. DECLINED only
// ever follows REQUESTED (provider declined, or the 30-minute accept window expired unanswered);
// CANCELLED can follow REQUESTED, ACCEPTED or EN_ROUTE but never IN_PROGRESS or later.
export type BookingStatus = 'REQUESTED' | 'ACCEPTED' | 'EN_ROUTE' | 'IN_PROGRESS' | 'COMPLETED' | 'DECLINED' | 'CANCELLED';

export interface Booking {
  id: string;
  providerProfileId: string;
  providerBusinessName: string;
  // Not meaningful on a customer's own bookings (they know who they are) - populated on the
  // provider-side listing.
  customerName: string;
  serviceId: string;
  serviceName: string;
  addressId: string;
  addressLabel: string;
  addressText: string;
  scheduledAt: string; // ISO instant
  status: BookingStatus;
  price: number;
  notes: string | null;
  createdAt: string;
  // Null once the booking leaves REQUESTED (accepted/declined/expired) - only meaningful for
  // running the accept-window countdown while still REQUESTED.
  expiresAt: string | null;
  acceptedAt: string | null;
  enRouteAt: string | null;
  inProgressAt: string | null;
  completedAt: string | null;
  declinedAt: string | null;
  cancelledAt: string | null;
  // True once the provider is EN_ROUTE - the point after which cancelling costs the flat
  // call-out fee (no real charge yet, just what drives the warning in the cancel dialog).
  cancellationFeeApplies: boolean;
  reviewed: boolean;
}

export interface CreateProviderProfileRequest {
  businessName: string;
  bio?: string;
  yearsExperience?: number;
  city?: string;
}

export interface AddProviderServiceRequest {
  serviceId: string;
  price: number;
  durationMinutes?: number;
}

export interface CreateBookingRequest {
  providerServiceId: string;
  addressId: string;
  scheduledAt: string; // ISO instant
  notes?: string;
}

// Mocked payment ledger - no real gateway, see the backend's Payment entity. PAID happens
// automatically the moment a booking is completed; PARTIALLY_REFUNDED/REFUNDED only ever follow
// an admin refund action.
export type PaymentStatus = 'PAID' | 'PARTIALLY_REFUNDED' | 'REFUNDED';

export interface Payment {
  id: string;
  bookingId: string;
  customerName: string;
  providerBusinessName: string;
  serviceName: string;
  amount: number;
  status: PaymentStatus;
  method: string;
  paidAt: string;
  refundAmount: number | null;
  refundReason: string | null;
  refundedAt: string | null;
}

export interface RefundRequest {
  amount: number;
  reason: string;
}

export interface AdminOverview {
  totalCustomers: number;
  totalProviders: number;
  verifiedProviders: number;
  pendingVerification: number;
  totalBookings: number;
  completedBookings: number;
  totalRevenue: number;
  totalRefunded: number;
}

export interface AdminProvider {
  id: string;
  businessName: string;
  ownerEmail: string;
  bio: string | null;
  yearsExperience: number | null;
  city: string | null;
  createdAt: string;
}

export interface Message {
  id: string;
  bookingId: string;
  senderId: string;
  senderName: string;
  body: string;
  createdAt: string;
}

export interface CreateMessageRequest {
  body: string;
}

// 0=Monday .. 6=Sunday, matching the backend's ISO-8601 day-of-week ordering.
export interface AvailabilityDay {
  dayOfWeek: number;
  isOpen: boolean;
  startTime: string | null; // "HH:mm"
  endTime: string | null; // "HH:mm"
}

export interface Availability {
  serviceRadiusKm: number | null;
  days: AvailabilityDay[];
}

export interface UpdateAvailabilityRequest {
  serviceRadiusKm?: number;
  days: AvailabilityDay[];
}
