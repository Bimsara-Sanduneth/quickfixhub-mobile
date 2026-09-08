import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import { ArrowLeft, Check, Plus } from 'lucide-react-native';
import { useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { createAddress, listAddresses } from '@/api/addresses';
import { createBooking } from '@/api/bookings';
import { extractErrorMessage } from '@/api/errors';
import { getProvider } from '@/api/providers';
import type { Address, ProviderServiceItem } from '@/api/types';
import { Button } from '@/components/ds/button';
import { Divider } from '@/components/ds/divider';
import { Tag } from '@/components/ds/tag';
import { TextField } from '@/components/ds/text-field';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useTheme } from '@/hooks/use-theme';

const DAYS_AHEAD = 14;
const SLOT_HOURS = [8, 9, 10, 11, 12, 13, 14, 15, 16, 17];

function formatHour(hour: number): string {
  const period = hour < 12 ? 'AM' : 'PM';
  const hour12 = hour % 12 === 0 ? 12 : hour % 12;
  return `${hour12}:00 ${period}`;
}

function dayChipLabel(date: Date, index: number): string {
  if (index === 0) return 'TODAY';
  return `${date.toLocaleDateString(undefined, { weekday: 'short' }).toUpperCase()} ${date.getDate()}`;
}

export default function NewBookingScreen() {
  const insets = useSafeAreaInsets();
  const theme = useTheme();
  const queryClient = useQueryClient();
  const { providerId } = useLocalSearchParams<{ providerId: string }>();

  const [selectedProviderServiceId, setSelectedProviderServiceId] = useState<string | undefined>();
  const [selectedDayIndex, setSelectedDayIndex] = useState<number | undefined>();
  const [selectedHour, setSelectedHour] = useState<number | undefined>();
  const [selectedAddressId, setSelectedAddressId] = useState<string | undefined>();
  const [addingAddress, setAddingAddress] = useState(false);
  const [newAddressLabel, setNewAddressLabel] = useState('');
  const [newAddressText, setNewAddressText] = useState('');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState<string | null>(null);

  const provider = useQuery({
    queryKey: ['providers', providerId],
    queryFn: () => getProvider(providerId),
    enabled: !!providerId,
  });
  const addresses = useQuery({ queryKey: ['addresses'], queryFn: listAddresses });

  const days = useMemo(() => {
    const now = new Date();
    return Array.from({ length: DAYS_AHEAD }, (_, i) => {
      const d = new Date(now);
      d.setDate(d.getDate() + i);
      return d;
    });
  }, []);

  // Today's already-passed hours aren't offered - every other day shows the full slot list.
  const availableHours = useMemo(() => {
    if (selectedDayIndex !== 0) return SLOT_HOURS;
    const currentHour = new Date().getHours();
    return SLOT_HOURS.filter((h) => h > currentHour);
  }, [selectedDayIndex]);

  const addAddressMutation = useMutation({
    mutationFn: () => createAddress({ label: newAddressLabel.trim(), addressText: newAddressText.trim() }),
    onSuccess: (address) => {
      queryClient.setQueryData<Address[]>(['addresses'], (prev) => [...(prev ?? []), address]);
      setSelectedAddressId(address.id);
      setAddingAddress(false);
      setNewAddressLabel('');
      setNewAddressText('');
    },
    onError: (e) => setError(extractErrorMessage(e)),
  });

  const bookingMutation = useMutation({
    mutationFn: () => {
      const scheduledAt = new Date(days[selectedDayIndex!]);
      scheduledAt.setHours(selectedHour!, 0, 0, 0);
      return createBooking({
        providerServiceId: selectedProviderServiceId!,
        addressId: selectedAddressId!,
        scheduledAt: scheduledAt.toISOString(),
        notes: notes.trim() || undefined,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bookings'] });
      router.replace('/(app)/bookings');
    },
    onError: (e) => setError(extractErrorMessage(e)),
  });

  const canSubmit =
    !!selectedProviderServiceId && selectedDayIndex != null && selectedHour != null && !!selectedAddressId;

  function renderServiceRow(item: ProviderServiceItem) {
    const selected = item.providerServiceId === selectedProviderServiceId;
    return (
      <Pressable
        key={item.providerServiceId}
        style={[styles.optionRow, { borderColor: selected ? theme.accent : theme.divider }]}
        onPress={() => setSelectedProviderServiceId(item.providerServiceId)}>
        <View style={{ flex: 1 }}>
          <ThemedText style={styles.optionTitle}>{item.serviceName}</ThemedText>
          {item.durationMinutes != null && (
            <ThemedText type="small" themeColor="textSecondary">
              ~{item.durationMinutes} min
            </ThemedText>
          )}
        </View>
        <ThemedText style={styles.optionPrice}>${item.price.toFixed(2)}</ThemedText>
      </Pressable>
    );
  }

  function renderAddressRow(address: Address) {
    const selected = address.id === selectedAddressId;
    return (
      <Pressable
        key={address.id}
        style={[styles.optionRow, { borderColor: selected ? theme.accent : theme.divider }]}
        onPress={() => setSelectedAddressId(address.id)}>
        <View style={{ flex: 1 }}>
          <ThemedText style={styles.optionTitle}>{address.label}</ThemedText>
          <ThemedText type="small" themeColor="textSecondary">
            {address.addressText}
          </ThemedText>
        </View>
        {selected && <Check size={18} color={theme.accent} strokeWidth={3} />}
      </Pressable>
    );
  }

  if (provider.isPending || addresses.isPending) {
    return (
      <ThemedView style={styles.centered}>
        <Stack.Screen options={{ headerShown: false }} />
        <ActivityIndicator />
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />

      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <Pressable onPress={() => router.back()} hitSlop={8}>
          <ArrowLeft size={20} color={theme.text} />
        </Pressable>
        <ThemedText style={styles.headerTitle}>BOOK {provider.data?.businessName.toUpperCase()}</ThemedText>
      </View>
      <Divider style={styles.headerDivider} />

      <ScrollView contentContainerStyle={styles.form}>
        <ThemedText type="smallBold" style={styles.sectionLabel}>
          Service
        </ThemedText>
        {provider.data && provider.data.services.length === 0 ? (
          <ThemedText type="small" themeColor="textSecondary">
            This provider hasn&rsquo;t listed any services yet.
          </ThemedText>
        ) : (
          <View style={styles.optionList}>{provider.data?.services.map(renderServiceRow)}</View>
        )}

        <ThemedText type="smallBold" style={styles.sectionLabel}>
          Date
        </ThemedText>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipRow}>
          {days.map((day, index) => {
            const selected = index === selectedDayIndex;
            return (
              <Pressable
                key={index}
                onPress={() => {
                  setSelectedDayIndex(index);
                  setSelectedHour(undefined);
                }}
                style={styles.chipSpacing}>
                <Tag label={dayChipLabel(day, index)} variant={selected ? 'solid' : 'outline'} />
              </Pressable>
            );
          })}
        </ScrollView>

        <ThemedText type="smallBold" style={styles.sectionLabel}>
          Time
        </ThemedText>
        {selectedDayIndex == null ? (
          <ThemedText type="small" themeColor="textSecondary">
            Pick a date first.
          </ThemedText>
        ) : availableHours.length === 0 ? (
          <ThemedText type="small" themeColor="textSecondary">
            No time slots left today - pick another date.
          </ThemedText>
        ) : (
          <View style={styles.chipWrap}>
            {availableHours.map((hour) => {
              const selected = hour === selectedHour;
              return (
                <Pressable key={hour} onPress={() => setSelectedHour(hour)}>
                  <Tag label={formatHour(hour)} variant={selected ? 'solid' : 'outline'} />
                </Pressable>
              );
            })}
          </View>
        )}

        <View style={styles.sectionLabelRow}>
          <ThemedText type="smallBold">Address</ThemedText>
          <Pressable style={styles.addAddressButton} onPress={() => setAddingAddress((v) => !v)}>
            <Plus size={14} color={theme.accent} />
            <ThemedText type="small" style={{ color: theme.accent }}>
              Add new
            </ThemedText>
          </Pressable>
        </View>
        {addingAddress && (
          <View style={styles.addAddressForm}>
            <TextField label="Label" placeholder="e.g. Home" value={newAddressLabel} onChangeText={setNewAddressLabel} style={styles.fieldGap} />
            <TextField
              label="Address"
              placeholder="Street, city"
              value={newAddressText}
              onChangeText={setNewAddressText}
              style={styles.fieldGap}
            />
            <Button
              label="Save address"
              variant="secondary"
              loading={addAddressMutation.isPending}
              disabled={!newAddressLabel.trim() || !newAddressText.trim()}
              onPress={() => addAddressMutation.mutate()}
            />
          </View>
        )}
        {addresses.data && addresses.data.length === 0 && !addingAddress ? (
          <ThemedText type="small" themeColor="textSecondary">
            No saved addresses yet - add one above.
          </ThemedText>
        ) : (
          <View style={styles.optionList}>{addresses.data?.map(renderAddressRow)}</View>
        )}

        <ThemedText type="smallBold" style={styles.sectionLabel}>
          Notes (optional)
        </ThemedText>
        <TextField
          placeholder="Anything the provider should know?"
          value={notes}
          onChangeText={setNotes}
          multiline
          numberOfLines={3}
          style={styles.notesInput}
        />

        {error && (
          <ThemedText type="small" style={[styles.error, { color: theme.accent }]}>
            {error}
          </ThemedText>
        )}
      </ScrollView>

      <View style={[styles.footer, { borderTopColor: theme.divider, paddingBottom: insets.bottom + 16 }]}>
        <Button
          label="Confirm booking"
          block
          disabled={!canSubmit}
          loading={bookingMutation.isPending}
          onPress={() => {
            setError(null);
            bookingMutation.mutate();
          }}
        />
      </View>
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
  },
  header: {
    paddingHorizontal: 24,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerTitle: {
    fontFamily: 'Archivo_800ExtraBold',
    fontSize: 14,
    flexShrink: 1,
  },
  headerDivider: {
    marginTop: 16,
  },
  form: {
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 24,
  },
  sectionLabel: {
    marginTop: 20,
    marginBottom: 10,
  },
  sectionLabelRow: {
    marginTop: 20,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  addAddressButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  optionList: {
    gap: 8,
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderWidth: 1,
    padding: 12,
  },
  optionTitle: {
    fontFamily: 'Archivo_800ExtraBold',
    fontSize: 14,
  },
  optionPrice: {
    fontFamily: 'Archivo_800ExtraBold',
    fontSize: 14,
  },
  chipRow: {
    flexGrow: 0,
  },
  chipSpacing: {
    marginRight: 8,
  },
  chipWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  addAddressForm: {
    marginBottom: 12,
  },
  fieldGap: {
    marginBottom: 12,
  },
  notesInput: {
    minHeight: 64,
    textAlignVertical: 'top',
  },
  error: {
    marginTop: 16,
  },
  footer: {
    borderTopWidth: 2,
    paddingHorizontal: 24,
    paddingTop: 12,
  },
});
