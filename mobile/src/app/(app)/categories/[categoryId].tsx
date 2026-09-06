import { useQuery } from '@tanstack/react-query';
import { Stack, useLocalSearchParams } from 'expo-router';
import { ActivityIndicator, FlatList, Pressable, StyleSheet } from 'react-native';

import { searchServices } from '@/api/catalog';
import { extractErrorMessage } from '@/api/errors';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export default function CategoryServicesScreen() {
  const { categoryId, name } = useLocalSearchParams<{ categoryId: string; name?: string }>();
  const theme = useTheme();

  const { data, isPending, isError, error, refetch, isRefetching } = useQuery({
    queryKey: ['services', { categoryId }],
    queryFn: () => searchServices({ categoryId }),
    enabled: !!categoryId,
  });

  return (
    <ThemedView style={styles.container}>
      <Stack.Screen options={{ title: name ?? 'Services' }} />

      {isPending && (
        <ThemedView style={styles.centered}>
          <ActivityIndicator />
        </ThemedView>
      )}

      {isError && (
        <ThemedView style={styles.centered}>
          <ThemedText type="small" style={styles.error}>
            {extractErrorMessage(error)}
          </ThemedText>
          <Pressable onPress={() => refetch()}>
            <ThemedText type="link">Try again</ThemedText>
          </Pressable>
        </ThemedView>
      )}

      {data && data.content.length === 0 && (
        <ThemedView style={styles.centered}>
          <ThemedText type="default">No services in this category yet.</ThemedText>
        </ThemedView>
      )}

      {data && data.content.length > 0 && (
        <FlatList
          data={data.content}
          keyExtractor={(item) => item.id}
          refreshing={isRefetching}
          onRefresh={refetch}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <ThemedView style={[styles.row, { borderColor: theme.backgroundSelected }]}>
              <ThemedText type="default">{item.name}</ThemedText>
              {item.description && (
                <ThemedText type="small" themeColor="textSecondary">
                  {item.description}
                </ThemedText>
              )}
            </ThemedView>
          )}
        />
      )}
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
  row: {
    borderWidth: 1,
    borderRadius: 8,
    padding: Spacing.three,
    gap: 2,
  },
});
