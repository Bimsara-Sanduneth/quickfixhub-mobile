import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { router, Stack } from 'expo-router';
import { ArrowLeft } from 'lucide-react-native';
import { useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { listAdminPayments, refundPayment } from '@/api/admin';
import { extractErrorMessage } from '@/api/errors';
import type { Payment } from '@/api/types';
import { Button } from '@/components/ds/button';
import { Dialog } from '@/components/ds/dialog';
import { Divider } from '@/components/ds/divider';
import { Tag, type TagVariant } from '@/components/ds/tag';
import { TextField } from '@/components/ds/text-field';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useTheme } from '@/hooks/use-theme';
import { formatCurrency } from '@/utils/currency';

const STATUS_VARIANT: Record<Payment['status'], TagVariant> = {
  PAID: 'accent',
  PARTIALLY_REFUNDED: 'neutral',
  REFUNDED: 'neutral',
};

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}

export default function AdminPaymentsScreen() {
  const insets = useSafeAreaInsets();
  const theme = useTheme();
  const queryClient = useQueryClient();
  const [refundTarget, setRefundTarget] = useState<Payment | null>(null);
  const [refundAmount, setRefundAmount] = useState('');
  const [refundReason, setRefundReason] = useState('');

  const { data, isPending } = useQuery({ queryKey: ['admin', 'payments'], queryFn: () => listAdminPayments() });

  const refundMutation = useMutation({
    mutationFn: () => refundPayment(refundTarget!.id, { amount: Number(refundAmount), reason: refundReason.trim() }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'payments'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'overview'] });
      closeDialog();
    },
  });

  function openDialog(payment: Payment) {
    setRefundTarget(payment);
    setRefundAmount(payment.amount.toFixed(2));
    setRefundReason('');
  }

  function closeDialog() {
    setRefundTarget(null);
    setRefundAmount('');
    setRefundReason('');
  }

  function renderPayment({ item }: { item: Payment }) {
    return (
      <Pressable
        style={[styles.row, { borderColor: theme.divider }]}
        disabled={item.status !== 'PAID'}
        onPress={() => openDialog(item)}>
        <View style={styles.rowTop}>
          <ThemedText style={styles.customerName}>{item.customerName}</ThemedText>
          <Tag label={item.status.replace('_', ' ')} variant={STATUS_VARIANT[item.status]} />
        </View>
        <ThemedText type="small" themeColor="textSecondary">
          {item.providerBusinessName} · {item.serviceName}
        </ThemedText>
        <View style={styles.rowBottom}>
          <ThemedText type="small" themeColor="textSecondary">
            Paid {formatDate(item.paidAt)}
          </ThemedText>
          <ThemedText style={styles.amount}>{formatCurrency(item.amount)}</ThemedText>
        </View>
        {item.refundAmount != null && (
          <ThemedText type="small" themeColor="textSecondary" style={styles.refundNote}>
            Refunded {formatCurrency(item.refundAmount)} - {item.refundReason}
          </ThemedText>
        )}
      </Pressable>
    );
  }

  const refundExceedsAmount = refundTarget != null && Number(refundAmount) > refundTarget.amount;
  const canSubmitRefund = !!refundTarget && Number(refundAmount) > 0 && !refundExceedsAmount && refundReason.trim().length > 0;

  return (
    <ThemedView style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />

      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <Pressable onPress={() => router.back()} hitSlop={8}>
          <ArrowLeft size={20} color={theme.text} />
        </Pressable>
        <ThemedText style={styles.headerTitle}>PAYMENTS &amp; REFUNDS</ThemedText>
      </View>
      <Divider style={styles.headerDivider} />

      {isPending ? (
        <ActivityIndicator style={styles.loading} />
      ) : (
        <FlatList
          data={data?.content ?? []}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <ThemedText type="small" themeColor="textSecondary" style={styles.emptyText}>
              No completed bookings have been paid yet.
            </ThemedText>
          }
          renderItem={renderPayment}
        />
      )}

      <Dialog
        visible={!!refundTarget}
        title={refundTarget ? `Refund ${refundTarget.customerName}?` : 'Refund'}
        onRequestClose={closeDialog}
        actions={
          <>
            <Button label="Cancel" variant="ghost" onPress={closeDialog} />
            <Button label="Issue refund" disabled={!canSubmitRefund} loading={refundMutation.isPending} onPress={() => refundMutation.mutate()} />
          </>
        }>
        <TextField
          label={`Amount (Rs.) - max ${refundTarget ? formatCurrency(refundTarget.amount) : ''}`}
          keyboardType="decimal-pad"
          value={refundAmount}
          onChangeText={setRefundAmount}
          error={refundExceedsAmount ? "Can't exceed the amount paid" : undefined}
          style={styles.fieldGap}
        />
        <TextField
          label="Reason"
          placeholder="Why is this being refunded?"
          value={refundReason}
          onChangeText={setRefundReason}
          multiline
          numberOfLines={2}
        />
        {refundMutation.isError && (
          <ThemedText type="small" style={{ color: theme.accent, marginTop: 8 }}>
            {extractErrorMessage(refundMutation.error)}
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
  listContent: {
    flexGrow: 1,
    padding: 20,
    gap: 12,
  },
  emptyText: {
    textAlign: 'center',
    paddingVertical: 32,
  },
  row: {
    borderWidth: 1,
    padding: 14,
    gap: 4,
  },
  rowTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  customerName: {
    fontFamily: 'Archivo_800ExtraBold',
    fontSize: 15,
  },
  rowBottom: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 6,
  },
  amount: {
    fontFamily: 'Archivo_800ExtraBold',
    fontSize: 14,
  },
  refundNote: {
    marginTop: 4,
    fontStyle: 'italic',
  },
  fieldGap: {
    marginBottom: 12,
  },
});
