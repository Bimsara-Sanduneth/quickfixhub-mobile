import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { router, Stack } from 'expo-router';
import { ArrowLeft } from 'lucide-react-native';
import { useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { extractErrorMessage } from '@/api/errors';
import { getMyAvailability, updateMyAvailability } from '@/api/providers';
import type { AvailabilityDay } from '@/api/types';
import { Button } from '@/components/ds/button';
import { Divider } from '@/components/ds/divider';
import { Tag } from '@/components/ds/tag';
import { TextField } from '@/components/ds/text-field';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useTheme } from '@/hooks/use-theme';

const DAY_NAMES = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

function defaultDays(): AvailabilityDay[] {
  return DAY_NAMES.map((_, dayOfWeek) => ({ dayOfWeek, isOpen: false, startTime: null, endTime: null }));
}

// Loose "does this look like HH:mm" check - the backend is the real validator, this just avoids
// an obviously-wrong submit (e.g. an empty field) round-tripping to the server first.
function looksLikeTime(value: string | null): boolean {
  return !!value && /^([01]\d|2[0-3]):[0-5]\d$/.test(value);
}

export default function ProviderAvailabilityScreen() {
  const insets = useSafeAreaInsets();
  const theme = useTheme();
  const queryClient = useQueryClient();

  const { data, isPending, isError, error, refetch } = useQuery({
    queryKey: ['me', 'availability'],
    queryFn: getMyAvailability,
  });

  const [days, setDays] = useState<AvailabilityDay[]>(defaultDays());
  const [radius, setRadius] = useState('');
  const [hasLoaded, setHasLoaded] = useState(false);

  // Syncs local editable state from the server once, the first time it loads - after that the
  // form is the source of truth until the user saves (a later background refetch shouldn't stomp
  // an in-progress edit). Done during render (React's documented pattern for "adjust state when a
  // prop/query result changes") rather than in a useEffect, to avoid the extra render pass an
  // effect-based setState would cause.
  if (data && !hasLoaded) {
    setHasLoaded(true);
    setDays(data.days);
    setRadius(data.serviceRadiusKm != null ? String(data.serviceRadiusKm) : '');
  }

  const saveMutation = useMutation({
    mutationFn: () =>
      updateMyAvailability({
        serviceRadiusKm: radius.trim() ? Number(radius.trim()) : undefined,
        days,
      }),
    onSuccess: (result) => {
      queryClient.setQueryData(['me', 'availability'], result);
    },
  });

  function toggleDay(dayOfWeek: number) {
    setDays((prev) => prev.map((d) => (d.dayOfWeek === dayOfWeek ? { ...d, isOpen: !d.isOpen } : d)));
  }

  function setDayTime(dayOfWeek: number, field: 'startTime' | 'endTime', value: string) {
    setDays((prev) => prev.map((d) => (d.dayOfWeek === dayOfWeek ? { ...d, [field]: value } : d)));
  }

  const canSave = days.every((d) => !d.isOpen || (looksLikeTime(d.startTime) && looksLikeTime(d.endTime)));

  return (
    <ThemedView style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />

      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <Pressable onPress={() => router.back()} hitSlop={8}>
          <ArrowLeft size={20} color={theme.text} />
        </Pressable>
        <ThemedText style={styles.headerTitle}>AVAILABILITY</ThemedText>
      </View>
      <Divider style={styles.headerDivider} />

      {isPending ? (
        <ActivityIndicator style={styles.loading} />
      ) : isError ? (
        <View style={styles.centered}>
          <ThemedText type="small" style={{ color: theme.accent }}>
            {extractErrorMessage(error)}
          </ThemedText>
          <Pressable onPress={() => refetch()}>
            <ThemedText type="link">Try again</ThemedText>
          </Pressable>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.body}>
          <ThemedText type="smallBold" style={styles.sectionLabel}>
            Service area
          </ThemedText>
          <TextField
            label="Radius (km)"
            keyboardType="number-pad"
            placeholder="e.g. 15"
            value={radius}
            onChangeText={setRadius}
            style={styles.radiusField}
          />
          <ThemedText type="small" themeColor="textSecondary" style={styles.radiusHint}>
            How far you&rsquo;re willing to travel for a job. Not enforced on bookings yet - shown on your profile only.
          </ThemedText>

          <Divider style={styles.sectionDivider} />

          <ThemedText type="smallBold" style={styles.sectionLabel}>
            Weekly hours
          </ThemedText>
          {days.map((day) => (
            <View key={day.dayOfWeek} style={[styles.dayRow, { borderColor: theme.divider }]}>
              <View style={styles.dayTop}>
                <ThemedText type="smallBold">{DAY_NAMES[day.dayOfWeek]}</ThemedText>
                <Pressable onPress={() => toggleDay(day.dayOfWeek)}>
                  <Tag label={day.isOpen ? 'Open' : 'Closed'} variant={day.isOpen ? 'solid' : 'outline'} />
                </Pressable>
              </View>
              {day.isOpen && (
                <View style={styles.timeRow}>
                  <TextField
                    label="Start"
                    placeholder="09:00"
                    value={day.startTime ?? ''}
                    onChangeText={(v) => setDayTime(day.dayOfWeek, 'startTime', v)}
                    style={styles.timeField}
                  />
                  <TextField
                    label="End"
                    placeholder="17:00"
                    value={day.endTime ?? ''}
                    onChangeText={(v) => setDayTime(day.dayOfWeek, 'endTime', v)}
                    style={styles.timeField}
                  />
                </View>
              )}
            </View>
          ))}

          {saveMutation.isError && (
            <ThemedText type="small" style={{ color: theme.accent, marginTop: 12 }}>
              {extractErrorMessage(saveMutation.error)}
            </ThemedText>
          )}
          {saveMutation.isSuccess && !saveMutation.isPending && (
            <ThemedText type="small" style={{ color: theme.accent800, marginTop: 12 }}>
              Saved.
            </ThemedText>
          )}
        </ScrollView>
      )}

      {!isPending && !isError && (
        <View style={[styles.footer, { paddingBottom: insets.bottom + 16, borderTopColor: theme.divider }]}>
          <Button label="Save" block disabled={!canSave} loading={saveMutation.isPending} onPress={() => saveMutation.mutate()} />
        </View>
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
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  body: {
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 24,
  },
  sectionLabel: {
    marginBottom: 12,
  },
  radiusField: {
    marginBottom: 8,
  },
  radiusHint: {
    lineHeight: 17,
  },
  sectionDivider: {
    marginVertical: 20,
  },
  dayRow: {
    borderWidth: 1,
    padding: 12,
    marginBottom: 10,
  },
  dayTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  timeRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 12,
  },
  timeField: {
    flex: 1,
  },
  footer: {
    paddingHorizontal: 24,
    paddingTop: 12,
    borderTopWidth: 2,
  },
});
