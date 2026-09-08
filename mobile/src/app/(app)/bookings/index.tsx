import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { router, Stack } from 'expo-router';
import { ArrowLeft } from 'lucide-react-native';
import { useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { cancelBooking, listMyBookings } from '@/api/bookings';
import { extractErrorMessage } from '@/api/errors';
import { createReview } from '@/api/reviews';
import type { Booking, BookingStatus } from '@/api/types';
import { Button } from '@/components/ds/button';
import { Dialog } from '@/components/ds/dialog';
import { Divider } from '@/components/ds/divider';
import { Tag, type TagVariant } from '@/components/ds/tag';
import { TextField } from '@/components/ds/text-field';
import { StarRating } from '@/components/star-rating';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useTheme } from '@/hooks/use-theme';

const STATUS_TAG_VARIANT: Record<BookingStatus, TagVariant> = {
  PENDING: 'outline',
  CONFIRMED: 'accent',
  COMPLETED: 'solid',
  CANCELLED: 'neutral',
  DECLINED: 'neutral',
};

function formatSchedule(iso: string): string {
  const date = new Date(iso);
  return `${date.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })} · ${date.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })}`;
}

export default function MyBookingsScreen() {
  const insets = useSafeAreaInsets();
  const theme = useTheme();
  const queryClient = useQueryClient();
  const [cancelTarget, setCancelTarget] = useState<Booking | null>(null);
  const [reviewTarget, setReviewTarget] = useState<Booking | null>(null);
  const [reviewRating, setReviewRating] = useState(0);
  const [reviewComment, setReviewComment] = useState('');

  const { data, isPending, isError, error, refetch, isRefetching } = useQuery({
    queryKey: ['bookings'],
    queryFn: listMyBookings,
  });

  const cancelMutation = useMutation({
    mutationFn: (id: string) => cancelBooking(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bookings'] });
      setCancelTarget(null);
    },
  });

  const reviewMutation = useMutation({
    mutationFn: () =>
      createReview(reviewTarget!.id, { rating: reviewRating, comment: reviewComment.trim() || undefined }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bookings'] });
      queryClient.invalidateQueries({ queryKey: ['providers', reviewTarget?.providerProfileId] });
      closeReviewDialog();
    },
  });

  function openReviewDialog(booking: Booking) {
    setReviewTarget(booking);
    setReviewRating(0);
    setReviewComment('');
  }

  function closeReviewDialog() {
    setReviewTarget(null);
    setReviewRating(0);
    setReviewComment('');
  }

  function renderBooking({ item }: { item: Booking }) {
    const cancellable = item.status === 'PENDING' || item.status === 'CONFIRMED';
    const reviewable = item.status === 'COMPLETED' && !item.reviewed;
    return (
      <View style={[styles.row, { borderColor: theme.divider }]}>
        <View style={styles.rowTop}>
          <ThemedText style={styles.providerName}>{item.providerBusinessName}</ThemedText>
          <Tag label={item.status} variant={STATUS_TAG_VARIANT[item.status]} />
        </View>
        <ThemedText type="small" themeColor="textSecondary">
          {item.serviceName}
        </ThemedText>
        <ThemedText type="small" themeColor="textSecondary" style={styles.schedule}>
          {formatSchedule(item.scheduledAt)} · {item.addressLabel}
        </ThemedText>
        <View style={styles.rowBottom}>
          <ThemedText style={styles.price}>${item.price.toFixed(2)}</ThemedText>
          {cancellable && (
            <Pressable onPress={() => setCancelTarget(item)} hitSlop={6}>
              <ThemedText type="small" style={{ color: theme.accent }}>
                Cancel
              </ThemedText>
            </Pressable>
          )}
          {reviewable && (
            <Pressable onPress={() => openReviewDialog(item)} hitSlop={6}>
              <ThemedText type="small" style={{ color: theme.accent }}>
                Leave a review
              </ThemedText>
            </Pressable>
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
        <ThemedText style={styles.headerTitle}>MY BOOKINGS</ThemedText>
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
              No bookings yet. Find a provider and request one.
            </ThemedText>
          }
          renderItem={renderBooking}
        />
      )}

      <Dialog
        visible={!!cancelTarget}
        title="Cancel booking?"
        body={cancelTarget ? `This cancels your booking with ${cancelTarget.providerBusinessName}.` : undefined}
        onRequestClose={() => setCancelTarget(null)}
        actions={
          <>
            <Button label="Keep it" variant="ghost" onPress={() => setCancelTarget(null)} />
            <Button
              label="Cancel booking"
              loading={cancelMutation.isPending}
              onPress={() => cancelTarget && cancelMutation.mutate(cancelTarget.id)}
            />
          </>
        }
      />

      <Dialog
        visible={!!reviewTarget}
        title={reviewTarget ? `Rate ${reviewTarget.providerBusinessName}` : 'Rate'}
        onRequestClose={closeReviewDialog}
        actions={
          <>
            <Button label="Cancel" variant="ghost" onPress={closeReviewDialog} />
            <Button
              label="Submit review"
              disabled={reviewRating === 0}
              loading={reviewMutation.isPending}
              onPress={() => reviewMutation.mutate()}
            />
          </>
        }>
        <StarRating rating={reviewRating} onChange={setReviewRating} size={28} style={styles.reviewStars} />
        <TextField
          placeholder="How did it go? (optional)"
          value={reviewComment}
          onChangeText={setReviewComment}
          multiline
          numberOfLines={3}
          style={styles.reviewCommentInput}
        />
        {reviewMutation.isError && (
          <ThemedText type="small" style={{ color: theme.accent }}>
            {extractErrorMessage(reviewMutation.error)}
          </ThemedText>
        )}
      </Dialog>
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
  providerName: {
    fontFamily: 'Archivo_800ExtraBold',
    fontSize: 15,
  },
  schedule: {
    marginBottom: 6,
  },
  rowBottom: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  price: {
    fontFamily: 'Archivo_800ExtraBold',
    fontSize: 15,
  },
  reviewStars: {
    marginBottom: 12,
  },
  reviewCommentInput: {
    minHeight: 64,
    textAlignVertical: 'top',
  },
});
