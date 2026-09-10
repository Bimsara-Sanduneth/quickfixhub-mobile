import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import { ArrowLeft, Check, Flag } from 'lucide-react-native';
import { useState } from 'react';
import { ActivityIndicator, Image, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { getAdminProvider, rejectProvider, requestProviderDocs, reviewProviderDocument, setProviderInternalNote, verifyProvider } from '@/api/admin';
import { extractErrorMessage } from '@/api/errors';
import {
  DOCUMENT_TYPE_LABEL,
  DOCUMENT_TYPES,
  REQUIRED_DOCUMENT_TYPES,
  type DocumentType,
  type ProviderDocument,
  type VerificationStatus,
} from '@/api/types';
import { Button } from '@/components/ds/button';
import { Dialog } from '@/components/ds/dialog';
import { Divider } from '@/components/ds/divider';
import { Tag, type TagVariant } from '@/components/ds/tag';
import { TextField } from '@/components/ds/text-field';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useTheme } from '@/hooks/use-theme';

const STATUS_TAG_VARIANT: Record<VerificationStatus, TagVariant> = {
  PENDING: 'solid',
  APPROVED: 'accent',
  REJECTED: 'neutral',
};

const DOC_STATUS_TAG_VARIANT: Record<ProviderDocument['status'], TagVariant> = {
  PENDING: 'outline',
  CHECKED: 'accent',
  REJECTED: 'neutral',
};

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}

type Decision = 'reject' | 'request-docs';

export default function AdminProviderVerificationDetailScreen() {
  const insets = useSafeAreaInsets();
  const theme = useTheme();
  const queryClient = useQueryClient();
  const { providerId } = useLocalSearchParams<{ providerId: string }>();

  const [note, setNote] = useState('');
  const [noteLoaded, setNoteLoaded] = useState(false);
  const [decision, setDecision] = useState<Decision | null>(null);
  const [decisionReason, setDecisionReason] = useState('');
  const [flagTarget, setFlagTarget] = useState<ProviderDocument | null>(null);
  const [flagNote, setFlagNote] = useState('');

  const { data, isPending } = useQuery({
    queryKey: ['admin', 'providers', 'detail', providerId],
    queryFn: () => getAdminProvider(providerId),
    enabled: !!providerId,
  });

  if (data && !noteLoaded) {
    setNoteLoaded(true);
    setNote(data.internalNote ?? '');
  }

  function invalidate() {
    queryClient.invalidateQueries({ queryKey: ['admin', 'providers'] });
    queryClient.invalidateQueries({ queryKey: ['admin', 'overview'] });
  }

  const verifyMutation = useMutation({
    mutationFn: () => verifyProvider(providerId),
    onSuccess: () => {
      invalidate();
      router.back();
    },
  });

  const decisionMutation = useMutation({
    mutationFn: () =>
      decision === 'reject' ? rejectProvider(providerId, decisionReason.trim()) : requestProviderDocs(providerId, decisionReason.trim()),
    onSuccess: () => {
      invalidate();
      closeDecision();
      router.back();
    },
  });

  const noteMutation = useMutation({
    mutationFn: () => setProviderInternalNote(providerId, note.trim()),
    onSuccess: invalidate,
  });

  const docCheckMutation = useMutation({
    mutationFn: (documentId: string) => reviewProviderDocument(providerId, documentId, 'CHECKED'),
    onSuccess: invalidate,
  });

  const docFlagMutation = useMutation({
    mutationFn: () => reviewProviderDocument(providerId, flagTarget!.id, 'REJECTED', flagNote.trim()),
    onSuccess: () => {
      invalidate();
      setFlagTarget(null);
      setFlagNote('');
    },
  });

  function closeDecision() {
    setDecision(null);
    setDecisionReason('');
  }

  const documentByType = new Map(data?.documents.map((d) => [d.documentType, d]));
  const missingRequired = REQUIRED_DOCUMENT_TYPES.filter((type) => !documentByType.has(type));

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

      {isPending || !data ? (
        <ActivityIndicator style={styles.loading} />
      ) : (
        <>
          <ScrollView contentContainerStyle={styles.body}>
            <View style={styles.titleRow}>
              <ThemedText style={styles.businessName}>{data.businessName}</ThemedText>
              <Tag label={data.verificationStatus} variant={STATUS_TAG_VARIANT[data.verificationStatus]} />
            </View>
            <ThemedText type="small" themeColor="textSecondary">
              {data.ownerEmail}
            </ThemedText>
            {data.city && (
              <ThemedText type="small" themeColor="textSecondary">
                {data.city}
                {data.yearsExperience != null ? ` · ${data.yearsExperience} yr experience` : ''} · applied {formatDate(data.createdAt)}
              </ThemedText>
            )}
            {data.bio && (
              <ThemedText type="small" themeColor="textSecondary" style={styles.bio}>
                {data.bio}
              </ThemedText>
            )}
            {data.providerMessage && (
              <View style={[styles.messageBox, { borderColor: theme.accent, backgroundColor: theme.accent100 }]}>
                <ThemedText type="small" style={{ color: theme.accent800 }}>
                  Sent to provider: &ldquo;{data.providerMessage}&rdquo;
                </ThemedText>
              </View>
            )}

            <Divider style={styles.sectionDivider} />
            <ThemedText type="smallBold" style={styles.sectionLabel}>
              Submitted documents ({data.documents.filter((d) => d.status === 'CHECKED').length}/{DOCUMENT_TYPES.length} checked)
            </ThemedText>

            {DOCUMENT_TYPES.map((type) => {
              const doc = documentByType.get(type);
              return (
                <View key={type} style={[styles.docRow, { borderColor: theme.divider }]}>
                  {doc ? (
                    <Image source={{ uri: doc.fileDataUri }} style={[styles.docThumb, { backgroundColor: theme.neutral200 }]} />
                  ) : (
                    <View style={[styles.docThumb, styles.docThumbEmpty, { backgroundColor: theme.neutral100, borderColor: theme.divider }]} />
                  )}
                  <View style={styles.docInfo}>
                    <View style={styles.docLabelRow}>
                      <ThemedText type="smallBold">{DOCUMENT_TYPE_LABEL[type as DocumentType]}</ThemedText>
                      {REQUIRED_DOCUMENT_TYPES.includes(type) && (
                        <ThemedText type="small" themeColor="textSecondary" style={styles.requiredTag}>
                          Required
                        </ThemedText>
                      )}
                    </View>
                    {doc ? (
                      <>
                        <Tag label={doc.status} variant={DOC_STATUS_TAG_VARIANT[doc.status]} style={styles.docStatusTag} />
                        {doc.reviewNote && (
                          <ThemedText type="small" themeColor="textSecondary" style={styles.docNote}>
                            {doc.reviewNote}
                          </ThemedText>
                        )}
                        {doc.status !== 'CHECKED' && (
                          <View style={styles.docActions}>
                            <Pressable
                              style={styles.docActionButton}
                              onPress={() => docCheckMutation.mutate(doc.id)}
                              disabled={docCheckMutation.isPending}
                              hitSlop={6}>
                              <Check size={13} color={theme.accent} />
                              <ThemedText type="small" style={{ color: theme.accent }}>
                                Mark checked
                              </ThemedText>
                            </Pressable>
                            <Pressable
                              style={styles.docActionButton}
                              onPress={() => {
                                setFlagTarget(doc);
                                setFlagNote(doc.reviewNote ?? '');
                              }}
                              hitSlop={6}>
                              <Flag size={13} color={theme.text} />
                              <ThemedText type="small">Flag issue</ThemedText>
                            </Pressable>
                          </View>
                        )}
                      </>
                    ) : (
                      <ThemedText type="small" themeColor="textSecondary">
                        Not submitted yet
                      </ThemedText>
                    )}
                  </View>
                </View>
              );
            })}

            <Divider style={styles.sectionDivider} />
            <ThemedText type="smallBold" style={styles.sectionLabel}>
              Internal note
            </ThemedText>
            <ThemedText type="small" themeColor="textSecondary" style={styles.noteHint}>
              Only visible to admins - never shown to the provider.
            </ThemedText>
            <TextField
              placeholder="Notes for other admins..."
              value={note}
              onChangeText={setNote}
              multiline
              numberOfLines={3}
              style={styles.noteInput}
            />
            <Button
              label="Save note"
              variant="secondary"
              loading={noteMutation.isPending}
              disabled={note.trim() === (data.internalNote ?? '')}
              onPress={() => noteMutation.mutate()}
              style={styles.saveNoteButton}
            />

            {(verifyMutation.isError || decisionMutation.isError) && (
              <ThemedText type="small" style={{ color: theme.accent, marginTop: 12 }}>
                {extractErrorMessage(verifyMutation.error ?? decisionMutation.error)}
              </ThemedText>
            )}
          </ScrollView>

          {data.verificationStatus !== 'APPROVED' && missingRequired.length > 0 && (
            <ThemedText type="small" style={{ color: theme.accent, paddingHorizontal: 20, marginBottom: 8 }}>
              Can&rsquo;t approve yet - still missing {missingRequired.map((t) => DOCUMENT_TYPE_LABEL[t]).join(', ')}.
            </ThemedText>
          )}
          <View style={[styles.footer, { paddingBottom: insets.bottom + 16, borderTopColor: theme.divider }]}>
            <Button label="Reject" variant="secondary" style={styles.footerButton} onPress={() => setDecision('reject')} />
            <Button label="Request docs" variant="secondary" style={styles.footerButton} onPress={() => setDecision('request-docs')} />
            <Button
              label="Approve"
              style={styles.footerButton}
              disabled={missingRequired.length > 0}
              loading={verifyMutation.isPending}
              onPress={() => verifyMutation.mutate()}
            />
          </View>
        </>
      )}

      <Dialog
        visible={!!decision}
        title={decision === 'reject' ? 'Reject this application?' : 'Ask for more documents?'}
        onRequestClose={closeDecision}
        actions={
          <>
            <Button label="Cancel" variant="ghost" onPress={closeDecision} />
            <Button
              label={decision === 'reject' ? 'Reject' : 'Send request'}
              disabled={!decisionReason.trim()}
              loading={decisionMutation.isPending}
              onPress={() => decisionMutation.mutate()}
            />
          </>
        }>
        <TextField
          label="Message to the provider"
          placeholder={decision === 'reject' ? 'Why is this being rejected?' : 'What do they need to resubmit?'}
          value={decisionReason}
          onChangeText={setDecisionReason}
          multiline
          numberOfLines={3}
        />
      </Dialog>

      <Dialog
        visible={!!flagTarget}
        title={flagTarget ? `Flag ${DOCUMENT_TYPE_LABEL[flagTarget.documentType]}?` : 'Flag document'}
        onRequestClose={() => setFlagTarget(null)}
        actions={
          <>
            <Button label="Cancel" variant="ghost" onPress={() => setFlagTarget(null)} />
            <Button
              label="Flag"
              disabled={!flagNote.trim()}
              loading={docFlagMutation.isPending}
              onPress={() => docFlagMutation.mutate()}
            />
          </>
        }>
        <TextField label="Reason" placeholder="e.g. expired, unreadable" value={flagNote} onChangeText={setFlagNote} multiline numberOfLines={2} />
      </Dialog>
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
  body: {
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 24,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  businessName: {
    fontFamily: 'Archivo_800ExtraBold',
    fontSize: 20,
    flexShrink: 1,
  },
  bio: {
    marginTop: 8,
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
    marginBottom: 12,
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
  },
  docThumbEmpty: {
    borderWidth: 1,
    borderStyle: 'dashed',
  },
  docInfo: {
    flex: 1,
    gap: 4,
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
  },
  docNote: {
    fontStyle: 'italic',
  },
  docActions: {
    flexDirection: 'row',
    gap: 16,
    marginTop: 4,
  },
  docActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  noteHint: {
    marginTop: -8,
    marginBottom: 10,
  },
  noteInput: {
    minHeight: 64,
    textAlignVertical: 'top',
  },
  saveNoteButton: {
    marginTop: 10,
    justifyContent: 'center',
  },
  footer: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 20,
    paddingTop: 12,
    borderTopWidth: 2,
  },
  footerButton: {
    flex: 1,
    justifyContent: 'center',
  },
});
