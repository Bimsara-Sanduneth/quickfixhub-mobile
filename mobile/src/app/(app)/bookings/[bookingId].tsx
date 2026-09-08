import { useQuery } from '@tanstack/react-query';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import { ArrowLeft, Check, MessageSquare } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { listMyBookings } from '@/api/bookings';
import type { Booking, BookingStatus } from '@/api/types';
import { CancelBookingDialog } from '@/components/cancel-booking-dialog';
import { Divider } from '@/components/ds/divider';
import { Tag, type TagVariant } from '@/components/ds/tag';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useTheme } from '@/hooks/use-theme';
import { formatCurrency } from '@/utils/currency';

const STATUS_TAG_VARIANT: Record<BookingStatus, TagVariant> = {
  REQUESTED: 'outline',
  ACCEPTED: 'accent',
  EN_ROUTE: 'accent',
  IN_PROGRESS: 'accent',
  COMPLETED: 'solid',
  CANCELLED: 'neutral',
  DECLINED: 'neutral',
};

const STATUS_LABEL: Record<BookingStatus, string> = {
  REQUESTED: 'REQUESTED',
  ACCEPTED: 'ACCEPTED',
  EN_ROUTE: 'EN ROUTE',
  IN_PROGRESS: 'IN PROGRESS',
  COMPLETED: 'COMPLETED',
  CANCELLED: 'CANCELLED',
  DECLINED: 'DECLINED',
};

const TIMELINE_STEPS: { status: BookingStatus; label: string; at: (b: Booking) => string | null }[] = [
  { status: 'REQUESTED', label: 'Requested', at: (b) => b.createdAt },
  { status: 'ACCEPTED', label: 'Accepted', at: (b) => b.acceptedAt },
  { status: 'EN_ROUTE', label: 'En route', at: (b) => b.enRouteAt },
  { status: 'IN_PROGRESS', label: 'In progress', at: (b) => b.inProgressAt },
  { status: 'COMPLETED', label: 'Completed', at: (b) => b.completedAt },
];

function referenceCode(bookingId: string): string {
  return `#QFH-${bookingId.slice(0, 8).toUpperCase()}`;
}

function formatDateTime(iso: string): string {
  const date = new Date(iso);
  return `${date.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })} · ${date.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })}`;
}

function minutesLeft(expiresAt: string): number {
  return Math.max(0, Math.ceil((new Date(expiresAt).getTime() - Date.now()) / 60000));
}

export default function BookingDetailScreen() {
  const { bookingId } = useLocalSearchParams<{ bookingId: string }>();
  const insets = useSafeAreaInsets();
  const theme = useTheme();
  const [cancelTarget, setCancelTarget] = useState<Booking | null>(null);
  const [, forceTick] = useState(0);

  const { data: bookings, isPending } = useQuery({ queryKey: ['bookings'], queryFn: listMyBookings });
  const booking = bookings?.find((b) => b.id === bookingId);

  // Only REQUESTED bookings show a countdown, but the interval is harmless (and cheap) to leave
  // running regardless - it just re-renders a screen the user is already looking at.
  useEffect(() => {
    const id = setInterval(() => forceTick((n) => n + 1), 30_000);
    return () => clearInterval(id);
  }, []);

  const backButton = (
    <Pressable
      style={[styles.backButton, { top: insets.top + 8, backgroundColor: theme.bg }]}
      onPress={() => router.back()}
      hitSlop={8}>
      <ArrowLeft size={18} color={theme.text} />
    </Pressable>
  );

  if (isPending) {
    return (
      <ThemedView style={styles.centered}>
        <Stack.Screen options={{ headerShown: false }} />
        <ActivityIndicator />
      </ThemedView>
    );
  }

  if (!booking) {
    return (
      <ThemedView style={styles.centered}>
        <Stack.Screen options={{ headerShown: false }} />
        {backButton}
        <ThemedText type="default">Booking not found.</ThemedText>
      </ThemedView>
    );
  }

  const cancellable = booking.status === 'REQUESTED' || booking.status === 'ACCEPTED' || booking.status === 'EN_ROUTE';

  function openChat() {
    router.push({
      pathname: '/(app)/chat/[bookingId]',
      params: { bookingId: booking!.id, otherPartyName: booking!.providerBusinessName },
    });
  }

  return (
    <ThemedView style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />

      {booking.status === 'REQUESTED' ? (
        // Matches the design's "request sent" moment - a full-bleed accent confirmation rather
        // than the tracking chrome the other statuses use below.
        <View style={[styles.hero, { backgroundColor: theme.accent, paddingTop: insets.top + 60 }]}>
          <ThemedText style={[styles.heroCode, { color: theme.bg }]}>{referenceCode(booking.id)}</ThemedText>
          <View style={[styles.heroCheck, { borderColor: theme.bg }]}>
            <Check size={26} color={theme.bg} strokeWidth={2.5} />
          </View>
          <ThemedText style={[styles.heroTitle, { color: theme.bg }]}>Request{'\n'}sent.</ThemedText>
          <ThemedText style={[styles.heroBody, { color: theme.bg }]}>
            {booking.providerBusinessName} has{' '}
            {booking.expiresAt ? `${minutesLeft(booking.expiresAt)} minutes` : 'a limited window'} to accept.
            We&rsquo;ll let you know the moment they do.
          </ThemedText>
        </View>
      ) : (
        <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
          <Pressable onPress={() => router.back()} hitSlop={8}>
            <ArrowLeft size={20} color={theme.text} />
          </Pressable>
          <ThemedText style={styles.headerCode}>{referenceCode(booking.id)}</ThemedText>
          <Tag label={STATUS_LABEL[booking.status]} variant={STATUS_TAG_VARIANT[booking.status]} />
        </View>
      )}
      <Divider style={booking.status === 'REQUESTED' ? undefined : styles.headerDivider} />

      <ScrollView contentContainerStyle={styles.body}>
        {(booking.status === 'ACCEPTED' || booking.status === 'EN_ROUTE' || booking.status === 'IN_PROGRESS') && (
          <>
            <View style={[styles.mapPlaceholder, { backgroundColor: theme.surface, borderColor: theme.divider }]}>
              <ThemedText type="small" themeColor="textSecondary">
                Live map — not built yet
              </ThemedText>
            </View>

            <ThemedText type="smallBold" style={styles.sectionLabel}>
              Progress
            </ThemedText>
            <View style={styles.timeline}>
              {TIMELINE_STEPS.map((step) => {
                const at = step.at(booking);
                const done = !!at;
                return (
                  <View key={step.status} style={styles.timelineRow}>
                    <View
                      style={[
                        styles.timelineDot,
                        { backgroundColor: done ? theme.accent : 'transparent', borderColor: done ? theme.accent : theme.neutral300 },
                      ]}
                    />
                    <View style={{ flex: 1 }}>
                      <ThemedText style={[styles.timelineLabel, !done && { color: theme.neutral500 }]}>{step.label}</ThemedText>
                      {at && (
                        <ThemedText type="small" themeColor="textSecondary">
                          {formatDateTime(at)}
                        </ThemedText>
                      )}
                    </View>
                  </View>
                );
              })}
            </View>
            <Divider style={styles.sectionDivider} />
          </>
        )}

        <ThemedText type="smallBold" style={styles.sectionLabel}>
          Summary
        </ThemedText>
        <View style={[styles.summaryRow, { borderBottomColor: theme.divider }]}>
          <ThemedText type="small" themeColor="textSecondary">
            Provider
          </ThemedText>
          <ThemedText type="smallBold">{booking.providerBusinessName}</ThemedText>
        </View>
        <View style={[styles.summaryRow, { borderBottomColor: theme.divider }]}>
          <ThemedText type="small" themeColor="textSecondary">
            Service
          </ThemedText>
          <ThemedText type="smallBold">{booking.serviceName}</ThemedText>
        </View>
        <View style={[styles.summaryRow, { borderBottomColor: theme.divider }]}>
          <ThemedText type="small" themeColor="textSecondary">
            When
          </ThemedText>
          <ThemedText type="smallBold">{formatDateTime(booking.scheduledAt)}</ThemedText>
        </View>
        <View style={[styles.summaryRow, { borderBottomColor: theme.divider }]}>
          <ThemedText type="small" themeColor="textSecondary">
            Where
          </ThemedText>
          <ThemedText type="smallBold">{booking.addressLabel}</ThemedText>
        </View>
        <View style={[styles.summaryRow, { borderBottomColor: theme.divider, borderBottomWidth: 0 }]}>
          <ThemedText type="small" themeColor="textSecondary">
            Total
          </ThemedText>
          <ThemedText type="smallBold">{formatCurrency(booking.price)}</ThemedText>
        </View>

        {booking.notes && (
          <>
            <ThemedText type="smallBold" style={styles.sectionLabel}>
              Your notes
            </ThemedText>
            <ThemedText type="small" themeColor="textSecondary" style={styles.notes}>
              {booking.notes}
            </ThemedText>
          </>
        )}
      </ScrollView>

      <View style={[styles.footer, { borderTopColor: theme.divider, paddingBottom: insets.bottom + 16 }]}>
        <Pressable style={[styles.chatButton, { borderColor: theme.divider }]} onPress={openChat}>
          <MessageSquare size={17} color={theme.text} />
          <ThemedText type="smallBold">Message</ThemedText>
        </Pressable>
        {cancellable && (
          <Pressable style={styles.cancelLink} onPress={() => setCancelTarget(booking)}>
            <ThemedText type="smallBold" style={{ color: theme.accent }}>
              Cancel booking
            </ThemedText>
          </Pressable>
        )}
      </View>

      <CancelBookingDialog booking={cancelTarget} onRequestClose={() => setCancelTarget(null)} />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  backButton: {
    position: 'absolute',
    left: 16,
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  hero: {
    paddingHorizontal: 24,
    paddingBottom: 26,
  },
  heroCode: {
    fontFamily: 'Archivo_800ExtraBold',
    fontSize: 14,
    opacity: 0.85,
    marginBottom: 22,
  },
  heroCheck: {
    width: 52,
    height: 52,
    borderWidth: 3,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  heroTitle: {
    fontFamily: 'Archivo_800ExtraBold',
    fontSize: 42,
    lineHeight: 42,
    marginBottom: 14,
  },
  heroBody: {
    fontSize: 14.5,
    lineHeight: 20,
    opacity: 0.9,
  },
  header: {
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerCode: {
    flex: 1,
    fontFamily: 'Archivo_800ExtraBold',
    fontSize: 15,
  },
  headerDivider: {
    marginTop: 16,
  },
  body: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 24,
  },
  mapPlaceholder: {
    height: 140,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  sectionLabel: {
    marginBottom: 12,
  },
  sectionDivider: {
    marginVertical: 20,
  },
  timeline: {
    gap: 4,
  },
  timelineRow: {
    flexDirection: 'row',
    gap: 12,
    paddingBottom: 14,
  },
  timelineDot: {
    width: 12,
    height: 12,
    borderWidth: 2,
    marginTop: 3,
  },
  timelineLabel: {
    fontSize: 13.5,
    fontWeight: '800',
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
  },
  notes: {
    lineHeight: 19,
  },
  footer: {
    borderTopWidth: 2,
    paddingHorizontal: 20,
    paddingTop: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  chatButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderWidth: 1,
    paddingVertical: 13,
  },
  cancelLink: {
    paddingVertical: 13,
  },
});
