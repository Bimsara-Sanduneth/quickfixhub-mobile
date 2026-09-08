package com.quickfixhub.backend.admin.dto;

import java.math.BigDecimal;

public record AdminOverviewResponse(
		long totalCustomers,
		long totalProviders,
		long verifiedProviders,
		long pendingVerification,
		long totalBookings,
		long completedBookings,
		// Gross of any refunds - "money that has moved through the mocked ledger", not a net
		// balance. totalRefunded is the amount to subtract for a net figure.
		BigDecimal totalRevenue,
		BigDecimal totalRefunded) {
}
