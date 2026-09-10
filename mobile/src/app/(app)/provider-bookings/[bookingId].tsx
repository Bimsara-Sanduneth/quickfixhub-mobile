import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import { ArrowLeft, MessageSquare, Phone } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Linking, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { acceptBooking, completeBooking, declineBooking, listProviderBookings, startJobBooking, startTravelBooking } from '@/api/bookings';
import { extractErrorMessage } from '@/api/errors';
import type { Booking, BookingStatus } from '@/api/types';
import { Button } from '@/components/ds/button';
import { Dialog } from '@/components/ds/dialog';
import { Divider } from '@/components/ds/divider';
import { Tag } from '@/components/ds/tag';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useTheme } from '@/hooks/use-theme';
import { formatDateTime, minutesLeft, referenceCode, STATUS_LABEL, STATUS_TAG_VARIANT } from '@/utils/booking';
import { formatCurrency } from '@/utils/currency';

// Who performs each transition - not tracked as a real field anywhere, just derivable from the
// lifecycle's own rules (see BookingController): a customer requests and can cancel, everything
// else from ACCEPTED onward is a provider action, and auto-expiry (system) reads the same as a
// decline to the provider.
const STATUS_HISTORY: { status: BookingStatus; label: string; actor: string; at: (b: Booking) => string | null }[] = [
  { status: 'REQUESTED', label: 'Requested', actor: 'customer', at: (b) => b.createdAt },
  { status: 'ACCEPTED', label: 'Accepted', actor: 'you', at: (b) => b.acceptedAt },
  { status: 'EN_ROUTE', label: 'En route', actor: 'you', at: (b) => b.enRouteAt },
  { status: 'IN_PROGRESS', label: 'Started', actor: 'you', at: (b) => b.inProgressAt },
  { status: 'COMPLETED', label: 'Completed', actor: 'you', at: (b) => b.completedAt },
  { status: 'DECLINED', label: 'Declined', actor: 'you', at: (b) => b.declinedAt },
  { status: 'CANCELLED', label: 'Cancelled', actor: 'customer', at: (b) => b.cancelledAt },
];

// What "Start travel" / "Start job" / "Mark complete" actually leads to, for the "Next allowed
// transition" caption - not shown for a status with no further transition.
const NEXT_TRANSITION: Partial<Record<BookingStatus, BookingStatus>> = {
  REQUESTED: 'ACCEPTED',
  ACCEPTED: 'EN_ROUTE',
  EN_ROUTE: 'IN_PROGRESS',
  IN_PROGRESS: 'COMPLETED',
};

export default function ProviderBookingDetailScreen() {
  const { bookingId } = useLocalSearchParams<{ bookingId: string }>();
  const insets = useSafeAreaInsets();
  const theme = useTheme();
  const queryClient = useQueryClient();
  const [declineTarget, setDeclineTarget] = useState<Booking | null>(null);
  const [, forceTick] = useState(0);

  const { data: bookings, isPending } = useQuery({ queryKey: ['bookings', 'provider'], queryFn: listProviderBookings });
  const booking = bookings?.find((b) => b.id === bookingId);

  // Only a REQUESTED booking shows a countdown, but the interval is harmless (and cheap) to leave
  // running regardless - matches the customer detail screen's own pattern.
  useEffect(() => {
    const id = setInterval(() => forceTick((n) => n + 1), 30_000);
    return () => clearInterval(id);
  }, []);

  function invalidate() {
    queryClient.invalidateQueries({ queryKey: ['bookings', 'provider'] });
  }

  const acceptMutation = useMutation({ mutationFn: acceptBooking, onSuccess: invalidate });
  const startTravelMutation = useMutation({ mutationFn: startTravelBooking, onSuccess: invalidate });
  const startJobMutation = useMutation({ mutationFn: startJobBooking, onSuccess: invalidate });
  const completeMutation = useMutation({ mutationFn: completeBooking, onSuccess: invalidate });
  const declineMutation = useMutation({
    mutationFn: declineBooking,
    onSuccess: () => {
      invalidate();
      setDeclineTarget(null);
      router.back();
    },
  });

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

  function openChat() {
    router.push({
      pathname: '/(app)/chat/[bookingId]',
      params: { bookingId: booking!.id, otherPartyName: booking!.customerName },
    });
  }

  return (
    <ThemedView style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />

      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <Pressable onPress={() => router.back()} hitSlop={8}>
          <ArrowLeft size={20} color={theme.text} />
        </Pressable>
        <ThemedText style={styles.headerCode}>{referenceCode(booking.id)}</ThemedText>
        <Tag label={STATUS_LABEL[booking.status]} variant={STATUS_TAG_VARIANT[booking.status]} />
      </View>
      <Divider style={styles.headerDivider} />

      <ScrollView contentContainerStyle={styles.body}>
        {booking.status === 'REQUESTED' && booking.expiresAt && (
          <View style={[styles.banner, { backgroundColor: theme.accent100, borderColor: theme.accent }]}>
            <ThemedText type="small" style={{ color: theme.accent800 }}>
              {minutesLeft(booking.expiresAt)} minutes left to accept or decline before this expires automatically.
            </ThemedText>
          </View>
        )}

        <ThemedText type="smallBold" style={styles.sectionLabel}>
          Summary
        </ThemedText>
        <View style={[styles.summaryRow, { borderBottomColor: theme.divider }]}>
          <ThemedText type="small" themeColor="textSecondary">
            Customer
          </ThemedText>
          <ThemedText type="smallBold">{booking.customerName}</ThemedText>
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
          <ThemedText type="smallBold" style={styles.addressValue}>
            {booking.addressText}
          </ThemedText>
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
              Customer notes
            </ThemedText>
            <ThemedText type="small" themeColor="textSecondary" style={styles.notes}>
              &ldquo;{booking.notes}&rdquo;
            </ThemedText>
          </>
        )}

        <ThemedText type="smallBold" style={styles.sectionLabel}>
          Status history
        </ThemedText>
        <View style={styles.historyList}>
          {STATUS_HISTORY.filter((step) => step.at(booking)).map((step) => (
            <View key={step.status} style={styles.historyRow}>
              <ThemedText type="small" style={styles.historyLabel}>
                {step.label.toUpperCase()}
              </ThemedText>
              <ThemedText type="small" themeColor="textSecondary">
                {formatDateTime(step.at(booking)!)} · {step.actor}
              </ThemedText>
            </View>
          ))}
        </View>
      </ScrollView>

      <View style={[styles.footer, { borderTopColor: theme.divider, paddingBottom: insets.bottom + 16 }]}>
        {NEXT_TRANSITION[booking.status] && (
          <ThemedText type="small" themeColor="textSecondary" style={styles.nextTransition}>
            Next allowed transition: {STATUS_LABEL[booking.status]} &rarr; {STATUS_LABEL[NEXT_TRANSITION[booking.status]!]}
          </ThemedText>
        )}
        <View style={styles.footerRow}>
          {booking.customerPhone && ['ACCEPTED', 'EN_ROUTE', 'IN_PROGRESS'].includes(booking.status) && (
            <Pressable
              style={[styles.callButton, { borderColor: theme.divider }]}
              onPress={() => Linking.openURL(`tel:${booking!.customerPhone}`)}>
              <Phone size={17} color={theme.text} />
            </Pressable>
          )}
          <Pressable style={[styles.chatButton, { borderColor: theme.divider }]} onPress={openChat}>
            <MessageSquare size={17} color={theme.text} />
            <ThemedText type="smallBold">Message</ThemedText>
          </Pressable>

          {booking.status === 'REQUESTED' && (
          <>
            <Pressable style={styles.declineLink} onPress={() => setDeclineTarget(booking)}>
              <ThemedText type="smallBold" style={{ color: theme.accent }}>
                Decline
              </ThemedText>
            </Pressable>
            <Button
              label="Accept"
              style={styles.actionButton}
              loading={acceptMutation.isPending}
              onPress={() => acceptMutation.mutate(booking.id)}
            />
          </>
        )}
        {booking.status === 'ACCEPTED' && (
          <Button
            label="Start travel"
            variant="secondary"
            style={styles.actionButton}
            loading={startTravelMutation.isPending}
            onPress={() => startTravelMutation.mutate(booking.id)}
          />
        )}
        {booking.status === 'EN_ROUTE' && (
          <Button
            label="Start job"
            variant="secondary"
            style={styles.actionButton}
            loading={startJobMutation.isPending}
            onPress={() => startJobMutation.mutate(booking.id)}
          />
        )}
        {booking.status === 'IN_PROGRESS' && (
          <Button
            label="Mark complete"
            variant="secondary"
            style={styles.actionButton}
            loading={completeMutation.isPending}
            onPress={() => completeMutation.mutate(booking.id)}
          />
        )}
        </View>
      </View>

      <Dialog
        visible={!!declineTarget}
        title="Decline this booking?"
        body={declineTarget ? `${declineTarget.customerName} will need to book someone else.` : undefined}
        onRequestClose={() => setDeclineTarget(null)}
        actions={
          <>
            <Button label="Keep it" variant="ghost" onPress={() => setDeclineTarget(null)} />
            {declineMutation.isError && (
              <ThemedText type="small" style={{ color: theme.accent }}>
                {extractErrorMessage(declineMutation.error)}
              </ThemedText>
            )}
            <Button
              label="Decline"
              loading={declineMutation.isPending}
              onPress={() => declineTarget && declineMutation.mutate(declineTarget.id)}
            />
          </>
        }
      />
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
  banner: {
    borderWidth: 1,
    padding: 12,
    marginBottom: 20,
  },
  sectionLabel: {
    marginBottom: 12,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
  },
  addressValue: {
    flex: 1,
    textAlign: 'right',
    marginLeft: 20,
  },
  notes: {
    lineHeight: 19,
  },
  historyList: {
    gap: 4,
  },
  historyRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
  },
  historyLabel: {
    fontFamily: 'Archivo_800ExtraBold',
    fontSize: 12,
  },
  footer: {
    borderTopWidth: 2,
    paddingHorizontal: 20,
    paddingTop: 14,
  },
  nextTransition: {
    marginBottom: 10,
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  chatButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderWidth: 1,
    paddingVertical: 13,
    paddingHorizontal: 16,
  },
  callButton: {
    width: 46,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 13,
  },
  declineLink: {
    paddingVertical: 13,
  },
  actionButton: {
    flex: 1,
    justifyContent: 'center',
  },
});
