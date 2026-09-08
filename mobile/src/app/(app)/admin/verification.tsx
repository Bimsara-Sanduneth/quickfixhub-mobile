import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { router, Stack } from 'expo-router';
import { ArrowLeft, Check } from 'lucide-react-native';
import { ActivityIndicator, FlatList, Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { listPendingProviders, verifyProvider } from '@/api/admin';
import type { AdminProvider } from '@/api/types';
import { Button } from '@/components/ds/button';
import { Divider } from '@/components/ds/divider';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useTheme } from '@/hooks/use-theme';

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}

export default function AdminVerificationScreen() {
  const insets = useSafeAreaInsets();
  const theme = useTheme();
  const queryClient = useQueryClient();

  const { data, isPending } = useQuery({ queryKey: ['admin', 'providers', 'pending'], queryFn: listPendingProviders });

  const verifyMutation = useMutation({
    mutationFn: verifyProvider,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'providers', 'pending'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'overview'] });
    },
  });

  function renderProvider({ item }: { item: AdminProvider }) {
    return (
      <View style={[styles.row, { borderColor: theme.divider }]}>
        <ThemedText style={styles.businessName}>{item.businessName}</ThemedText>
        <ThemedText type="small" themeColor="textSecondary">
          {item.ownerEmail}
        </ThemedText>
        {item.city && (
          <ThemedText type="small" themeColor="textSecondary">
            {item.city}
            {item.yearsExperience != null ? ` · ${item.yearsExperience} yr experience` : ''}
          </ThemedText>
        )}
        {item.bio && (
          <ThemedText type="small" themeColor="textSecondary" style={styles.bio}>
            {item.bio}
          </ThemedText>
        )}
        <View style={styles.rowBottom}>
          <ThemedText type="small" themeColor="textSecondary">
            Applied {formatDate(item.createdAt)}
          </ThemedText>
          <Button
            label="Verify"
            icon={<Check size={15} color={theme.bg} />}
            loading={verifyMutation.isPending && verifyMutation.variables === item.id}
            onPress={() => verifyMutation.mutate(item.id)}
          />
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
        <ThemedText style={styles.headerTitle}>VERIFICATION QUEUE</ThemedText>
      </View>
      <Divider style={styles.headerDivider} />

      {isPending ? (
        <ActivityIndicator style={styles.loading} />
      ) : (
        <FlatList
          data={data}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <ThemedText type="small" themeColor="textSecondary" style={styles.emptyText}>
              No providers waiting on verification.
            </ThemedText>
          }
          renderItem={renderProvider}
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
  businessName: {
    fontFamily: 'Archivo_800ExtraBold',
    fontSize: 15,
  },
  bio: {
    marginTop: 4,
    lineHeight: 18,
  },
  rowBottom: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 8,
  },
});
