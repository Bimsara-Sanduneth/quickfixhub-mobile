import { useQuery } from '@tanstack/react-query';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import { ArrowLeft, MessageSquare, Phone } from 'lucide-react-native';
import { useMemo } from 'react';
import { ActivityIndicator, FlatList, Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { extractErrorMessage } from '@/api/errors';
import { getProvider } from '@/api/providers';
import { listProviderReviews } from '@/api/reviews';
import type { ProviderServiceItem } from '@/api/types';
import { Button } from '@/components/ds/button';
import { Tag } from '@/components/ds/tag';
import { StarRating } from '@/components/star-rating';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useTheme } from '@/hooks/use-theme';
import { formatCurrency } from '@/utils/currency';

const REVIEWS_PREVIEW_COUNT = 3;

export default function ProviderDetailScreen() {
  const { providerId } = useLocalSearchParams<{ providerId: string }>();
  const insets = useSafeAreaInsets();
  const theme = useTheme();

  const { data, isPending, isError, error, refetch } = useQuery({
    queryKey: ['providers', providerId],
    queryFn: () => getProvider(providerId),
    enabled: !!providerId,
  });
  const reviews = useQuery({
    queryKey: ['providers', providerId, 'reviews'],
    queryFn: () => listProviderReviews(providerId),
    enabled: !!providerId,
  });

  const fromPrice = useMemo(() => {
    if (!data || data.services.length === 0) return null;
    return Math.min(...data.services.map((s) => s.price));
  }, [data]);

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
        {backButton}
        <ActivityIndicator />
      </ThemedView>
    );
  }

  if (isError) {
    return (
      <ThemedView style={styles.centered}>
        <Stack.Screen options={{ headerShown: false }} />
        {backButton}
        <ThemedText type="small" style={{ color: theme.accent }}>
          {extractErrorMessage(error)}
        </ThemedText>
        <Pressable onPress={() => refetch()}>
          <ThemedText type="link">Try again</ThemedText>
        </Pressable>
      </ThemedView>
    );
  }

  function renderService({ item }: { item: ProviderServiceItem }) {
    return (
      <View style={[styles.serviceRow, { borderColor: theme.divider }]}>
        <ThemedText style={styles.serviceName}>{item.serviceName}</ThemedText>
        <ThemedText style={styles.servicePrice}>{formatCurrency(item.price)}</ThemedText>
      </View>
    );
  }

  const reviewsFooter = (
    <View style={styles.reviewsSection}>
      <View style={styles.reviewsHeadingRow}>
        <ThemedText type="smallBold">Reviews {data.reviewCount > 0 ? `(${data.reviewCount})` : ''}</ThemedText>
        {data.reviewCount > REVIEWS_PREVIEW_COUNT && (
          <Pressable onPress={() => router.push({ pathname: '/(app)/providers/[providerId]/reviews', params: { providerId: data.id } })}>
            <ThemedText type="small" style={{ color: theme.accent }}>
              See all
            </ThemedText>
          </Pressable>
        )}
      </View>
      {reviews.isPending ? (
        <ActivityIndicator style={styles.sectionLoading} />
      ) : reviews.data && reviews.data.content.length === 0 ? (
        <ThemedText type="small" themeColor="textSecondary">
          No reviews yet.
        </ThemedText>
      ) : (
        reviews.data?.content.slice(0, REVIEWS_PREVIEW_COUNT).map((review) => (
          <View key={review.id} style={[styles.reviewRow, { borderColor: theme.divider }]}>
            <View style={styles.reviewHeaderRow}>
              <ThemedText type="smallBold">{review.reviewerFirstName}</ThemedText>
              <StarRating rating={review.rating} size={12} />
            </View>
            {review.comment && (
              <ThemedText type="small" themeColor="textSecondary" style={styles.reviewComment}>
                {review.comment}
              </ThemedText>
            )}
          </View>
        ))
      )}
    </View>
  );

  return (
    <ThemedView style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />

      <FlatList
        data={data.services}
        keyExtractor={(item) => item.serviceId}
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={
          <>
            <View style={[styles.coverPhoto, { backgroundColor: theme.neutral300 }]} />
            {backButton}

            <View style={styles.profileRow}>
              <View style={styles.avatarRow}>
                <View style={[styles.avatar, { backgroundColor: theme.neutral200, borderColor: theme.bg }]} />
                <View style={styles.actionIcons}>
                  {/* No calling/chat system yet - decorative for now. */}
                  <View style={[styles.actionIcon, { borderColor: theme.divider }]}>
                    <Phone size={17} color={theme.text} />
                  </View>
                  <View style={[styles.actionIcon, { borderColor: theme.divider }]}>
                    <MessageSquare size={17} color={theme.text} />
                  </View>
                </View>
              </View>

              <ThemedText style={styles.businessName}>{data.businessName}</ThemedText>
              <View style={styles.metaRow}>
                {data.verified && <Tag label="VERIFIED" variant="accent" />}
                {data.averageRating != null && (
                  <View style={styles.ratingBadge}>
                    <StarRating rating={data.averageRating} size={13} />
                    <ThemedText type="small" themeColor="textSecondary">
                      {data.averageRating.toFixed(1)} ({data.reviewCount})
                    </ThemedText>
                  </View>
                )}
                {data.city && (
                  <ThemedText type="small" themeColor="textSecondary">
                    {data.city}
                  </ThemedText>
                )}
              </View>
            </View>

            {(data.services.length > 0 || data.yearsExperience != null) && (
              <View style={[styles.statsRow, { borderColor: theme.divider }]}>
                <View style={styles.statTile}>
                  <ThemedText style={styles.statValue}>{data.services.length}</ThemedText>
                  <ThemedText type="small" themeColor="textSecondary" style={styles.statLabel}>
                    SERVICES
                  </ThemedText>
                </View>
                {data.yearsExperience != null && (
                  <View style={[styles.statTile, styles.statTileBordered, { borderColor: theme.divider }]}>
                    <ThemedText style={styles.statValue}>{data.yearsExperience} yr</ThemedText>
                    <ThemedText type="small" themeColor="textSecondary" style={styles.statLabel}>
                      EXPERIENCE
                    </ThemedText>
                  </View>
                )}
              </View>
            )}

            <View style={styles.body}>
              {data.bio && (
                <ThemedText type="small" themeColor="textSecondary" style={styles.bio}>
                  {data.bio}
                </ThemedText>
              )}
              <ThemedText type="smallBold" style={styles.servicesHeading}>
                Services &amp; estimated pricing
              </ThemedText>
            </View>
          </>
        }
        ListEmptyComponent={
          <ThemedText type="default" style={styles.body}>
            No services listed yet.
          </ThemedText>
        }
        renderItem={renderService}
        ListFooterComponent={reviewsFooter}
      />

      <View style={[styles.footer, { borderTopColor: theme.divider, paddingBottom: insets.bottom + 16 }]}>
        <View style={styles.footerRow}>
          {fromPrice != null && (
            <View>
              <ThemedText type="small" themeColor="textSecondary" style={styles.fromLabel}>
                FROM
              </ThemedText>
              <ThemedText style={styles.fromPrice}>{formatCurrency(fromPrice)}</ThemedText>
            </View>
          )}
          <Button
            label="Request booking"
            style={styles.bookButton}
            disabled={data.services.length === 0}
            onPress={() => router.push({ pathname: '/(app)/bookings/new', params: { providerId: data.id } })}
          />
        </View>
      </View>
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
  listContent: {
    flexGrow: 1,
  },
  backButton: {
    position: 'absolute',
    left: 16,
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  coverPhoto: {
    height: 196,
  },
  profileRow: {
    marginTop: -46,
    paddingHorizontal: 20,
  },
  avatarRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
  },
  avatar: {
    width: 92,
    height: 92,
    borderWidth: 3,
  },
  actionIcons: {
    flexDirection: 'row',
    gap: 8,
  },
  actionIcon: {
    width: 36,
    height: 36,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  businessName: {
    fontFamily: 'Archivo_800ExtraBold',
    fontSize: 28,
    marginTop: 14,
    marginBottom: 4,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  ratingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  statsRow: {
    flexDirection: 'row',
    marginHorizontal: 20,
    marginTop: 6,
    borderTopWidth: 2,
    borderBottomWidth: 2,
  },
  statTile: {
    flex: 1,
    paddingVertical: 12,
  },
  statTileBordered: {
    paddingLeft: 12,
  },
  statValue: {
    fontFamily: 'Archivo_800ExtraBold',
    fontSize: 22,
  },
  statLabel: {
    fontSize: 10,
    letterSpacing: 0.5,
  },
  body: {
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  bio: {
    lineHeight: 19,
    marginBottom: 16,
  },
  servicesHeading: {
    marginBottom: 4,
  },
  serviceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 9,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
  },
  serviceName: {
    fontSize: 13.5,
    fontWeight: '600',
  },
  servicePrice: {
    fontFamily: 'Archivo_800ExtraBold',
    fontSize: 13,
  },
  reviewsSection: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 8,
  },
  reviewsHeadingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  sectionLoading: {
    marginVertical: 12,
  },
  reviewRow: {
    borderBottomWidth: 1,
    paddingBottom: 10,
    marginBottom: 10,
  },
  reviewHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  reviewComment: {
    lineHeight: 18,
  },
  footer: {
    borderTopWidth: 2,
    paddingHorizontal: 20,
    paddingTop: 12,
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  fromLabel: {
    fontSize: 10,
    letterSpacing: 0.5,
  },
  fromPrice: {
    fontFamily: 'Archivo_800ExtraBold',
    fontSize: 20,
  },
  bookButton: {
    flex: 1,
  },
});
