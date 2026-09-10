import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { router, Stack } from 'expo-router';
import { ArrowLeft, Upload } from 'lucide-react-native';
import { useState } from 'react';
import { ActivityIndicator, Image, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { extractErrorMessage } from '@/api/errors';
import { getMyVerification, uploadMyDocument } from '@/api/providers';
import {
  DOCUMENT_TYPE_LABEL,
  DOCUMENT_TYPES,
  REQUIRED_DOCUMENT_TYPES,
  type DocumentType,
  type ProviderDocument,
  type VerificationStatus,
} from '@/api/types';
import { Divider } from '@/components/ds/divider';
import { Tag, type TagVariant } from '@/components/ds/tag';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useTheme } from '@/hooks/use-theme';
import { pickAndEncodePhoto } from '@/utils/photo';

const STATUS_TAG_VARIANT: Record<VerificationStatus, TagVariant> = {
  PENDING: 'outline',
  APPROVED: 'accent',
  REJECTED: 'neutral',
};

const STATUS_COPY: Record<VerificationStatus, string> = {
  PENDING: 'Your documents are waiting on admin review.',
  APPROVED: "You're verified - customers see a Verified badge on your profile.",
  REJECTED: 'Your application needs attention - see the message below.',
};

const DOC_STATUS_TAG_VARIANT: Record<ProviderDocument['status'], TagVariant> = {
  PENDING: 'outline',
  CHECKED: 'accent',
  REJECTED: 'neutral',
};

export default function ProviderVerificationScreen() {
  const insets = useSafeAreaInsets();
  const theme = useTheme();
  const queryClient = useQueryClient();
  const [uploadingType, setUploadingType] = useState<DocumentType | null>(null);

  const { data, isPending, isError, error, refetch } = useQuery({
    queryKey: ['me', 'verification'],
    queryFn: getMyVerification,
  });

  const uploadMutation = useMutation({
    mutationFn: ({ documentType, fileDataUri }: { documentType: DocumentType; fileDataUri: string }) =>
      uploadMyDocument(documentType, fileDataUri),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['me', 'verification'] }),
    onSettled: () => setUploadingType(null),
  });

  async function pickDocument(documentType: DocumentType) {
    const dataUri = await pickAndEncodePhoto({ aspect: [4, 3], maxWidth: 1000 });
    if (dataUri) {
      setUploadingType(documentType);
      uploadMutation.mutate({ documentType, fileDataUri: dataUri });
    }
  }

  const documentByType = new Map(data?.documents.map((d) => [d.documentType, d]));
  const requiredSubmittedCount = REQUIRED_DOCUMENT_TYPES.filter((type) => documentByType.has(type)).length;

  return (
    <ThemedView style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />

      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <Pressable onPress={() => router.back()} hitSlop={8}>
          <ArrowLeft size={20} color={theme.text} />
        </Pressable>
        <ThemedText style={styles.headerTitle}>VERIFICATION</ThemedText>
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
          <View style={styles.statusRow}>
            <Tag label={data!.status} variant={STATUS_TAG_VARIANT[data!.status]} />
          </View>
          <ThemedText type="small" themeColor="textSecondary" style={styles.statusCopy}>
            {STATUS_COPY[data!.status]}
          </ThemedText>
          {data!.providerMessage && (
            <View style={[styles.messageBox, { borderColor: theme.accent, backgroundColor: theme.accent100 }]}>
              <ThemedText type="small" style={{ color: theme.accent800 }}>
                {data!.providerMessage}
              </ThemedText>
            </View>
          )}

          <Divider style={styles.sectionDivider} />
          <ThemedText type="smallBold" style={styles.sectionLabel}>
            Documents
          </ThemedText>
          <ThemedText type="small" themeColor="textSecondary" style={styles.sectionHint}>
            Upload a clear photo of each. Re-uploading replaces the previous one and sends it back for review.
            {'\n'}National ID and trade licence are required before an admin can verify you.
          </ThemedText>
          {data!.status !== 'APPROVED' && (
            <ThemedText type="small" style={{ color: requiredSubmittedCount === REQUIRED_DOCUMENT_TYPES.length ? theme.accent800 : theme.accent, marginTop: -8, marginBottom: 16 }}>
              {requiredSubmittedCount}/{REQUIRED_DOCUMENT_TYPES.length} required documents submitted
            </ThemedText>
          )}

          {DOCUMENT_TYPES.map((type) => {
            const doc = documentByType.get(type);
            const isUploading = uploadMutation.isPending && uploadingType === type;
            return (
              <View key={type} style={[styles.docRow, { borderColor: theme.divider }]}>
                <Pressable
                  style={[styles.docThumb, { backgroundColor: theme.neutral100, borderColor: theme.divider }]}
                  onPress={() => pickDocument(type)}
                  disabled={isUploading}>
                  {isUploading ? (
                    <ActivityIndicator size="small" color={theme.text} />
                  ) : doc ? (
                    <Image source={{ uri: doc.fileDataUri }} style={styles.docThumbImage} />
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
                  {doc ? (
                    <>
                      <Tag label={doc.status} variant={DOC_STATUS_TAG_VARIANT[doc.status]} style={styles.docStatusTag} />
                      {doc.status === 'REJECTED' && doc.reviewNote && (
                        <ThemedText type="small" style={{ color: theme.accent }}>
                          {doc.reviewNote}
                        </ThemedText>
                      )}
                    </>
                  ) : (
                    <ThemedText type="small" themeColor="textSecondary">
                      Not uploaded yet
                    </ThemedText>
                  )}
                  <Pressable onPress={() => pickDocument(type)} disabled={isUploading} hitSlop={4}>
                    <ThemedText type="small" style={{ color: theme.accent, marginTop: 2 }}>
                      {doc ? 'Replace' : 'Upload'}
                    </ThemedText>
                  </Pressable>
                </View>
              </View>
            );
          })}

          {uploadMutation.isError && (
            <ThemedText type="small" style={{ color: theme.accent, marginTop: 8 }}>
              {extractErrorMessage(uploadMutation.error)}
            </ThemedText>
          )}
        </ScrollView>
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
    paddingBottom: 32,
  },
  statusRow: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  statusCopy: {
    lineHeight: 18,
  },
  messageBox: {
    borderWidth: 1,
    padding: 10,
    marginTop: 12,
  },
  sectionDivider: {
    marginVertical: 20,
  },
  sectionLabel: {
    marginBottom: 6,
  },
  sectionHint: {
    lineHeight: 17,
    marginBottom: 16,
  },
  docRow: {
    flexDirection: 'row',
    gap: 12,
    borderWidth: 1,
    padding: 10,
    marginBottom: 10,
  },
  docThumb: {
    width: 56,
    height: 56,
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
  docStatusTag: {
    marginTop: 2,
    marginBottom: 2,
  },
});
