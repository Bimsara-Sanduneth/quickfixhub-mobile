import { useQuery } from '@tanstack/react-query';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import { ArrowLeft, MessageSquare, Phone } from 'lucide-react-native';
import { useMemo, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { extractErrorMessage } from '@/api/errors';
import { getProvider } from '@/api/providers';
import type { ProviderServiceItem } from '@/api/types';
import { Button } from '@/components/ds/button';
import { Tag } from '@/components/ds/tag';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useTheme } from '@/hooks/use-theme';

export default function ProviderDetailScreen() {
  const { providerId } = useLocalSearchParams<{ providerId: string }>();
  const insets = useSafeAreaInsets();
  const theme = useTheme();
  const [showBookingNote, setShowBookingNote] = useState(false);

  const { data, isPending, isError, error, refetch } = useQuery({
    queryKey: ['providers', providerId],
    queryFn: () => getProvider(providerId),
    enabled: !!providerId,
  });

  const fromPrice = useMemo(() => {
    if (!data || data.services.length === 0) return null;
    return Math.min(...data.services.map((s) => s.price));
  }, [data]);

  const backButton = (
    <Pressable
      style={[styles.backButton, { top: insets.top + 8, backgroundColor: theme.bg }]}
      onPress={() => router.back()}
      hitSlop={8}>
      <ArrowLeft size={18} color={theme.text} />
    </Pressable>
  );

  if (isPending) {
    return (
      <ThemedView style={styles.centered}>
        <Stack.Screen options={{ headerShown: false }} />
        {backButton}
        <ActivityIndicator />
      </ThemedView>
    );
  }

  if (isError) {
    return (
      <ThemedView style={styles.centered}>
        <Stack.Screen options={{ headerShown: false }} />
        {backButton}
        <ThemedText type="small" style={{ color: theme.accent }}>
          {extractErrorMessage(error)}
        </ThemedText>
        <Pressable onPress={() => refetch()}>
          <ThemedText type="link">Try again</ThemedText>
        </Pressable>
      </ThemedView>
    );
  }

  function renderService({ item }: { item: ProviderServiceItem }) {
    return (
      <View style={[styles.serviceRow, { borderColor: theme.divider }]}>
        <ThemedText style={styles.serviceName}>{item.serviceName}</ThemedText>
        <ThemedText style={styles.servicePrice}>${item.price.toFixed(2)}</ThemedText>
      </View>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />

      <FlatList
        data={data.services}
        keyExtractor={(item) => item.serviceId}
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={
          <>
            <View style={[styles.coverPhoto, { backgroundColor: theme.neutral300 }]} />
            {backButton}

            <View style={styles.profileRow}>
              <View style={styles.avatarRow}>
                <View style={[styles.avatar, { backgroundColor: theme.neutral200, borderColor: theme.bg }]} />
                <View style={styles.actionIcons}>
                  {/* No calling/chat system yet - decorative for now. */}
                  <View style={[styles.actionIcon, { borderColor: theme.divider }]}>
                    <Phone size={17} color={theme.text} />
                  </View>
                  <View style={[styles.actionIcon, { borderColor: theme.divider }]}>
                    <MessageSquare size={17} color={theme.text} />
                  </View>
                </View>
              </View>

              <ThemedText style={styles.businessName}>{data.businessName}</ThemedText>
              <View style={styles.metaRow}>
                {data.verified && <Tag label="VERIFIED" variant="accent" />}
                {data.city && (
                  <ThemedText type="small" themeColor="textSecondary">
                    {data.city}
                  </ThemedText>
                )}
              </View>
            </View>

            {(data.services.length > 0 || data.yearsExperience != null) && (
              <View style={[styles.statsRow, { borderColor: theme.divider }]}>
                <View style={styles.statTile}>
                  <ThemedText style={styles.statValue}>{data.services.length}</ThemedText>
                  <ThemedText type="small" themeColor="textSecondary" style={styles.statLabel}>
                    SERVICES
                  </ThemedText>
                </View>
                {data.yearsExperience != null && (
                  <View style={[styles.statTile, styles.statTileBordered, { borderColor: theme.divider }]}>
                    <ThemedText style={styles.statValue}>{data.yearsExperience} yr</ThemedText>
                    <ThemedText type="small" themeColor="textSecondary" style={styles.statLabel}>
                      EXPERIENCE
                    </ThemedText>
                  </View>
                )}
              </View>
            )}

            <View style={styles.body}>
              {data.bio && (
                <ThemedText type="small" themeColor="textSecondary" style={styles.bio}>
                  {data.bio}
                </ThemedText>
              )}
              <ThemedText type="smallBold" style={styles.servicesHeading}>
                Services &amp; estimated pricing
              </ThemedText>
            </View>
          </>
        }
        ListEmptyComponent={
          <ThemedText type="default" style={styles.body}>
            No services listed yet.
          </ThemedText>
        }
        renderItem={renderService}
      />

      <View style={[styles.footer, { borderTopColor: theme.divider, paddingBottom: insets.bottom + 16 }]}>
        {showBookingNote && (
          <ThemedText type="small" themeColor="textSecondary" style={styles.bookingNote}>
            Booking isn&rsquo;t available yet — that&rsquo;s a bigger feature landing separately.
          </ThemedText>
        )}
        <View style={styles.footerRow}>
          {fromPrice != null && (
            <View>
              <ThemedText type="small" themeColor="textSecondary" style={styles.fromLabel}>
                FROM
              </ThemedText>
              <ThemedText style={styles.fromPrice}>${fromPrice.toFixed(2)}</ThemedText>
            </View>
          )}
          <Button label="Request booking" style={styles.bookButton} onPress={() => setShowBookingNote(true)} />
        </View>
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
    gap: 8,
  },
  listContent: {
    flexGrow: 1,
  },
  backButton: {
    position: 'absolute',
    left: 16,
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  coverPhoto: {
    height: 196,
  },
  profileRow: {
    marginTop: -46,
    paddingHorizontal: 20,
  },
  avatarRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
  },
  avatar: {
    width: 92,
    height: 92,
    borderWidth: 3,
  },
  actionIcons: {
    flexDirection: 'row',
    gap: 8,
  },
  actionIcon: {
    width: 36,
    height: 36,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  businessName: {
    fontFamily: 'Archivo_800ExtraBold',
    fontSize: 28,
    marginTop: 14,
    marginBottom: 4,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  statsRow: {
    flexDirection: 'row',
    marginHorizontal: 20,
    marginTop: 6,
    borderTopWidth: 2,
    borderBottomWidth: 2,
  },
  statTile: {
    flex: 1,
    paddingVertical: 12,
  },
  statTileBordered: {
    paddingLeft: 12,
  },
  statValue: {
    fontFamily: 'Archivo_800ExtraBold',
    fontSize: 22,
  },
  statLabel: {
    fontSize: 10,
    letterSpacing: 0.5,
  },
  body: {
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  bio: {
    lineHeight: 19,
    marginBottom: 16,
  },
  servicesHeading: {
    marginBottom: 4,
  },
  serviceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 9,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
  },
  serviceName: {
    fontSize: 13.5,
    fontWeight: '600',
  },
  servicePrice: {
    fontFamily: 'Archivo_800ExtraBold',
    fontSize: 13,
  },
  footer: {
    borderTopWidth: 2,
    paddingHorizontal: 20,
    paddingTop: 12,
  },
  bookingNote: {
    marginBottom: 8,
    textAlign: 'center',
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  fromLabel: {
    fontSize: 10,
    letterSpacing: 0.5,
  },
  fromPrice: {
    fontFamily: 'Archivo_800ExtraBold',
    fontSize: 20,
  },
  bookButton: {
    flex: 1,
  },
});
