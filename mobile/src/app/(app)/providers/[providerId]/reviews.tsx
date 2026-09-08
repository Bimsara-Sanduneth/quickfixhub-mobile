import { useQuery } from '@tanstack/react-query';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import { ArrowLeft } from 'lucide-react-native';
import { ActivityIndicator, FlatList, Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { extractErrorMessage } from '@/api/errors';
import { listProviderReviews } from '@/api/reviews';
import { REVIEW_TAG_LABEL, type Review, type ReviewTag } from '@/api/types';
import { Divider } from '@/components/ds/divider';
import { Tag } from '@/components/ds/tag';
import { StarRating } from '@/components/star-rating';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useTheme } from '@/hooks/use-theme';

export default function ProviderReviewsScreen() {
  const { providerId } = useLocalSearchParams<{ providerId: string }>();
  const insets = useSafeAreaInsets();
  const theme = useTheme();

  const { data, isPending, isError, error, refetch, isRefetching } = useQuery({
    queryKey: ['providers', providerId, 'reviews'],
    queryFn: () => listProviderReviews(providerId),
    enabled: !!providerId,
  });

  function renderReview({ item }: { item: Review }) {
    return (
      <View style={[styles.row, { borderColor: theme.divider }]}>
        <View style={styles.rowHeader}>
          <ThemedText type="smallBold">{item.reviewerFirstName}</ThemedText>
          <StarRating rating={item.rating} size={13} />
        </View>
        {item.comment && (
          <ThemedText type="small" themeColor="textSecondary" style={styles.comment}>
            {item.comment}
          </ThemedText>
        )}
        {item.tags.length > 0 && (
          <View style={styles.tagRow}>
            {item.tags.map((tag) => (
              <Tag key={tag} label={REVIEW_TAG_LABEL[tag as ReviewTag] ?? tag} variant="neutral" />
            ))}
          </View>
        )}
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
        <ThemedText style={styles.headerTitle}>REVIEWS</ThemedText>
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
          data={data?.content ?? []}
          keyExtractor={(item) => item.id}
          refreshing={isRefetching}
          onRefresh={refetch}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <ThemedText type="small" themeColor="textSecondary" style={styles.emptyText}>
              No reviews yet.
            </ThemedText>
          }
          renderItem={renderReview}
        />
      )}
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
  },
  emptyText: {
    textAlign: 'center',
    paddingVertical: 32,
  },
  row: {
    borderBottomWidth: 1,
    paddingBottom: 12,
    marginBottom: 12,
  },
  rowHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  comment: {
    lineHeight: 18,
  },
  tagRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 8,
  },
});
