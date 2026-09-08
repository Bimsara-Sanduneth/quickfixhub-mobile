package com.quickfixhub.backend.payment;

// PAID is the only starting state (a Payment row only ever gets created once a booking reaches
// COMPLETED - see PaymentService). REFUNDED/PARTIALLY_REFUNDED are terminal: a payment is only
// ever refunded once (admin action, see AdminPaymentController), not incrementally.
public enum PaymentStatus {
	PAID,
	PARTIALLY_REFUNDED,
	REFUNDED
}
