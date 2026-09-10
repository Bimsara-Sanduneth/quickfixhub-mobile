import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { isAxiosError } from 'axios';
import { Redirect, router, Stack } from 'expo-router';
import { AlertTriangle, ArrowLeft, MessageSquare, Settings } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { acceptBooking, completeBooking, declineBooking, listProviderBookings, startJobBooking, startTravelBooking } from '@/api/bookings';
import { extractErrorMessage } from '@/api/errors';
import { getMyProviderProfile, getMyVerification } from '@/api/providers';
import type { Booking } from '@/api/types';
import { Button } from '@/components/ds/button';
import { Dialog } from '@/components/ds/dialog';
import { Divider } from '@/components/ds/divider';
import { Tag, type TagVariant } from '@/components/ds/tag';
import { NotificationBell } from '@/components/notification-bell';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useTheme } from '@/hooks/use-theme';
import { countdownClock, STATUS_LABEL, STATUS_TAG_VARIANT } from '@/utils/booking';
import { formatCurrency, formatCurrencyCompact } from '@/utils/currency';

// A booking the provider actually chose to accept or turn down - REQUESTED (still undecided) and
// CANCELLED (the customer's call, not the provider's) don't count either way.
const ACCEPT_RATE_RESOLVED: Booking['status'][] = ['ACCEPTED', 'EN_ROUTE', 'IN_PROGRESS', 'COMPLETED', 'DECLINED'];

function formatSchedule(iso: string): string {
  const date = new Date(iso);
  return `${date.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })} · ${date.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })}`;
}

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
}

function isToday(iso: string): boolean {
  const date = new Date(iso);
  const now = new Date();
  return date.getFullYear() === now.getFullYear() && date.getMonth() === now.getMonth() && date.getDate() === now.getDate();
}

function startOfWeek(): Date {
  // Monday-start week, matching the design's "earnings this week" framing.
  const now = new Date();
  const day = (now.getDay() + 6) % 7; // 0=Monday .. 6=Sunday
  const monday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - day);
  monday.setHours(0, 0, 0, 0);
  return monday;
}

export type ScheduleLabel = 'DONE' | 'NEXT' | 'SCHEDULED';

const SCHEDULE_LABEL_VARIANT: Record<ScheduleLabel, TagVariant> = {
  DONE: 'neutral',
  NEXT: 'solid',
  SCHEDULED: 'outline',
};

function computeStats(bookings: Booking[]) {
  const weekStart = startOfWeek();
  const earningsThisWeek = bookings
    .filter((b) => b.status === 'COMPLETED' && b.completedAt && new Date(b.completedAt) >= weekStart)
    .reduce((sum, b) => sum + b.price, 0);

  const resolved = bookings.filter((b) => ACCEPT_RATE_RESOLVED.includes(b.status));
  const accepted = resolved.filter((b) => b.status !== 'DECLINED');
  const acceptRate = resolved.length > 0 ? accepted.length / resolved.length : null;

  const pendingCount = bookings.filter((b) => b.status === 'REQUESTED').length;

  // REQUESTED isn't part of "today's schedule" - an undecided request lives in the requests
  // list above until it's accepted or declined, not mixed in with the day's confirmed jobs.
  const todaysJobs = bookings
    .filter((b) => isToday(b.scheduledAt) && b.status !== 'REQUESTED' && b.status !== 'DECLINED' && b.status !== 'CANCELLED')
    .sort((a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime());

  // The first not-yet-done job (chronologically) is "NEXT" - everything after it is merely
  // "SCHEDULED", matching the design's at-a-glance schedule copy.
  const firstUpcomingIndex = todaysJobs.findIndex((b) => b.status !== 'COMPLETED');
  const todaysSchedule: { booking: Booking; label: ScheduleLabel }[] = todaysJobs.map((b, i) => ({
    booking: b,
    label: b.status === 'COMPLETED' ? 'DONE' : i === firstUpcomingIndex ? 'NEXT' : 'SCHEDULED',
  }));

  // Confirmed jobs beyond today - "New requests" below only holds undecided REQUESTED bookings,
  // so a job already accepted for a future date needs somewhere else to stay visible.
  const upcomingJobs = bookings
    .filter((b) => !isToday(b.scheduledAt) && (b.status === 'ACCEPTED' || b.status === 'EN_ROUTE' || b.status === 'IN_PROGRESS'))
    .sort((a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime());

  return { earningsThisWeek, acceptRate, pendingCount, todaysSchedule, upcomingJobs };
}

export default function ProviderBookingsScreen() {
  const insets = useSafeAreaInsets();
  const theme = useTheme();
  const queryClient = useQueryClient();
  const [declineTarget, setDeclineTarget] = useState<Booking | null>(null);
  const [, forceTick] = useState(0);

  const { data, isPending, isError, error, refetch, isRefetching } = useQuery({
    queryKey: ['bookings', 'provider'],
    queryFn: listProviderBookings,
  });
  const profile = useQuery({ queryKey: ['me', 'provider-profile'], queryFn: getMyProviderProfile });
  const verification = useQuery({ queryKey: ['me', 'verification'], queryFn: getMyVerification });

  // Keeps the per-row accept-window countdown clock ("27:14") live, one shared timer rather
  // than one per row.
  useEffect(() => {
    const id = setInterval(() => forceTick((n) => n + 1), 1_000);
    return () => clearInterval(id);
  }, []);

  function invalidate() {
    queryClient.invalidateQueries({ queryKey: ['bookings', 'provider'] });
  }

  function openChat(booking: Booking) {
    router.push({
      pathname: '/(app)/chat/[bookingId]',
      params: { bookingId: booking.id, otherPartyName: booking.customerName },
    });
  }

  function openDetail(booking: Booking) {
    router.push({ pathname: '/(app)/provider-bookings/[bookingId]', params: { bookingId: booking.id } });
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

  // A PROVIDER-role account with no provider_profile row yet (e.g. they exited onboarding
  // before finishing it) previously just hit a dead-end "No provider profile yet" error here -
  // send them back to finish setup instead.
  const needsOnboarding = isAxiosError(error) && error.response?.status === 404;
  if (needsOnboarding) {
    return <Redirect href="/(app)/provider-onboarding" />;
  }

  const stats = data ? computeStats(data) : null;

  function renderBooking({ item }: { item: Booking }) {
    return (
      <Pressable style={[styles.row, { borderColor: theme.divider }]} onPress={() => openDetail(item)}>
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
        {item.status === 'REQUESTED' && item.expiresAt && (
          <ThemedText type="small" style={[styles.countdown, { color: theme.accent }]}>
            {countdownClock(item.expiresAt)} left to respond
          </ThemedText>
        )}
        <View style={styles.rowBottom}>
          <View style={styles.rowActions}>
            <View>
              {item.status === 'REQUESTED' && (
                <ThemedText type="small" themeColor="textSecondary" style={styles.payoutLabel}>
                  Estimated payout
                </ThemedText>
              )}
              <ThemedText style={styles.price}>{formatCurrency(item.price)}</ThemedText>
            </View>
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
      </Pressable>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />

      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <Pressable onPress={() => router.back()} hitSlop={8}>
          <ArrowLeft size={20} color={theme.text} />
        </Pressable>
        <ThemedText style={styles.headerTitle}>DASHBOARD</ThemedText>
        <View style={styles.headerActions}>
          <NotificationBell />
          <Pressable onPress={() => router.push('/(app)/provider-availability')} hitSlop={8}>
            <Settings size={20} color={theme.text} />
          </Pressable>
        </View>
      </View>
      <Divider style={styles.headerDivider} />

      {verification.data && verification.data.status !== 'APPROVED' && (
        <Pressable
          style={[styles.verificationBanner, { borderColor: theme.accent, backgroundColor: theme.accent100 }]}
          onPress={() => router.push('/(app)/provider-verification')}>
          <AlertTriangle size={16} color={theme.accent} />
          <ThemedText type="small" style={{ color: theme.accent800, flex: 1 }}>
            {verification.data.status === 'REJECTED'
              ? 'Your verification needs attention - tap to review.'
              : 'Upload your verification documents to get a Verified badge.'}
          </ThemedText>
        </Pressable>
      )}

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
          data={data?.filter((b) => b.status === 'REQUESTED')}
          keyExtractor={(item) => item.id}
          refreshing={isRefetching}
          onRefresh={refetch}
          contentContainerStyle={styles.listContent}
          ListHeaderComponent={
            <>
              <View style={[styles.statsGrid, { backgroundColor: theme.divider }]}>
                <View style={[styles.statTile, { backgroundColor: theme.bg }]}>
                  <ThemedText style={styles.statValue}>{formatCurrencyCompact(stats?.earningsThisWeek ?? 0)}</ThemedText>
                  <ThemedText type="small" themeColor="textSecondary" style={styles.statLabel}>
                    This week
                  </ThemedText>
                </View>
                <View style={[styles.statTile, { backgroundColor: theme.bg }]}>
                  <ThemedText style={styles.statValue}>
                    {profile.data?.averageRating != null ? profile.data.averageRating.toFixed(1) : '—'}
                  </ThemedText>
                  <ThemedText type="small" themeColor="textSecondary" style={styles.statLabel}>
                    {profile.data ? `Rating (${profile.data.reviewCount})` : 'Rating'}
                  </ThemedText>
                </View>
                <View style={[styles.statTile, { backgroundColor: theme.bg }]}>
                  <ThemedText style={styles.statValue}>
                    {stats?.acceptRate != null ? `${Math.round(stats.acceptRate * 100)}%` : '—'}
                  </ThemedText>
                  <ThemedText type="small" themeColor="textSecondary" style={styles.statLabel}>
                    Accept rate
                  </ThemedText>
                </View>
              </View>

              {stats && stats.todaysSchedule.length > 0 && (
                <>
                  <ThemedText type="smallBold" style={styles.sectionLabel}>
                    Today&rsquo;s schedule
                  </ThemedText>
                  <View style={styles.scheduleList}>
                    {stats.todaysSchedule.map(({ booking: b, label }) => (
                      <Pressable
                        key={b.id}
                        style={[styles.scheduleRow, { borderColor: theme.divider }]}
                        onPress={() => openDetail(b)}>
                        <ThemedText type="smallBold" style={styles.scheduleTime}>
                          {formatTime(b.scheduledAt)}
                        </ThemedText>
                        <View style={{ flex: 1 }}>
                          <ThemedText type="small">{b.customerName}</ThemedText>
                          <ThemedText type="small" themeColor="textSecondary">
                            {b.serviceName}
                          </ThemedText>
                        </View>
                        <Tag label={label} variant={SCHEDULE_LABEL_VARIANT[label]} />
                      </Pressable>
                    ))}
                  </View>
                  <Divider style={styles.sectionDivider} />
                </>
              )}

              <View style={styles.sectionHeaderRow}>
                <ThemedText type="smallBold">New requests</ThemedText>
                {!!stats?.pendingCount && <Tag label={`${stats.pendingCount} WAITING`} variant="solid" />}
              </View>
            </>
          }
          ListEmptyComponent={
            <ThemedText type="small" themeColor="textSecondary" style={styles.emptyText}>
              No new requests right now.
            </ThemedText>
          }
          renderItem={renderBooking}
          ListFooterComponent={
            stats && stats.upcomingJobs.length > 0 ? (
              <>
                <Divider style={styles.sectionDivider} />
                <ThemedText type="smallBold" style={styles.sectionLabel}>
                  Upcoming jobs
                </ThemedText>
                <View style={styles.scheduleList}>
                  {stats.upcomingJobs.map((b) => (
                    <Pressable key={b.id} style={[styles.scheduleRow, { borderColor: theme.divider }]} onPress={() => openDetail(b)}>
                      <View style={{ flex: 1 }}>
                        <ThemedText type="small" themeColor="textSecondary">
                          {formatSchedule(b.scheduledAt)}
                        </ThemedText>
                        <ThemedText type="small">{b.customerName}</ThemedText>
                        <ThemedText type="small" themeColor="textSecondary">
                          {b.serviceName}
                        </ThemedText>
                      </View>
                      <Tag label={STATUS_LABEL[b.status]} variant={STATUS_TAG_VARIANT[b.status]} />
                    </Pressable>
                  ))}
                </View>
              </>
            ) : null
          }
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
    justifyContent: 'space-between',
    gap: 12,
  },
  headerTitle: {
    fontFamily: 'Archivo_800ExtraBold',
    fontSize: 15,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 18,
  },
  headerDivider: {
    marginTop: 16,
  },
  verificationBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderWidth: 1,
    padding: 12,
    marginHorizontal: 20,
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
  statsGrid: {
    flexDirection: 'row',
    gap: 2,
    marginBottom: 20,
  },
  statTile: {
    flex: 1,
    paddingVertical: 14,
    paddingHorizontal: 10,
  },
  statValue: {
    fontFamily: 'Archivo_800ExtraBold',
    fontSize: 18,
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 11,
  },
  sectionLabel: {
    marginBottom: 10,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  scheduleList: {
    gap: 8,
    marginBottom: 8,
  },
  scheduleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderWidth: 1,
    padding: 10,
  },
  scheduleTime: {
    width: 60,
  },
  sectionDivider: {
    marginVertical: 20,
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
  countdown: {
    marginBottom: 2,
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
  payoutLabel: {
    fontSize: 10,
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
