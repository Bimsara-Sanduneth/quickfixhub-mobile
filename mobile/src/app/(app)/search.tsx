import { useQuery } from '@tanstack/react-query';
import { router, Stack } from 'expo-router';
import { ArrowLeft, Check, Search, SlidersHorizontal, X } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, StyleSheet, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { listCategories } from '@/api/catalog';
import { extractErrorMessage } from '@/api/errors';
import { searchProviders } from '@/api/providers';
import type { ProviderSummary, ServiceCategory } from '@/api/types';
import { Button } from '@/components/ds/button';
import { Dialog } from '@/components/ds/dialog';
import { Divider } from '@/components/ds/divider';
import { Tag } from '@/components/ds/tag';
import { TextField } from '@/components/ds/text-field';
import { ProviderListItem } from '@/components/provider-list-item';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useTheme } from '@/hooks/use-theme';

export default function SearchScreen() {
  const insets = useSafeAreaInsets();
  const theme = useTheme();

  const [text, setText] = useState('');
  const [debouncedText, setDebouncedText] = useState('');
  const [filtersVisible, setFiltersVisible] = useState(false);
  const [categoryId, setCategoryId] = useState<string | undefined>();
  const [city, setCity] = useState('');
  const [verifiedOnly, setVerifiedOnly] = useState(false);

  // Small debounce so a fast typist doesn't fire a request per keystroke - fine at this
  // dataset's size, but still the right habit for a field wired straight to a network query.
  useEffect(() => {
    const id = setTimeout(() => setDebouncedText(text.trim()), 300);
    return () => clearTimeout(id);
  }, [text]);

  const categories = useQuery({ queryKey: ['categories'], queryFn: listCategories });
  const selectedCategory = categories.data?.find((c) => c.id === categoryId);

  const providers = useQuery({
    queryKey: ['providers', 'search', { q: debouncedText, categoryId, city, verifiedOnly }],
    queryFn: () =>
      searchProviders({
        q: debouncedText || undefined,
        categoryId,
        city: city.trim() || undefined,
        verified: verifiedOnly || undefined,
      }),
  });

  const activeFilterCount = (categoryId ? 1 : 0) + (city.trim() ? 1 : 0) + (verifiedOnly ? 1 : 0);

  function openProvider(provider: ProviderSummary) {
    router.push({ pathname: '/(app)/providers/[providerId]', params: { providerId: provider.id } });
  }

  function resetFilters() {
    setCategoryId(undefined);
    setCity('');
    setVerifiedOnly(false);
  }

  return (
    <ThemedView style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />

      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <Pressable onPress={() => router.back()} hitSlop={8}>
          <ArrowLeft size={20} color={theme.text} />
        </Pressable>
        <View style={[styles.searchBar, { backgroundColor: theme.surface, borderColor: theme.divider }]}>
          <Search size={16} color={theme.neutral600} />
          <TextInput
            value={text}
            onChangeText={setText}
            autoFocus
            placeholder="What needs fixing?"
            placeholderTextColor={theme.neutral600}
            style={[styles.searchInput, { color: theme.text }]}
          />
        </View>
        <Pressable
          style={[
            styles.filterButton,
            { borderColor: theme.divider, backgroundColor: activeFilterCount > 0 ? theme.accent : 'transparent' },
          ]}
          onPress={() => setFiltersVisible(true)}
          hitSlop={4}>
          <SlidersHorizontal size={18} color={activeFilterCount > 0 ? theme.bg : theme.text} />
        </Pressable>
      </View>
      <Divider style={styles.headerDivider} />

      {activeFilterCount > 0 && (
        <View style={styles.activeFilters}>
          {selectedCategory && (
            <RemovableTag label={selectedCategory.name.toUpperCase()} onRemove={() => setCategoryId(undefined)} />
          )}
          {city.trim() !== '' && <RemovableTag label={city.trim().toUpperCase()} onRemove={() => setCity('')} />}
          {verifiedOnly && <RemovableTag label="VERIFIED ONLY" onRemove={() => setVerifiedOnly(false)} />}
          <Pressable onPress={resetFilters} hitSlop={6}>
            <ThemedText type="small" style={{ color: theme.accent }}>
              Clear all
            </ThemedText>
          </Pressable>
        </View>
      )}

      {providers.isError && (
        <ThemedText type="small" style={{ color: theme.accent, paddingHorizontal: 20, paddingTop: 16 }}>
          {extractErrorMessage(providers.error)}
        </ThemedText>
      )}
      {providers.isPending ? (
        <ActivityIndicator style={styles.loading} />
      ) : (
        <FlatList
          data={providers.data?.content ?? []}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <ThemedText type="small" themeColor="textSecondary" style={styles.emptyText}>
              No providers match your search.
            </ThemedText>
          }
          renderItem={({ item }) => <ProviderListItem provider={item} onPress={() => openProvider(item)} />}
        />
      )}

      <Dialog
        visible={filtersVisible}
        title="Filters"
        onRequestClose={() => setFiltersVisible(false)}
        actions={
          <>
            <Button label="Reset" variant="ghost" onPress={resetFilters} />
            <Button label="Done" onPress={() => setFiltersVisible(false)} />
          </>
        }>
        <ThemedText type="smallBold" style={styles.filterLabel}>
          Category
        </ThemedText>
        <View style={styles.categoryChips}>
          {categories.data?.map((category: ServiceCategory) => {
            const selected = category.id === categoryId;
            return (
              <Pressable
                key={category.id}
                onPress={() => setCategoryId(selected ? undefined : category.id)}>
                <Tag label={category.name} variant={selected ? 'solid' : 'outline'} />
              </Pressable>
            );
          })}
        </View>

        <TextField label="City" value={city} onChangeText={setCity} style={styles.cityField} placeholder="e.g. Colombo" />

        <Pressable style={styles.verifiedRow} onPress={() => setVerifiedOnly((v) => !v)}>
          <View
            style={[
              styles.checkbox,
              { borderColor: theme.accent, backgroundColor: verifiedOnly ? theme.accent : 'transparent' },
            ]}>
            {verifiedOnly && <Check size={11} color={theme.bg} strokeWidth={3.5} />}
          </View>
          <ThemedText type="small">Verified providers only</ThemedText>
        </Pressable>
      </Dialog>
    </ThemedView>
  );
}

function RemovableTag({ label, onRemove }: { label: string; onRemove: () => void }) {
  const theme = useTheme();
  return (
    <View style={[styles.removableTag, { backgroundColor: theme.accent100 }]}>
      <ThemedText style={[styles.removableTagLabel, { color: theme.accent800 }]}>{label}</ThemedText>
      <Pressable onPress={onRemove} hitSlop={6}>
        <X size={12} color={theme.accent800} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 20,
    paddingBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    padding: 0,
  },
  filterButton: {
    width: 40,
    height: 40,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerDivider: {
    marginBottom: 4,
  },
  activeFilters: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 20,
    paddingTop: 12,
  },
  removableTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  removableTagLabel: {
    fontSize: 11,
    fontFamily: 'Archivo_800ExtraBold',
    letterSpacing: 0.2,
  },
  loading: {
    marginTop: 24,
  },
  listContent: {
    paddingTop: 16,
    flexGrow: 1,
  },
  emptyText: {
    textAlign: 'center',
    paddingVertical: 32,
    paddingHorizontal: 20,
  },
  filterLabel: {
    marginBottom: 4,
  },
  categoryChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  cityField: {
    marginTop: 14,
  },
  verifiedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 16,
  },
  checkbox: {
    width: 16,
    height: 16,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
