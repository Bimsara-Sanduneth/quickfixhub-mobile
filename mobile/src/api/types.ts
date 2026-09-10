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

export interface ForgotPasswordRequest {
  email: string;
}

export interface ResetPasswordRequest {
  email: string;
  code: string;
  newPassword: string;
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
  // A data: URI, stored directly on the row - no object storage exists in this project.
  photoDataUri: string | null;
  coverPhotoDataUri: string | null;
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
  // A provider "is" its owning user - these are that person's own account photos.
  photoDataUri: string | null;
  coverPhotoDataUri: string | null;
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
  photoDataUri: string | null;
  coverPhotoDataUri: string | null;
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
  // Shared once a booking exists so the two parties can call each other. Either may be null
  // (phone is optional at registration).
  providerPhone: string | null;
  customerPhone: string | null;
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

export type VerificationStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

export const DOCUMENT_TYPES = ['NATIONAL_ID', 'TRADE_LICENSE', 'INSURANCE', 'PROOF_OF_ADDRESS'] as const;
export type DocumentType = (typeof DOCUMENT_TYPES)[number];

// Mirrors DocumentType.isRequired() on the backend - the admin can't approve a provider until
// both of these are at least submitted (not necessarily marked CHECKED yet).
export const REQUIRED_DOCUMENT_TYPES: readonly DocumentType[] = ['NATIONAL_ID', 'TRADE_LICENSE'];

export const DOCUMENT_TYPE_LABEL: Record<DocumentType, string> = {
  NATIONAL_ID: 'National ID',
  TRADE_LICENSE: 'Trade licence',
  INSURANCE: 'Insurance',
  PROOF_OF_ADDRESS: 'Proof of address',
};

export type DocumentStatus = 'PENDING' | 'CHECKED' | 'REJECTED';

export interface ProviderDocument {
  id: string;
  documentType: DocumentType;
  status: DocumentStatus;
  reviewNote: string | null;
  fileDataUri: string;
  createdAt: string;
}

// GET /me/provider-profile/verification - the provider's own view of where their application
// stands, plus whatever documents they've submitted so far.
export interface MyVerification {
  status: VerificationStatus;
  providerMessage: string | null;
  documents: ProviderDocument[];
}

export interface AdminProvider {
  id: string;
  businessName: string;
  ownerEmail: string;
  bio: string | null;
  yearsExperience: number | null;
  city: string | null;
  verificationStatus: VerificationStatus;
  documentCount: number;
  checkedDocumentCount: number;
  createdAt: string;
}

export interface AdminProviderDetail {
  id: string;
  businessName: string;
  ownerEmail: string;
  bio: string | null;
  yearsExperience: number | null;
  city: string | null;
  verificationStatus: VerificationStatus;
  providerMessage: string | null;
  internalNote: string | null;
  photoDataUri: string | null;
  documents: ProviderDocument[];
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

// The CHAT tab's conversation list - one row per booking the caller is party to. A booking IS
// the conversation thread, see the backend's Message entity comment.
export interface Conversation {
  bookingId: string;
  otherPartyName: string;
  serviceName: string;
  status: BookingStatus;
  lastMessage: string | null;
  lastMessageAt: string;
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

// Phase 5, scoped to an in-app list rather than real OS push (see the backend's
// NotificationService comment) - polled, same as chat.
export type NotificationType =
  | 'BOOKING_REQUESTED'
  | 'BOOKING_ACCEPTED'
  | 'BOOKING_DECLINED'
  | 'BOOKING_EN_ROUTE'
  | 'BOOKING_IN_PROGRESS'
  | 'BOOKING_COMPLETED'
  | 'BOOKING_CANCELLED'
  | 'NEW_MESSAGE'
  | 'VERIFICATION_APPROVED'
  | 'VERIFICATION_REJECTED'
  | 'VERIFICATION_DOCS_REQUESTED';

export interface AppNotification {
  id: string;
  type: NotificationType;
  title: string;
  body: string;
  // Only set for booking/message-related types - verification notifications have none.
  bookingId: string | null;
  read: boolean;
  createdAt: string;
}
