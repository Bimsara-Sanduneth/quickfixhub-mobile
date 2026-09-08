import { useMutation, useQueryClient } from '@tanstack/react-query';

import { cancelBooking } from '@/api/bookings';
import { extractErrorMessage } from '@/api/errors';
import type { Booking } from '@/api/types';
import { useTheme } from '@/hooks/use-theme';
import { formatCurrency } from '@/utils/currency';

import { Button } from './ds/button';
import { Dialog } from './ds/dialog';
import { ThemedText } from './themed-text';

// No payment system exists yet, so this fee is informational only (matches the design's
// cancellation policy, which charges once the provider is already EN_ROUTE) - nothing is
// actually charged.
const CALL_OUT_FEE = 500;

export type CancelBookingDialogProps = {
  booking: Booking | null;
  onRequestClose: () => void;
};

export function CancelBookingDialog({ booking, onRequestClose }: CancelBookingDialogProps) {
  const theme = useTheme();
  const queryClient = useQueryClient();

  const cancelMutation = useMutation({
    mutationFn: (id: string) => cancelBooking(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bookings'] });
      onRequestClose();
    },
  });

  const feeApplies = booking?.cancellationFeeApplies ?? false;

  return (
    <Dialog
      visible={!!booking}
      title="Cancel this booking?"
      body={
        booking
          ? feeApplies
            ? `${booking.providerBusinessName} is already on the way. Cancelling now includes a ${formatCurrency(CALL_OUT_FEE)} call-out fee.`
            : `This cancels your booking with ${booking.providerBusinessName}. Free of charge at this stage.`
          : undefined
      }
      onRequestClose={onRequestClose}
      actions={
        <>
          <Button label="Keep it" variant="ghost" onPress={onRequestClose} />
          <Button
            label="Cancel booking"
            loading={cancelMutation.isPending}
            onPress={() => booking && cancelMutation.mutate(booking.id)}
          />
        </>
      }>
      {cancelMutation.isError && (
        <ThemedText type="small" style={{ color: theme.accent }}>
          {extractErrorMessage(cancelMutation.error)}
        </ThemedText>
      )}
    </Dialog>
  );
}
