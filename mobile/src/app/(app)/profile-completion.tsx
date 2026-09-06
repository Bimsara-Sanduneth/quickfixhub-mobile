import { useQuery, useQueryClient } from '@tanstack/react-query';
import * as ImagePicker from 'expo-image-picker';
import { router } from 'expo-router';
import { Bell, Home, MapPin, Plus } from 'lucide-react-native';
import { useState } from 'react';
import { Image, Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { createAddress, listAddresses } from '@/api/addresses';
import { extractErrorMessage } from '@/api/errors';
import { useAuth } from '@/auth/AuthContext';
import { Button } from '@/components/ds/button';
import { Dialog } from '@/components/ds/dialog';
import { Divider } from '@/components/ds/divider';
import { TextField } from '@/components/ds/text-field';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useTheme } from '@/hooks/use-theme';

export default function ProfileCompletionScreen() {
  const insets = useSafeAreaInsets();
  const theme = useTheme();
  const queryClient = useQueryClient();
  const { clearJustRegistered } = useAuth();

  const [avatarUri, setAvatarUri] = useState<string | null>(null);
  const [dialogVisible, setDialogVisible] = useState(false);
  const [label, setLabel] = useState('');
  const [addressText, setAddressText] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { data: addresses } = useQuery({ queryKey: ['addresses'], queryFn: listAddresses });

  async function pickAvatar() {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) return;
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.8 });
    if (!result.canceled && result.assets[0]) {
      // Preview only for now - uploading to storage is a separate media milestone.
      setAvatarUri(result.assets[0].uri);
    }
  }

  async function saveAddress() {
    setError(null);
    setSaving(true);
    try {
      await createAddress({ label: label.trim(), addressText: addressText.trim() });
      await queryClient.invalidateQueries({ queryKey: ['addresses'] });
      setDialogVisible(false);
      setLabel('');
      setAddressText('');
    } catch (e) {
      setError(extractErrorMessage(e));
    } finally {
      setSaving(false);
    }
  }

  function finishProfileCompletion() {
    clearJustRegistered();
    router.replace('/(app)');
  }

  return (
    <ThemedView style={styles.container}>
      <View style={{ paddingTop: insets.top + 8, paddingHorizontal: 24 }}>
        <ThemedText style={styles.step}>STEP 2 OF 2</ThemedText>
        <View style={styles.progress}>
          <View style={[styles.progressBar, { backgroundColor: theme.accent }]} />
          <View style={[styles.progressBar, { backgroundColor: theme.accent }]} />
        </View>
      </View>
      <Divider style={styles.headerDivider} />

      <View style={styles.body}>
        <ThemedText style={styles.title}>Finish your{'\n'}profile.</ThemedText>

        <View style={styles.avatarRow}>
          <View style={[styles.avatar, { backgroundColor: theme.neutral200 }]}>
            {avatarUri && <Image source={{ uri: avatarUri }} style={styles.avatarImage} />}
          </View>
          <View>
            <Button label="Upload photo" variant="secondary" onPress={pickAvatar} />
            <ThemedText type="small" themeColor="textSecondary" style={styles.avatarHint}>
              JPG or PNG, max 5 MB
            </ThemedText>
          </View>
        </View>

        <Divider style={styles.sectionDivider} />
        <ThemedText type="smallBold" style={styles.sectionLabel}>
          Saved locations
        </ThemedText>

        {addresses?.map((address) => (
          <View key={address.id} style={[styles.addressRow, { borderColor: theme.divider }]}>
            <Home size={18} color={theme.accent} />
            <View style={{ flex: 1 }}>
              <ThemedText style={styles.addressLabel}>{address.label}</ThemedText>
              <ThemedText type="small" themeColor="textSecondary">
                {address.addressText}
              </ThemedText>
            </View>
          </View>
        ))}

        <Pressable
          style={[styles.addressRow, { borderColor: theme.divider }]}
          onPress={() => setDialogVisible(true)}>
          <MapPin size={18} color={theme.neutral500} />
          <ThemedText type="smallBold" themeColor="textSecondary" style={{ flex: 1 }}>
            Add {addresses && addresses.length > 0 ? 'another' : 'work'} address
          </ThemedText>
          <Plus size={16} color={theme.neutral500} />
        </Pressable>
      </View>

      <View style={{ flex: 1 }} />

      <View style={[styles.footer, { paddingBottom: insets.bottom + 24 }]}>
        {/* Not wired to a real permission request yet: expo-notifications' push-token APIs
            crash on import under Expo Go on Android (SDK 53+ dropped support there entirely -
            it needs a development build). Revisit once the notifications milestone lands. */}
        <View style={[styles.notice, { backgroundColor: theme.surface, borderLeftColor: theme.accent }]}>
          <Bell size={18} color={theme.accent} style={{ marginTop: 1 }} />
          <View style={{ flex: 1 }}>
            <ThemedText style={styles.noticeTitle}>Allow notifications</ThemedText>
            <ThemedText type="small" themeColor="textSecondary" style={styles.noticeBody}>
              So you know the moment a provider accepts, arrives or messages you.
            </ThemedText>
          </View>
        </View>
        <Button label="Enable and continue" onPress={finishProfileCompletion} block />
        <Pressable onPress={finishProfileCompletion} style={styles.skipRow}>
          <ThemedText type="small" themeColor="textSecondary">
            Skip for now
          </ThemedText>
        </Pressable>
      </View>

      <Dialog
        visible={dialogVisible}
        title="Add address"
        onRequestClose={() => setDialogVisible(false)}
        actions={
          <>
            <Button label="Cancel" variant="secondary" onPress={() => setDialogVisible(false)} />
            <Button
              label="Save"
              loading={saving}
              disabled={!label.trim() || !addressText.trim()}
              onPress={saveAddress}
            />
          </>
        }>
        <TextField label="Label" placeholder="e.g. Work" value={label} onChangeText={setLabel} style={styles.dialogField} />
        <TextField label="Address" value={addressText} onChangeText={setAddressText} multiline />
        {error && (
          <ThemedText type="small" style={{ color: theme.accent }}>
            {error}
          </ThemedText>
        )}
      </Dialog>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  step: {
    fontFamily: 'Archivo_800ExtraBold',
    fontSize: 15,
  },
  progress: {
    flexDirection: 'row',
    gap: 3,
    marginTop: 14,
  },
  progressBar: {
    height: 4,
    flex: 1,
  },
  headerDivider: {
    marginTop: 16,
  },
  body: {
    paddingHorizontal: 24,
    paddingTop: 24,
  },
  title: {
    fontFamily: 'Archivo_800ExtraBold',
    fontSize: 32,
    lineHeight: 33,
    marginBottom: 20,
  },
  avatarRow: {
    flexDirection: 'row',
    gap: 14,
    alignItems: 'center',
    marginBottom: 24,
  },
  avatar: {
    width: 76,
    height: 76,
    overflow: 'hidden',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
  },
  avatarHint: {
    marginTop: 6,
  },
  sectionDivider: {
    marginBottom: 18,
  },
  sectionLabel: {
    marginBottom: 10,
  },
  addressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  addressLabel: {
    fontFamily: 'Archivo_800ExtraBold',
    fontSize: 14,
  },
  footer: {
    paddingHorizontal: 24,
    gap: 10,
  },
  notice: {
    flexDirection: 'row',
    gap: 10,
    padding: 14,
    borderLeftWidth: 4,
  },
  noticeTitle: {
    fontFamily: 'Archivo_800ExtraBold',
    fontSize: 13,
    marginBottom: 3,
  },
  noticeBody: {
    lineHeight: 16,
  },
  skipRow: {
    alignItems: 'center',
    paddingTop: 4,
  },
  dialogField: {
    marginBottom: 4,
  },
});
