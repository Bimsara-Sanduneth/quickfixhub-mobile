import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { router, Stack } from 'expo-router';
import { ArrowLeft, Bookmark, LogOut, Plus } from 'lucide-react-native';
import { useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { createAddress, listAddresses } from '@/api/addresses';
import { listMyBookings } from '@/api/bookings';
import { extractErrorMessage } from '@/api/errors';
import { getCurrentUser } from '@/api/me';
import { listSavedProviders, unsaveProvider } from '@/api/providers';
import type { ProviderSummary } from '@/api/types';
import { useAuth } from '@/auth/AuthContext';
import { Button } from '@/components/ds/button';
import { Divider } from '@/components/ds/divider';
import { TextField } from '@/components/ds/text-field';
import { StarRating } from '@/components/star-rating';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useTheme } from '@/hooks/use-theme';

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const theme = useTheme();
  const { logout } = useAuth();
  const queryClient = useQueryClient();
  const [addingAddress, setAddingAddress] = useState(false);
  const [newAddressLabel, setNewAddressLabel] = useState('');
  const [newAddressText, setNewAddressText] = useState('');
  const [loggingOut, setLoggingOut] = useState(false);

  const me = useQuery({ queryKey: ['me'], queryFn: getCurrentUser });
  const bookings = useQuery({ queryKey: ['bookings'], queryFn: listMyBookings });
  const saved = useQuery({ queryKey: ['savedProviders'], queryFn: listSavedProviders });
  const addresses = useQuery({ queryKey: ['addresses'], queryFn: listAddresses });

  const reviewsGiven = bookings.data?.filter((b) => b.reviewed).length ?? 0;

  const unsaveMutation = useMutation({
    mutationFn: (providerId: string) => unsaveProvider(providerId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['savedProviders'] }),
  });

  const addAddressMutation = useMutation({
    mutationFn: () => createAddress({ label: newAddressLabel.trim(), addressText: newAddressText.trim() }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['addresses'] });
      setAddingAddress(false);
      setNewAddressLabel('');
      setNewAddressText('');
    },
  });

  function openProvider(provider: ProviderSummary) {
    router.push({ pathname: '/(app)/providers/[providerId]', params: { providerId: provider.id } });
  }

  async function handleLogout() {
    setLoggingOut(true);
    await logout();
  }

  return (
    <ThemedView style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />

      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <Pressable onPress={() => router.back()} hitSlop={8}>
          <ArrowLeft size={20} color={theme.text} />
        </Pressable>
        <ThemedText style={styles.headerTitle}>PROFILE</ThemedText>
      </View>
      <Divider style={styles.headerDivider} />

      <ScrollView contentContainerStyle={styles.body}>
        {me.data && (
          <>
            <ThemedText style={styles.name}>{me.data.fullName}</ThemedText>
            <ThemedText type="small" themeColor="textSecondary" style={styles.email}>
              {me.data.email}
            </ThemedText>
          </>
        )}

        <View style={[styles.statsGrid, { backgroundColor: theme.divider }]}>
          <View style={[styles.statTile, { backgroundColor: theme.bg }]}>
            <ThemedText style={styles.statValue}>{bookings.data?.length ?? '—'}</ThemedText>
            <ThemedText type="small" themeColor="textSecondary" style={styles.statLabel}>
              Bookings
            </ThemedText>
          </View>
          <View style={[styles.statTile, { backgroundColor: theme.bg }]}>
            <ThemedText style={styles.statValue}>{saved.data?.length ?? '—'}</ThemedText>
            <ThemedText type="small" themeColor="textSecondary" style={styles.statLabel}>
              Saved pros
            </ThemedText>
          </View>
          <View style={[styles.statTile, { backgroundColor: theme.bg }]}>
            <ThemedText style={styles.statValue}>{reviewsGiven}</ThemedText>
            <ThemedText type="small" themeColor="textSecondary" style={styles.statLabel}>
              Reviews given
            </ThemedText>
          </View>
        </View>

        <ThemedText type="smallBold" style={styles.sectionLabel}>
          Saved providers
        </ThemedText>
        {saved.isPending ? (
          <ActivityIndicator style={styles.sectionLoading} />
        ) : saved.data && saved.data.length === 0 ? (
          <ThemedText type="small" themeColor="textSecondary" style={styles.emptyText}>
            Bookmark a provider from their profile to see them here.
          </ThemedText>
        ) : (
          saved.data?.map((provider) => (
            <Pressable key={provider.id} style={[styles.savedRow, { borderColor: theme.divider }]} onPress={() => openProvider(provider)}>
              <View style={{ flex: 1 }}>
                <ThemedText type="smallBold">{provider.businessName}</ThemedText>
                <View style={styles.savedMetaRow}>
                  {provider.averageRating != null && <StarRating rating={provider.averageRating} size={11} />}
                  {provider.city && (
                    <ThemedText type="small" themeColor="textSecondary">
                      {provider.city}
                    </ThemedText>
                  )}
                </View>
              </View>
              <Pressable onPress={() => unsaveMutation.mutate(provider.id)} hitSlop={8}>
                <Bookmark size={18} color={theme.accent} fill={theme.accent} />
              </Pressable>
            </Pressable>
          ))
        )}

        <Divider style={styles.sectionDivider} />

        <ThemedText type="smallBold" style={styles.sectionLabel}>
          Saved addresses
        </ThemedText>
        {addresses.isPending ? (
          <ActivityIndicator style={styles.sectionLoading} />
        ) : (
          addresses.data?.map((address) => (
            <View key={address.id} style={[styles.addressRow, { borderColor: theme.divider }]}>
              <ThemedText type="smallBold">{address.label}</ThemedText>
              <ThemedText type="small" themeColor="textSecondary">
                {address.addressText}
              </ThemedText>
            </View>
          ))
        )}

        {addingAddress ? (
          <View style={styles.addAddressForm}>
            <TextField label="Label" placeholder="e.g. Home" value={newAddressLabel} onChangeText={setNewAddressLabel} style={styles.fieldGap} />
            <TextField
              label="Address"
              placeholder="Street, city"
              value={newAddressText}
              onChangeText={setNewAddressText}
              multiline
              style={styles.fieldGap}
            />
            {addAddressMutation.isError && (
              <ThemedText type="small" style={{ color: theme.accent, marginBottom: 8 }}>
                {extractErrorMessage(addAddressMutation.error)}
              </ThemedText>
            )}
            <View style={styles.addAddressActions}>
              <Button label="Cancel" variant="ghost" onPress={() => setAddingAddress(false)} />
              <Button
                label="Save address"
                disabled={!newAddressLabel.trim() || !newAddressText.trim()}
                loading={addAddressMutation.isPending}
                onPress={() => addAddressMutation.mutate()}
              />
            </View>
          </View>
        ) : (
          <Pressable style={styles.addAddressButton} onPress={() => setAddingAddress(true)}>
            <Plus size={16} color={theme.accent} />
            <ThemedText type="smallBold" style={{ color: theme.accent }}>
              Add address
            </ThemedText>
          </Pressable>
        )}

        <Divider style={styles.sectionDivider} />

        <Pressable style={styles.logoutRow} onPress={handleLogout} disabled={loggingOut}>
          <LogOut size={16} color={theme.accent} />
          <ThemedText type="smallBold" style={{ color: theme.accent }}>
            Log out
          </ThemedText>
        </Pressable>
      </ScrollView>
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
  body: {
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 40,
  },
  name: {
    fontFamily: 'Archivo_800ExtraBold',
    fontSize: 22,
  },
  email: {
    marginTop: 2,
    marginBottom: 18,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 2,
    marginBottom: 24,
  },
  statTile: {
    flex: 1,
    paddingVertical: 14,
    paddingHorizontal: 8,
    alignItems: 'center',
  },
  statValue: {
    fontFamily: 'Archivo_800ExtraBold',
    fontSize: 18,
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 10.5,
    textAlign: 'center',
  },
  sectionLabel: {
    marginBottom: 10,
  },
  sectionLoading: {
    marginBottom: 12,
  },
  emptyText: {
    marginBottom: 8,
    lineHeight: 18,
  },
  savedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderWidth: 1,
    padding: 12,
    marginBottom: 8,
  },
  savedMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 3,
  },
  sectionDivider: {
    marginVertical: 20,
  },
  addressRow: {
    borderWidth: 1,
    padding: 12,
    marginBottom: 8,
  },
  addAddressButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 10,
  },
  addAddressForm: {
    marginTop: 4,
  },
  fieldGap: {
    marginBottom: 12,
  },
  addAddressActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
  },
  logoutRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 10,
  },
});
