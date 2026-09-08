import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { router, Stack } from 'expo-router';
import { ArrowLeft, MessageSquare } from 'lucide-react-native';
import { useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { acceptBooking, completeBooking, declineBooking, listProviderBookings, startJobBooking, startTravelBooking } from '@/api/bookings';
import { extractErrorMessage } from '@/api/errors';
import type { Booking, BookingStatus } from '@/api/types';
import { Button } from '@/components/ds/button';
import { Dialog } from '@/components/ds/dialog';
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

function formatSchedule(iso: string): string {
  const date = new Date(iso);
  return `${date.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })} · ${date.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })}`;
}

export default function ProviderBookingsScreen() {
  const insets = useSafeAreaInsets();
  const theme = useTheme();
  const queryClient = useQueryClient();
  const [declineTarget, setDeclineTarget] = useState<Booking | null>(null);

  const { data, isPending, isError, error, refetch, isRefetching } = useQuery({
    queryKey: ['bookings', 'provider'],
    queryFn: listProviderBookings,
  });

  function invalidate() {
    queryClient.invalidateQueries({ queryKey: ['bookings', 'provider'] });
  }

  function openChat(booking: Booking) {
    router.push({
      pathname: '/(app)/chat/[bookingId]',
      params: { bookingId: booking.id, otherPartyName: booking.customerName },
    });
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
    },
  });

  function renderBooking({ item }: { item: Booking }) {
    return (
      <View style={[styles.row, { borderColor: theme.divider }]}>
        <View style={styles.rowTop}>
          <ThemedText style={styles.customerName}>{item.customerName}</ThemedText>
          <Tag label={STATUS_LABEL[item.status]} variant={STATUS_TAG_VARIANT[item.status]} />
        </View>
        <ThemedText type="small" themeColor="textSecondary">
          {item.serviceName}
        </ThemedText>
        <ThemedText type="small" themeColor="textSecondary" style={styles.schedule}>
          {formatSchedule(item.scheduledAt)} · {item.addressText}
        </ThemedText>
        {item.notes && (
          <ThemedText type="small" themeColor="textSecondary" style={styles.notes}>
            &ldquo;{item.notes}&rdquo;
          </ThemedText>
        )}
        <View style={styles.rowBottom}>
          <View style={styles.rowActions}>
            <ThemedText style={styles.price}>{formatCurrency(item.price)}</ThemedText>
            <Pressable onPress={() => openChat(item)} hitSlop={6}>
              <MessageSquare size={16} color={theme.text} />
            </Pressable>
          </View>
          {item.status === 'REQUESTED' && (
            <View style={styles.actions}>
              <Pressable onPress={() => setDeclineTarget(item)} hitSlop={6}>
                <ThemedText type="small" style={{ color: theme.accent }}>
                  Decline
                </ThemedText>
              </Pressable>
              <Button
                label="Accept"
                loading={acceptMutation.isPending && acceptMutation.variables === item.id}
                onPress={() => acceptMutation.mutate(item.id)}
              />
            </View>
          )}
          {item.status === 'ACCEPTED' && (
            <Button
              label="Start travel"
              variant="secondary"
              loading={startTravelMutation.isPending && startTravelMutation.variables === item.id}
              onPress={() => startTravelMutation.mutate(item.id)}
            />
          )}
          {item.status === 'EN_ROUTE' && (
            <Button
              label="Start job"
              variant="secondary"
              loading={startJobMutation.isPending && startJobMutation.variables === item.id}
              onPress={() => startJobMutation.mutate(item.id)}
            />
          )}
          {item.status === 'IN_PROGRESS' && (
            <Button
              label="Mark complete"
              variant="secondary"
              loading={completeMutation.isPending && completeMutation.variables === item.id}
              onPress={() => completeMutation.mutate(item.id)}
            />
          )}
        </View>
      </View>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />

      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <Pressable onPress={() => router.back()} hitSlop={8}>
          <ArrowLeft size={20} color={theme.text} />
        </Pressable>
        <ThemedText style={styles.headerTitle}>BOOKING REQUESTS</ThemedText>
      </View>
      <Divider style={styles.headerDivider} />

      {isPending ? (
        <ActivityIndicator style={styles.loading} />
      ) : isError ? (
        <View style={styles.centered}>
          <ThemedText type="small" style={{ color: theme.accent }}>
            {extractErrorMessage(error)}
          </ThemedText>
          <Pressable onPress={() => refetch()}>
            <ThemedText type="link">Try again</ThemedText>
          </Pressable>
        </View>
      ) : (
        <FlatList
          data={data}
          keyExtractor={(item) => item.id}
          refreshing={isRefetching}
          onRefresh={refetch}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <ThemedText type="small" themeColor="textSecondary" style={styles.emptyText}>
              No booking requests yet.
            </ThemedText>
          }
          renderItem={renderBooking}
        />
      )}

      <Dialog
        visible={!!declineTarget}
        title="Decline this booking?"
        body={declineTarget ? `${declineTarget.customerName} will need to book someone else.` : undefined}
        onRequestClose={() => setDeclineTarget(null)}
        actions={
          <>
            <Button label="Keep it" variant="ghost" onPress={() => setDeclineTarget(null)} />
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
  header: {
    paddingHorizontal: 24,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerTitle: {
    fontFamily: 'Archivo_800ExtraBold',
    fontSize: 15,
  },
  headerDivider: {
    marginTop: 16,
  },
  loading: {
    marginTop: 32,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  listContent: {
    flexGrow: 1,
    padding: 20,
    gap: 12,
  },
  emptyText: {
    textAlign: 'center',
    paddingVertical: 32,
  },
  row: {
    borderWidth: 1,
    padding: 14,
    gap: 4,
  },
  rowTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 2,
  },
  customerName: {
    fontFamily: 'Archivo_800ExtraBold',
    fontSize: 15,
  },
  schedule: {
    marginBottom: 4,
  },
  notes: {
    fontStyle: 'italic',
    marginBottom: 6,
  },
  rowBottom: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 6,
  },
  rowActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  price: {
    fontFamily: 'Archivo_800ExtraBold',
    fontSize: 15,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
});
