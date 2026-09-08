import { useMutation, useQuery } from '@tanstack/react-query';
import { router } from 'expo-router';
import { Check, Plus } from 'lucide-react-native';
import { useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { listCategories, searchServices } from '@/api/catalog';
import { extractErrorMessage } from '@/api/errors';
import { addMyProviderService, createMyProviderProfile } from '@/api/providers';
import type { ProviderServiceItem } from '@/api/types';
import { useAuth } from '@/auth/AuthContext';
import { Button } from '@/components/ds/button';
import { Divider } from '@/components/ds/divider';
import { Tag } from '@/components/ds/tag';
import { TextField } from '@/components/ds/text-field';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useTheme } from '@/hooks/use-theme';
import { formatCurrency } from '@/utils/currency';

const MIN_SERVICE_PRICE = 2000;

export default function ProviderOnboardingScreen() {
  const insets = useSafeAreaInsets();
  const theme = useTheme();
  const { clearJustRegistered } = useAuth();

  const [businessName, setBusinessName] = useState('');
  const [city, setCity] = useState('');
  const [yearsExperience, setYearsExperience] = useState('');
  const [bio, setBio] = useState('');

  const [profileId, setProfileId] = useState<string | null>(null);
  const [addedServices, setAddedServices] = useState<ProviderServiceItem[]>([]);
  const [categoryId, setCategoryId] = useState<string | undefined>();
  const [serviceId, setServiceId] = useState<string | undefined>();
  const [price, setPrice] = useState('');
  const [duration, setDuration] = useState('');

  const categories = useQuery({ queryKey: ['categories'], queryFn: listCategories, enabled: !!profileId });
  const categoryServices = useQuery({
    queryKey: ['services', { categoryId }],
    queryFn: () => searchServices({ categoryId }),
    enabled: !!categoryId,
  });

  const createProfileMutation = useMutation({
    mutationFn: () =>
      createMyProviderProfile({
        businessName: businessName.trim(),
        bio: bio.trim() || undefined,
        yearsExperience: yearsExperience.trim() ? Number(yearsExperience.trim()) : undefined,
        city: city.trim() || undefined,
      }),
    onSuccess: (profile) => setProfileId(profile.id),
  });

  const addServiceMutation = useMutation({
    mutationFn: () =>
      addMyProviderService({
        serviceId: serviceId!,
        price: Number(price),
        durationMinutes: duration.trim() ? Number(duration.trim()) : undefined,
      }),
    onSuccess: (service) => {
      setAddedServices((prev) => [...prev, service]);
      setCategoryId(undefined);
      setServiceId(undefined);
      setPrice('');
      setDuration('');
    },
  });

  function finish() {
    clearJustRegistered();
    router.replace('/(app)');
  }

  const canCreateProfile = businessName.trim().length > 0;
  const canAddService = !!serviceId && Number(price) >= MIN_SERVICE_PRICE;

  return (
    <ThemedView style={styles.container}>
      <View style={{ paddingTop: insets.top + 8, paddingHorizontal: 24 }}>
        <ThemedText style={styles.step}>SET UP YOUR BUSINESS</ThemedText>
      </View>
      <Divider style={styles.headerDivider} />

      <ScrollView contentContainerStyle={styles.body}>
        <ThemedText style={styles.title}>Get found by{'\n'}customers.</ThemedText>
        <ThemedText type="small" themeColor="textSecondary" style={styles.subtitle}>
          Customers only see providers with a business profile and at least one priced service.
        </ThemedText>

        {!profileId ? (
          <>
            <TextField label="Business name" value={businessName} onChangeText={setBusinessName} style={styles.fieldGap} />
            <TextField label="City" value={city} onChangeText={setCity} style={styles.fieldGap} />
            <TextField
              label="Years of experience"
              keyboardType="number-pad"
              value={yearsExperience}
              onChangeText={setYearsExperience}
              style={styles.fieldGap}
            />
            <TextField
              label="Bio"
              placeholder="What do you do, and what makes you good at it?"
              value={bio}
              onChangeText={setBio}
              multiline
              numberOfLines={3}
              style={styles.bioInput}
            />
            {createProfileMutation.isError && (
              <ThemedText type="small" style={{ color: theme.accent, marginTop: 12 }}>
                {extractErrorMessage(createProfileMutation.error)}
              </ThemedText>
            )}
            <Button
              label="Create profile"
              block
              style={styles.createButton}
              disabled={!canCreateProfile}
              loading={createProfileMutation.isPending}
              onPress={() => createProfileMutation.mutate()}
            />
          </>
        ) : (
          <>
            <View style={[styles.doneRow, { backgroundColor: theme.accent100 }]}>
              <Check size={16} color={theme.accent} strokeWidth={3} />
              <ThemedText type="small" style={{ color: theme.accent800 }}>
                Business profile created.
              </ThemedText>
            </View>

            <Divider style={styles.sectionDivider} />
            <ThemedText type="smallBold" style={styles.sectionLabel}>
              Your services
            </ThemedText>

            {addedServices.map((service) => (
              <View key={service.providerServiceId} style={[styles.serviceRow, { borderColor: theme.divider }]}>
                <ThemedText style={styles.serviceName}>{service.serviceName}</ThemedText>
                <ThemedText style={styles.servicePrice}>{formatCurrency(service.price)}</ThemedText>
              </View>
            ))}

            <ThemedText type="small" themeColor="textSecondary" style={styles.sectionLabel}>
              Category
            </ThemedText>
            {categories.isPending ? (
              <ActivityIndicator style={styles.sectionLoading} />
            ) : (
              <View style={styles.chipWrap}>
                {categories.data?.map((category) => (
                  <Pressable
                    key={category.id}
                    onPress={() => {
                      setCategoryId(category.id);
                      setServiceId(undefined);
                    }}>
                    <Tag label={category.name} variant={category.id === categoryId ? 'solid' : 'outline'} />
                  </Pressable>
                ))}
              </View>
            )}

            {categoryId && (
              <>
                <ThemedText type="small" themeColor="textSecondary" style={styles.sectionLabel}>
                  Service
                </ThemedText>
                {categoryServices.isPending ? (
                  <ActivityIndicator style={styles.sectionLoading} />
                ) : categoryServices.data && categoryServices.data.content.length === 0 ? (
                  <ThemedText type="small" themeColor="textSecondary">
                    No services in this category yet.
                  </ThemedText>
                ) : (
                  <View style={styles.chipWrap}>
                    {categoryServices.data?.content.map((service) => (
                      <Pressable key={service.id} onPress={() => setServiceId(service.id)}>
                        <Tag label={service.name} variant={service.id === serviceId ? 'solid' : 'outline'} />
                      </Pressable>
                    ))}
                  </View>
                )}
              </>
            )}

            {serviceId && (
              <>
                <View style={styles.priceRow}>
                  <TextField
                    label="Price (Rs.)"
                    keyboardType="decimal-pad"
                    value={price}
                    onChangeText={setPrice}
                    style={styles.priceField}
                  />
                  <TextField
                    label="Duration (min)"
                    keyboardType="number-pad"
                    value={duration}
                    onChangeText={setDuration}
                    style={styles.priceField}
                  />
                </View>
                <ThemedText type="small" themeColor="textSecondary" style={styles.priceHint}>
                  Minimum price is {formatCurrency(MIN_SERVICE_PRICE)}.
                </ThemedText>
              </>
            )}

            {addServiceMutation.isError && (
              <ThemedText type="small" style={{ color: theme.accent, marginTop: 8 }}>
                {extractErrorMessage(addServiceMutation.error)}
              </ThemedText>
            )}

            <Button
              label="Add service"
              variant="secondary"
              icon={<Plus size={16} color={theme.text} />}
              style={styles.addServiceButton}
              disabled={!canAddService}
              loading={addServiceMutation.isPending}
              onPress={() => addServiceMutation.mutate()}
            />
          </>
        )}
      </ScrollView>

      {profileId && (
        <View style={[styles.footer, { paddingBottom: insets.bottom + 24, borderTopColor: theme.divider }]}>
          <Button label={addedServices.length > 0 ? 'Finish' : 'Finish without a service'} onPress={finish} block />
        </View>
      )}
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
  headerDivider: {
    marginTop: 16,
  },
  body: {
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 24,
  },
  title: {
    fontFamily: 'Archivo_800ExtraBold',
    fontSize: 32,
    lineHeight: 33,
    marginBottom: 8,
  },
  subtitle: {
    lineHeight: 18,
    marginBottom: 22,
  },
  fieldGap: {
    marginBottom: 14,
  },
  bioInput: {
    minHeight: 64,
    textAlignVertical: 'top',
  },
  createButton: {
    marginTop: 20,
  },
  doneRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 12,
  },
  sectionDivider: {
    marginTop: 20,
    marginBottom: 18,
  },
  sectionLabel: {
    marginBottom: 10,
  },
  sectionLoading: {
    marginBottom: 12,
  },
  serviceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 9,
    borderBottomWidth: 1,
    marginBottom: 12,
  },
  serviceName: {
    fontSize: 13.5,
    fontWeight: '600',
  },
  servicePrice: {
    fontFamily: 'Archivo_800ExtraBold',
    fontSize: 13,
  },
  chipWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  priceRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  priceField: {
    flex: 1,
  },
  priceHint: {
    marginTop: -8,
    marginBottom: 16,
  },
  addServiceButton: {
    justifyContent: 'center',
  },
  footer: {
    paddingHorizontal: 24,
    paddingTop: 12,
    borderTopWidth: 2,
  },
});
