import type { BookingStatus } from '@/api/types';
import type { TagVariant } from '@/components/ds/tag';

// Shared by the customer and provider booking-detail screens.

export const STATUS_TAG_VARIANT: Record<BookingStatus, TagVariant> = {
  REQUESTED: 'outline',
  ACCEPTED: 'accent',
  EN_ROUTE: 'accent',
  IN_PROGRESS: 'accent',
  COMPLETED: 'solid',
  CANCELLED: 'neutral',
  DECLINED: 'neutral',
};

export const STATUS_LABEL: Record<BookingStatus, string> = {
  REQUESTED: 'REQUESTED',
  ACCEPTED: 'ACCEPTED',
  EN_ROUTE: 'EN ROUTE',
  IN_PROGRESS: 'IN PROGRESS',
  COMPLETED: 'COMPLETED',
  CANCELLED: 'CANCELLED',
  DECLINED: 'DECLINED',
};

export function referenceCode(bookingId: string): string {
  return `#QFH-${bookingId.slice(0, 8).toUpperCase()}`;
}

export function formatDateTime(iso: string): string {
  const date = new Date(iso);
  return `${date.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })} · ${date.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })}`;
}

export function minutesLeft(expiresAt: string): number {
  return Math.max(0, Math.ceil((new Date(expiresAt).getTime() - Date.now()) / 60000));
}
