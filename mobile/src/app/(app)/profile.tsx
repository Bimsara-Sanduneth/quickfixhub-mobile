import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { router, Stack } from 'expo-router';
import { ArrowLeft, Bookmark, Camera, LogOut, Plus, RefreshCw } from 'lucide-react-native';
import { useState } from 'react';
import { ActivityIndicator, Image, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { createAddress, listAddresses } from '@/api/addresses';
import { listMyBookings } from '@/api/bookings';
import { extractErrorMessage } from '@/api/errors';
import { deleteMyCoverPhoto, deleteMyPhoto, getCurrentUser, updateMyCoverPhoto, updateMyPhoto } from '@/api/me';
import { listSavedProviders, unsaveProvider } from '@/api/providers';
import type { ProviderSummary } from '@/api/types';
import { useAuth } from '@/auth/AuthContext';
import { Button } from '@/components/ds/button';
import { Divider } from '@/components/ds/divider';
import { Tag } from '@/components/ds/tag';
import { TextField } from '@/components/ds/text-field';
import { StarRating } from '@/components/star-rating';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useTheme } from '@/hooks/use-theme';
import { resetOnboarding } from '@/onboarding/onboardingStorage';
import { THEME_MODE_LABEL, THEME_MODES, useThemeMode } from '@/theme/theme-mode';
import { pickAndEncodePhoto } from '@/utils/photo';

// No photo upload exists anywhere in the app - this mirrors the same static-avatar-box pattern
// already used on the provider detail screen, just with initials rather than a blank box.
function initials(fullName: string): string {
  const parts = fullName.trim().split(/\s+/);
  const first = parts[0]?.[0] ?? '';
  const last = parts.length > 1 ? parts[parts.length - 1][0] : '';
  return (first + last).toUpperCase();
}

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const theme = useTheme();
  const { mode, setMode } = useThemeMode();
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

  const photoMutation = useMutation({
    mutationFn: updateMyPhoto,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['me'] }),
  });
  const removePhotoMutation = useMutation({
    mutationFn: deleteMyPhoto,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['me'] }),
  });
  const coverPhotoMutation = useMutation({
    mutationFn: updateMyCoverPhoto,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['me'] }),
  });
  const removeCoverPhotoMutation = useMutation({
    mutationFn: deleteMyCoverPhoto,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['me'] }),
  });

  async function pickPhoto() {
    const dataUri = await pickAndEncodePhoto({ aspect: [1, 1], maxWidth: 512 });
    if (dataUri) {
      photoMutation.mutate(dataUri);
    }
  }

  async function pickCoverPhoto() {
    const dataUri = await pickAndEncodePhoto({ aspect: [3, 1], maxWidth: 1200 });
    if (dataUri) {
      coverPhotoMutation.mutate(dataUri);
    }
  }

  function openProvider(provider: ProviderSummary) {
    router.push({ pathname: '/(app)/providers/[providerId]', params: { providerId: provider.id } });
  }

  async function handleLogout() {
    setLoggingOut(true);
    await logout();
  }

  // Dev-only: wipe the "seen onboarding" flag and sign out, so the app relaunches into the
  // "Get started" intro slides instead of the login screen. No-op in a production build.
  async function handleResetOnboarding() {
    setLoggingOut(true);
    await resetOnboarding();
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
          <Pressable
            style={[styles.coverPhoto, { backgroundColor: theme.neutral200 }]}
            onPress={pickCoverPhoto}
            disabled={coverPhotoMutation.isPending}>
            {me.data.coverPhotoDataUri && <Image source={{ uri: me.data.coverPhotoDataUri }} style={styles.coverPhotoImage} />}
            <View style={[styles.coverPhotoBadge, { backgroundColor: theme.accent, borderColor: theme.bg }]}>
              {coverPhotoMutation.isPending ? <ActivityIndicator size={10} color={theme.bg} /> : <Camera size={11} color={theme.bg} />}
            </View>
            {!me.data.coverPhotoDataUri && (
              <ThemedText type="small" style={[styles.coverPhotoHint, { color: theme.neutral600 }]}>
                Add a cover photo
              </ThemedText>
            )}
          </Pressable>
        )}
        {me.data?.coverPhotoDataUri && (
          <Pressable onPress={() => removeCoverPhotoMutation.mutate()} disabled={removeCoverPhotoMutation.isPending} hitSlop={4}>
            <ThemedText type="small" style={{ color: theme.accent, marginBottom: 16 }}>
              Remove cover photo
            </ThemedText>
          </Pressable>
        )}
        {coverPhotoMutation.isError && (
          <ThemedText type="small" style={{ color: theme.accent, marginBottom: 12 }}>
            {extractErrorMessage(coverPhotoMutation.error)}
          </ThemedText>
        )}

        {me.data && (
          <View style={styles.profileHeader}>
            <Pressable
              style={[styles.avatar, { backgroundColor: theme.neutral200, borderColor: theme.divider }]}
              onPress={pickPhoto}
              disabled={photoMutation.isPending}>
              {me.data.photoDataUri ? (
                <Image source={{ uri: me.data.photoDataUri }} style={styles.avatarImage} />
              ) : (
                <ThemedText style={styles.avatarInitials}>{initials(me.data.fullName)}</ThemedText>
              )}
              <View style={[styles.avatarEditBadge, { backgroundColor: theme.accent, borderColor: theme.bg }]}>
                {photoMutation.isPending ? <ActivityIndicator size={10} color={theme.bg} /> : <Camera size={11} color={theme.bg} />}
              </View>
            </Pressable>
            <View style={styles.profileHeaderText}>
              <ThemedText style={styles.name}>{me.data.fullName}</ThemedText>
              <ThemedText type="small" themeColor="textSecondary">
                {me.data.email}
              </ThemedText>
              {me.data.photoDataUri && (
                <Pressable onPress={() => removePhotoMutation.mutate()} disabled={removePhotoMutation.isPending} hitSlop={4}>
                  <ThemedText type="small" style={{ color: theme.accent, marginTop: 4 }}>
                    Remove photo
                  </ThemedText>
                </Pressable>
              )}
            </View>
          </View>
        )}
        {photoMutation.isError && (
          <ThemedText type="small" style={{ color: theme.accent, marginBottom: 12 }}>
            {extractErrorMessage(photoMutation.error)}
          </ThemedText>
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

        <ThemedText type="smallBold" style={styles.sectionLabel}>
          Appearance
        </ThemedText>
        <View style={styles.themeRow}>
          {THEME_MODES.map((m) => (
            <Pressable key={m} onPress={() => setMode(m)}>
              <Tag label={THEME_MODE_LABEL[m]} variant={mode === m ? 'solid' : 'outline'} />
            </Pressable>
          ))}
        </View>

        <Divider style={styles.sectionDivider} />

        <Pressable style={styles.logoutRow} onPress={handleLogout} disabled={loggingOut}>
          <LogOut size={16} color={theme.accent} />
          <ThemedText type="smallBold" style={{ color: theme.accent }}>
            Log out
          </ThemedText>
        </Pressable>

        {__DEV__ && (
          <Pressable style={styles.logoutRow} onPress={handleResetOnboarding} disabled={loggingOut}>
            <RefreshCw size={16} color={theme.textSecondary} />
            <ThemedText type="smallBold" themeColor="textSecondary">
              Reset onboarding & sign out (dev)
            </ThemedText>
          </Pressable>
        )}
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
  coverPhoto: {
    height: 120,
    marginBottom: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  coverPhotoImage: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  coverPhotoBadge: {
    position: 'absolute',
    right: 8,
    bottom: 8,
    width: 22,
    height: 22,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  coverPhotoHint: {
    fontSize: 12,
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginBottom: 24,
  },
  avatar: {
    width: 64,
    height: 64,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
  },
  avatarInitials: {
    fontFamily: 'Archivo_800ExtraBold',
    fontSize: 22,
  },
  avatarEditBadge: {
    position: 'absolute',
    right: -4,
    bottom: -4,
    width: 20,
    height: 20,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileHeaderText: {
    flex: 1,
  },
  name: {
    fontFamily: 'Archivo_800ExtraBold',
    fontSize: 20,
    marginBottom: 2,
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
  themeRow: {
    flexDirection: 'row',
    gap: 8,
  },
  logoutRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 10,
  },
});
