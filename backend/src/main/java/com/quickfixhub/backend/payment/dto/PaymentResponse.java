package com.quickfixhub.backend.payment.dto;

import com.quickfixhub.backend.payment.Payment;
import com.quickfixhub.backend.payment.PaymentStatus;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

public record PaymentResponse(
		UUID id,
		UUID bookingId,
		String customerName,
		String providerBusinessName,
		String serviceName,
		BigDecimal amount,
		PaymentStatus status,
		String method,
		Instant paidAt,
		BigDecimal refundAmount,
		String refundReason,
		Instant refundedAt) {

	public static PaymentResponse from(Payment payment) {
		var booking = payment.getBooking();
		return new PaymentResponse(
				payment.getId(),
				booking.getId(),
				booking.getCustomer().getFullName(),
				booking.getProviderProfile().getBusinessName(),
				booking.getProviderService().getService().getName(),
				payment.getAmount(),
				payment.getStatus(),
				payment.getMethod(),
				payment.getPaidAt(),
				payment.getRefundAmount(),
				payment.getRefundReason(),
				payment.getRefundedAt());
	}
}
