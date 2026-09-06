import { useQuery } from '@tanstack/react-query';
import { router, Stack } from 'expo-router';
import { ActivityIndicator, FlatList, Pressable, StyleSheet } from 'react-native';

import { listCategories } from '@/api/catalog';
import { extractErrorMessage } from '@/api/errors';
import type { ServiceCategory } from '@/api/types';
import { useAuth } from '@/auth/AuthContext';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export default function CategoryBrowseScreen() {
  const { logout } = useAuth();
  const theme = useTheme();
  const { data, isPending, isError, error, refetch, isRefetching } = useQuery({
    queryKey: ['categories'],
    queryFn: listCategories,
  });

  function openCategory(category: ServiceCategory) {
    router.push({
      pathname: '/(app)/categories/[categoryId]',
      params: { categoryId: category.id, name: category.name },
    });
  }

  return (
    <ThemedView style={styles.container}>
      <Stack.Screen
        options={{
          title: 'Browse services',
          headerRight: () => (
            <Pressable onPress={logout} hitSlop={8}>
              <ThemedText type="link">Log out</ThemedText>
            </Pressable>
          ),
        }}
      />

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

      {data && (
        <FlatList
          data={data}
          keyExtractor={(item) => item.id}
          refreshing={isRefetching}
          onRefresh={refetch}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <Pressable
              onPress={() => openCategory(item)}
              style={[styles.row, { borderColor: theme.backgroundSelected }]}>
              <ThemedView style={styles.rowContent}>
                <ThemedText type="default">{item.name}</ThemedText>
                {item.description && (
                  <ThemedText type="small" themeColor="textSecondary">
                    {item.description}
                  </ThemedText>
                )}
              </ThemedView>
              <ThemedText themeColor="textSecondary">{'>'}</ThemedText>
            </Pressable>
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderRadius: 8,
    padding: Spacing.three,
    gap: Spacing.two,
  },
  rowContent: {
    flex: 1,
    gap: 2,
  },
});
