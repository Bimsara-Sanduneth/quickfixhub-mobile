import { useQuery } from '@tanstack/react-query';
import { router, Stack } from 'expo-router';
import { ArrowLeft, ChevronRight } from 'lucide-react-native';
import { useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { listProvidersByStatus } from '@/api/admin';
import type { AdminProvider, VerificationStatus } from '@/api/types';
import { Divider } from '@/components/ds/divider';
import { Tag, type TagVariant } from '@/components/ds/tag';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useTheme } from '@/hooks/use-theme';

const TABS: VerificationStatus[] = ['PENDING', 'APPROVED', 'REJECTED'];

const STATUS_TAG_VARIANT: Record<VerificationStatus, TagVariant> = {
  PENDING: 'solid',
  APPROVED: 'accent',
  REJECTED: 'neutral',
};

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}

export default function AdminVerificationScreen() {
  const insets = useSafeAreaInsets();
  const theme = useTheme();
  const [tab, setTab] = useState<VerificationStatus>('PENDING');

  const { data, isPending } = useQuery({
    queryKey: ['admin', 'providers', tab],
    queryFn: () => listProvidersByStatus(tab),
  });

  function openDetail(provider: AdminProvider) {
    router.push({ pathname: '/(app)/admin/verification/[providerId]', params: { providerId: provider.id } });
  }

  function renderProvider({ item }: { item: AdminProvider }) {
    return (
      <Pressable style={[styles.row, { borderColor: theme.divider }]} onPress={() => openDetail(item)}>
        <View style={styles.rowTop}>
          <ThemedText style={styles.businessName}>{item.businessName}</ThemedText>
          <ChevronRight size={16} color={theme.neutral500} />
        </View>
        <ThemedText type="small" themeColor="textSecondary">
          {item.ownerEmail}
        </ThemedText>
        {item.city && (
          <ThemedText type="small" themeColor="textSecondary">
            {item.city}
            {item.yearsExperience != null ? ` · ${item.yearsExperience} yr experience` : ''}
          </ThemedText>
        )}
        <View style={styles.rowBottom}>
          <ThemedText type="small" themeColor="textSecondary">
            Applied {formatDate(item.createdAt)}
          </ThemedText>
          <Tag label={`${item.checkedDocumentCount}/${item.documentCount} docs checked`} variant={STATUS_TAG_VARIANT[item.verificationStatus]} />
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
        <ThemedText style={styles.headerTitle}>VERIFICATION QUEUE</ThemedText>
      </View>
      <Divider style={styles.headerDivider} />

      <View style={styles.tabRow}>
        {TABS.map((t) => (
          <Pressable key={t} onPress={() => setTab(t)}>
            <Tag label={t} variant={tab === t ? 'solid' : 'outline'} />
          </Pressable>
        ))}
      </View>

      {isPending ? (
        <ActivityIndicator style={styles.loading} />
      ) : (
        <FlatList
          data={data}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <ThemedText type="small" themeColor="textSecondary" style={styles.emptyText}>
              No providers in this list.
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
  tabRow: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 20,
    paddingTop: 16,
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
  rowTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  businessName: {
    fontFamily: 'Archivo_800ExtraBold',
    fontSize: 15,
  },
  rowBottom: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 8,
  },
});
