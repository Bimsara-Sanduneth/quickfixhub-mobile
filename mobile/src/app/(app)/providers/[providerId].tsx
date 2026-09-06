import { useQuery } from '@tanstack/react-query';
import { Stack, useLocalSearchParams } from 'expo-router';
import { ActivityIndicator, FlatList, Pressable, StyleSheet } from 'react-native';

import { extractErrorMessage } from '@/api/errors';
import { getProvider } from '@/api/providers';
import type { ProviderServiceItem } from '@/api/types';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export default function ProviderDetailScreen() {
  const { providerId } = useLocalSearchParams<{ providerId: string }>();
  const theme = useTheme();

  const { data, isPending, isError, error, refetch } = useQuery({
    queryKey: ['providers', providerId],
    queryFn: () => getProvider(providerId),
    enabled: !!providerId,
  });

  if (isPending) {
    return (
      <ThemedView style={styles.centered}>
        <Stack.Screen options={{ title: 'Provider' }} />
        <ActivityIndicator />
      </ThemedView>
    );
  }

  if (isError) {
    return (
      <ThemedView style={styles.centered}>
        <Stack.Screen options={{ title: 'Provider' }} />
        <ThemedText type="small" style={styles.error}>
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
      <ThemedView style={[styles.serviceRow, { borderColor: theme.backgroundSelected }]}>
        <ThemedView style={styles.serviceInfo}>
          <ThemedText type="default">{item.serviceName}</ThemedText>
          {item.durationMinutes != null && (
            <ThemedText type="small" themeColor="textSecondary">
              ~{item.durationMinutes} min
            </ThemedText>
          )}
        </ThemedView>
        <ThemedText type="smallBold">${item.price.toFixed(2)}</ThemedText>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <Stack.Screen options={{ title: data.businessName }} />

      <FlatList
        data={data.services}
        keyExtractor={(item) => item.serviceId}
        contentContainerStyle={styles.list}
        ListHeaderComponent={
          <ThemedView style={styles.header}>
            <ThemedView style={styles.titleRow}>
              <ThemedText type="title" style={styles.businessName}>
                {data.businessName}
              </ThemedText>
              {data.verified && (
                <ThemedView style={[styles.badge, { backgroundColor: theme.backgroundSelected }]}>
                  <ThemedText type="small">Verified</ThemedText>
                </ThemedView>
              )}
            </ThemedView>

            {(data.city || data.yearsExperience != null) && (
              <ThemedText type="small" themeColor="textSecondary">
                {[data.city, data.yearsExperience != null ? `${data.yearsExperience} yrs experience` : null]
                  .filter(Boolean)
                  .join(' · ')}
              </ThemedText>
            )}

            {data.bio && <ThemedText type="default">{data.bio}</ThemedText>}

            <ThemedText type="smallBold" style={styles.servicesHeading}>
              Services offered
            </ThemedText>
          </ThemedView>
        }
        ListEmptyComponent={<ThemedText type="default">No services listed yet.</ThemedText>}
        renderItem={renderService}
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
    gap: Spacing.two,
  },
  error: {
    color: '#d33',
    textAlign: 'center',
  },
  list: {
    padding: Spacing.three,
    gap: Spacing.two,
  },
  header: {
    gap: Spacing.two,
    marginBottom: Spacing.three,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  businessName: {
    textAlign: 'left',
    fontSize: 28,
    lineHeight: 32,
  },
  badge: {
    borderRadius: 6,
    paddingHorizontal: Spacing.two,
    paddingVertical: 2,
  },
  servicesHeading: {
    marginTop: Spacing.two,
  },
  serviceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderRadius: 8,
    padding: Spacing.three,
    gap: Spacing.two,
  },
  serviceInfo: {
    flex: 1,
    gap: 2,
  },
});
