import { useMutation, useQuery } from '@tanstack/react-query';
import { router } from 'expo-router';
import { Camera, Check, Plus, Upload } from 'lucide-react-native';
import { useState } from 'react';
import { ActivityIndicator, Image, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { listCategories, searchServices } from '@/api/catalog';
import { extractErrorMessage } from '@/api/errors';
import { updateMyPhoto } from '@/api/me';
import { addMyProviderService, createMyProviderProfile, uploadMyDocument } from '@/api/providers';
import {
  DOCUMENT_TYPE_LABEL,
  DOCUMENT_TYPES,
  REQUIRED_DOCUMENT_TYPES,
  type DocumentType,
  type ProviderServiceItem,
} from '@/api/types';
import { useAuth } from '@/auth/AuthContext';
import { Button } from '@/components/ds/button';
import { Divider } from '@/components/ds/divider';
import { Tag } from '@/components/ds/tag';
import { TextField } from '@/components/ds/text-field';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useTheme } from '@/hooks/use-theme';
import { formatCurrency } from '@/utils/currency';
import { pickAndEncodePhoto } from '@/utils/photo';

const MIN_SERVICE_PRICE = 2000;

export default function ProviderOnboardingScreen() {
  const insets = useSafeAreaInsets();
  const theme = useTheme();
  const { clearJustRegistered } = useAuth();

  const [businessName, setBusinessName] = useState('');
  const [city, setCity] = useState('');
  const [yearsExperience, setYearsExperience] = useState('');
  const [bio, setBio] = useState('');
  const [photoDataUri, setPhotoDataUri] = useState<string | null>(null);

  const [profileId, setProfileId] = useState<string | null>(null);
  // documentType -> the data URI last confirmed uploaded (used to gate Finish, and to show a
  // thumbnail/checkmark for what's already submitted).
  const [documents, setDocuments] = useState<Partial<Record<DocumentType, string>>>({});
  const [uploadingDocType, setUploadingDocType] = useState<DocumentType | null>(null);
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
    mutationFn: async () => {
      const profile = await createMyProviderProfile({
        businessName: businessName.trim(),
        bio: bio.trim() || undefined,
        yearsExperience: yearsExperience.trim() ? Number(yearsExperience.trim()) : undefined,
        city: city.trim() || undefined,
      });
      // Best-effort - a photo-upload failure shouldn't block the rest of onboarding, the
      // business profile itself already exists at this point.
      if (photoDataUri) {
        await updateMyPhoto(photoDataUri).catch(() => {});
      }
      return profile;
    },
    onSuccess: (profile) => setProfileId(profile.id),
  });

  async function pickPhoto() {
    const dataUri = await pickAndEncodePhoto({ aspect: [1, 1], maxWidth: 512 });
    if (dataUri) {
      setPhotoDataUri(dataUri);
    }
  }

  const uploadDocumentMutation = useMutation({
    mutationFn: ({ documentType, fileDataUri }: { documentType: DocumentType; fileDataUri: string }) =>
      uploadMyDocument(documentType, fileDataUri),
    onSuccess: (document) => setDocuments((prev) => ({ ...prev, [document.documentType]: document.fileDataUri })),
    onSettled: () => setUploadingDocType(null),
  });

  async function pickDocument(documentType: DocumentType) {
    const dataUri = await pickAndEncodePhoto({ aspect: [4, 3], maxWidth: 1000 });
    if (dataUri) {
      setUploadingDocType(documentType);
      uploadDocumentMutation.mutate({ documentType, fileDataUri: dataUri });
    }
  }

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
  const requiredDocsSubmitted = REQUIRED_DOCUMENT_TYPES.every((type) => !!documents[type]);

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
            <Pressable style={styles.photoRow} onPress={pickPhoto}>
              <View style={[styles.photoCircle, { backgroundColor: theme.neutral200, borderColor: theme.divider }]}>
                {photoDataUri ? (
                  <Image source={{ uri: photoDataUri }} style={styles.photoImage} />
                ) : (
                  <Camera size={20} color={theme.neutral600} />
                )}
              </View>
              <ThemedText type="small" style={{ color: theme.accent }}>
                {photoDataUri ? 'Change photo' : 'Add a profile photo'}
              </ThemedText>
            </Pressable>
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
              Verification documents
            </ThemedText>
            <ThemedText type="small" themeColor="textSecondary" style={styles.docSectionHint}>
              Customers only see a Verified badge once an admin reviews these. National ID and trade licence are required
              before you can finish setting up.
            </ThemedText>

            {DOCUMENT_TYPES.map((type) => {
              const uploadedUri = documents[type];
              const isUploading = uploadDocumentMutation.isPending && uploadingDocType === type;
              return (
                <View key={type} style={[styles.docRow, { borderColor: theme.divider }]}>
                  <Pressable
                    style={[styles.docThumb, { backgroundColor: theme.neutral100, borderColor: theme.divider }]}
                    onPress={() => pickDocument(type)}
                    disabled={isUploading}>
                    {isUploading ? (
                      <ActivityIndicator size="small" color={theme.text} />
                    ) : uploadedUri ? (
                      <Image source={{ uri: uploadedUri }} style={styles.docThumbImage} />
                    ) : (
                      <Upload size={18} color={theme.neutral500} />
                    )}
                  </Pressable>
                  <View style={styles.docInfo}>
                    <View style={styles.docLabelRow}>
                      <ThemedText type="smallBold">{DOCUMENT_TYPE_LABEL[type]}</ThemedText>
                      {REQUIRED_DOCUMENT_TYPES.includes(type) && (
                        <ThemedText type="small" themeColor="textSecondary" style={styles.requiredTag}>
                          Required
                        </ThemedText>
                      )}
                    </View>
                    {uploadedUri ? (
                      <View style={styles.docUploadedRow}>
                        <Check size={12} color={theme.accent} strokeWidth={3} />
                        <ThemedText type="small" style={{ color: theme.accent }}>
                          Uploaded
                        </ThemedText>
                      </View>
                    ) : (
                      <ThemedText type="small" themeColor="textSecondary">
                        Not uploaded yet
                      </ThemedText>
                    )}
                    <Pressable onPress={() => pickDocument(type)} disabled={isUploading} hitSlop={4}>
                      <ThemedText type="small" style={{ color: theme.accent, marginTop: 2 }}>
                        {uploadedUri ? 'Replace' : 'Upload'}
                      </ThemedText>
                    </Pressable>
                  </View>
                </View>
              );
            })}
            {uploadDocumentMutation.isError && (
              <ThemedText type="small" style={{ color: theme.accent, marginBottom: 8 }}>
                {extractErrorMessage(uploadDocumentMutation.error)}
              </ThemedText>
            )}

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
                    containerStyle={styles.priceField}
                  />
                  <TextField
                    label="Duration (min)"
                    keyboardType="number-pad"
                    value={duration}
                    onChangeText={setDuration}
                    containerStyle={styles.priceField}
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
          {!requiredDocsSubmitted && (
            <ThemedText type="small" style={{ color: theme.accent, marginBottom: 8 }}>
              Upload your National ID and trade licence above to finish setting up.
            </ThemedText>
          )}
          <Button
            label={addedServices.length > 0 ? 'Finish' : 'Finish without a service'}
            onPress={finish}
            disabled={!requiredDocsSubmitted}
            block
          />
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
  photoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 20,
  },
  photoCircle: {
    width: 56,
    height: 56,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  photoImage: {
    width: '100%',
    height: '100%',
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
  docSectionHint: {
    lineHeight: 17,
    marginBottom: 14,
  },
  docRow: {
    flexDirection: 'row',
    gap: 12,
    borderWidth: 1,
    padding: 10,
    marginBottom: 10,
  },
  docThumb: {
    width: 52,
    height: 52,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  docThumbImage: {
    width: '100%',
    height: '100%',
  },
  docInfo: {
    flex: 1,
    gap: 2,
  },
  docLabelRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 6,
  },
  requiredTag: {
    fontSize: 10.5,
    fontStyle: 'italic',
  },
  docUploadedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
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
