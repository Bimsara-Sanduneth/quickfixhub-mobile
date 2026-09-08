package com.quickfixhub.backend.booking.dto;

import com.quickfixhub.backend.booking.Booking;
import com.quickfixhub.backend.booking.BookingStatus;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

public record BookingResponse(
		UUID id,
		UUID providerProfileId,
		String providerBusinessName,
		// Not needed for a customer's own bookings (they know who they are) but this DTO is
		// shared with the provider-side listing, which does need it.
		String customerName,
		UUID serviceId,
		String serviceName,
		UUID addressId,
		String addressLabel,
		String addressText,
		Instant scheduledAt,
		BookingStatus status,
		BigDecimal price,
		String notes,
		Instant createdAt,
		// Null once the booking leaves REQUESTED (accepted/declined/expired) - the mobile app only
		// needs this to run the accept-window countdown on the "request sent" screen.
		Instant expiresAt,
		Instant acceptedAt,
		Instant enRouteAt,
		Instant inProgressAt,
		Instant completedAt,
		Instant declinedAt,
		Instant cancelledAt,
		// True once the provider is EN_ROUTE - the point after which cancelling costs the flat
		// call-out fee. No payment system exists yet to actually charge it; this only drives the
		// warning shown in the cancellation dialog.
		boolean cancellationFeeApplies,
		// Whether this booking already has a review - lets the mobile app show/hide a "Leave a
		// review" action without a separate lookup per booking. Always false outside of
		// listMyBookings (a booking can't already be reviewed the moment it's created or
		// cancelled, since only a COMPLETED booking is ever reviewable).
		boolean reviewed) {

	public static BookingResponse from(Booking booking, boolean reviewed) {
		return new BookingResponse(
				booking.getId(),
				booking.getProviderProfile().getId(),
				booking.getProviderProfile().getBusinessName(),
				booking.getCustomer().getFullName(),
				booking.getProviderService().getService().getId(),
				booking.getProviderService().getService().getName(),
				booking.getAddress().getId(),
				booking.getAddress().getLabel(),
				booking.getAddress().getAddressText(),
				booking.getScheduledAt(),
				booking.getStatus(),
				booking.getPriceAtBooking(),
				booking.getNotes(),
				booking.getCreatedAt(),
				booking.getExpiresAt(),
				booking.getAcceptedAt(),
				booking.getEnRouteAt(),
				booking.getInProgressAt(),
				booking.getCompletedAt(),
				booking.getDeclinedAt(),
				booking.getCancelledAt(),
				booking.getStatus() == BookingStatus.EN_ROUTE,
				reviewed);
	}
}
