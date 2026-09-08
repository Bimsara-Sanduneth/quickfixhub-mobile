import { useQuery } from '@tanstack/react-query';
import { Redirect, router, Stack } from 'expo-router';
import {
  Bell,
  Calendar,
  House,
  Leaf,
  MessageSquare,
  PaintBucket,
  Refrigerator,
  Search,
  Sparkles,
  User,
  Wrench,
  Zap,
  type LucideIcon,
} from 'lucide-react-native';
import { ActivityIndicator, FlatList, Pressable, StyleSheet, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { listCategories } from '@/api/catalog';
import { extractErrorMessage } from '@/api/errors';
import { getCurrentUser } from '@/api/me';
import { searchProviders } from '@/api/providers';
import type { ProviderSummary, ServiceCategory } from '@/api/types';
import { useAuth } from '@/auth/AuthContext';
import { ProviderListItem } from '@/components/provider-list-item';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useTheme } from '@/hooks/use-theme';

const CATEGORY_ICONS: Record<string, LucideIcon> = {
  plumbing: Wrench,
  electrical: Zap,
  cleaning: Sparkles,
  landscaping: Leaf,
  painting: PaintBucket,
  'appliance-repair': Refrigerator,
};

function categoryIcon(slug: string): LucideIcon {
  return CATEGORY_ICONS[slug] ?? Wrench;
}

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 18) return 'Good afternoon';
  return 'Good evening';
}

export default function CategoryBrowseScreen() {
  const insets = useSafeAreaInsets();
  const theme = useTheme();
  const { justRegistered, justRegisteredRole } = useAuth();

  const { data: me } = useQuery({ queryKey: ['me'], queryFn: getCurrentUser, enabled: !justRegistered });
  const categories = useQuery({ queryKey: ['categories'], queryFn: listCategories, enabled: !justRegistered });
  const providers = useQuery({
    queryKey: ['providers', 'recommended'],
    queryFn: () => searchProviders({}),
    enabled: !justRegistered,
  });

  // A fresh registration routes through a one-time setup screen before landing here - decided
  // here (the group's actual entry point) rather than in (app)/_layout.tsx, so it doesn't race
  // or block the Stack from ever rendering the screen it redirects to. Providers get their own
  // business-profile setup instead of the customer-oriented address/avatar screen, since a
  // provider signup with no provider_profile row is invisible to every customer-facing endpoint.
  if (justRegistered) {
    return <Redirect href={justRegisteredRole === 'PROVIDER' ? '/(app)/provider-onboarding' : '/(app)/profile-completion'} />;
  }

  function openCategory(category: ServiceCategory) {
    router.push({
      pathname: '/(app)/categories/[categoryId]',
      params: { categoryId: category.id, name: category.name },
    });
  }

  function openProvider(provider: ProviderSummary) {
    router.push({ pathname: '/(app)/providers/[providerId]', params: { providerId: provider.id } });
  }

  return (
    <ThemedView style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />

      <FlatList
        data={providers.data?.content ?? []}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={
          <>
            <View style={[styles.hero, { backgroundColor: theme.accent, paddingTop: insets.top + 20 }]}>
              <View style={styles.heroTopRow}>
                <ThemedText style={[styles.wordmark, { color: theme.bg }]}>QUICKFIXHUB</ThemedText>
                {/* No notifications system yet - purely decorative for now. */}
                <Bell size={20} color={theme.bg} />
              </View>
              <ThemedText style={[styles.heroTitle, { color: theme.bg }]}>Fixed{'\n'}today.</ThemedText>
              <ThemedText style={[styles.heroSubtitle, { color: theme.bg }]}>
                {getGreeting()}{me ? `, ${me.fullName.split(' ')[0]}` : ''}.
              </ThemedText>
              {/* Not a live-editable field on Home - tapping it jumps straight to the dedicated
                  Search screen (with its own input + filter sheet), same as most marketplace
                  apps' home search bar. editable/pointerEvents keep every tap on the Pressable. */}
              <Pressable
                style={[styles.searchBar, { backgroundColor: theme.bg }]}
                onPress={() => router.push('/(app)/search')}>
                <Search size={16} color={theme.neutral600} />
                <TextInput
                  editable={false}
                  pointerEvents="none"
                  placeholder="What needs fixing?"
                  placeholderTextColor={theme.neutral600}
                  style={[styles.searchInput, { color: theme.text }]}
                />
              </Pressable>
            </View>

            <ThemedText type="smallBold" style={styles.sectionTitle}>
              Browse categories
            </ThemedText>
            {categories.isPending ? (
              <ActivityIndicator style={styles.sectionLoading} />
            ) : (
              <View style={[styles.categoryGrid, { backgroundColor: theme.divider }]}>
                {categories.data?.map((category) => {
                  const Icon = categoryIcon(category.slug);
                  return (
                    <Pressable
                      key={category.id}
                      style={[styles.categoryTile, { backgroundColor: theme.bg }]}
                      onPress={() => openCategory(category)}>
                      <Icon size={20} color={theme.accent} />
                      <ThemedText style={styles.categoryLabel}>{category.name}</ThemedText>
                    </Pressable>
                  );
                })}
              </View>
            )}

            <View style={styles.recommendedHeader}>
              <ThemedText type="smallBold">Recommended for you</ThemedText>
            </View>

            {providers.isError && (
              <ThemedText type="small" style={{ color: theme.accent, paddingHorizontal: 20 }}>
                {extractErrorMessage(providers.error)}
              </ThemedText>
            )}
            {providers.isPending && <ActivityIndicator style={styles.sectionLoading} />}
          </>
        }
        ListEmptyComponent={
          !providers.isPending ? (
            <ThemedText type="small" themeColor="textSecondary" style={styles.emptyText}>
              No providers found.
            </ThemedText>
          ) : null
        }
        renderItem={({ item }) => <ProviderListItem provider={item} onPress={() => openProvider(item)} />}
      />

      <View style={[styles.tabBar, { borderTopColor: theme.divider, paddingBottom: insets.bottom + 10 }]}>
        <View style={styles.tabItem}>
          <House size={20} color={theme.accent} />
          <ThemedText style={[styles.tabLabel, { color: theme.accent }]}>HOME</ThemedText>
        </View>
        <Pressable
          style={styles.tabItem}
          onPress={() => router.push(me?.role === 'PROVIDER' ? '/(app)/provider-bookings' : '/(app)/bookings')}>
          <Calendar size={20} color={theme.neutral500} />
          <ThemedText style={[styles.tabLabel, { color: theme.neutral500 }]}>BOOKINGS</ThemedText>
        </Pressable>
        {/* Chat has no screen yet - placeholder until that milestone lands. */}
        <View style={styles.tabItem}>
          <MessageSquare size={20} color={theme.neutral500} />
          <ThemedText style={[styles.tabLabel, { color: theme.neutral500 }]}>CHAT</ThemedText>
        </View>
        <Pressable style={styles.tabItem} onPress={() => router.push('/(app)/profile')}>
          <User size={20} color={theme.neutral500} />
          <ThemedText style={[styles.tabLabel, { color: theme.neutral500 }]}>YOU</ThemedText>
        </Pressable>
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  listContent: {
    flexGrow: 1,
  },
  hero: {
    paddingHorizontal: 20,
    paddingBottom: 18,
  },
  heroTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 18,
  },
  wordmark: {
    fontFamily: 'Archivo_800ExtraBold',
    fontSize: 15,
    letterSpacing: 0.3,
  },
  heroTitle: {
    fontFamily: 'Archivo_800ExtraBold',
    fontSize: 44,
    lineHeight: 43,
    marginBottom: 6,
  },
  heroSubtitle: {
    fontSize: 12,
    opacity: 0.85,
    marginBottom: 18,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 11,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    padding: 0,
  },
  sectionTitle: {
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 10,
  },
  sectionLoading: {
    marginVertical: 12,
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 2,
    marginHorizontal: 20,
  },
  categoryTile: {
    width: '33%',
    minHeight: 84,
    paddingVertical: 14,
    paddingHorizontal: 10,
    gap: 10,
    flexGrow: 1,
  },
  categoryLabel: {
    fontFamily: 'Archivo_800ExtraBold',
    fontSize: 12,
    lineHeight: 15,
  },
  recommendedHeader: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 10,
  },
  emptyText: {
    textAlign: 'center',
    paddingVertical: 20,
  },
  tabBar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingTop: 10,
    borderTopWidth: 2,
  },
  tabItem: {
    alignItems: 'center',
    gap: 4,
  },
  tabLabel: {
    fontSize: 9,
    fontFamily: 'Archivo_800ExtraBold',
    letterSpacing: 0.5,
  },
});
