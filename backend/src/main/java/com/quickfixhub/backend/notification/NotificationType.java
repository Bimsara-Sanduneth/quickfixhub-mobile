package com.quickfixhub.backend.notification;

// Scoped-down Phase 5 (see NotificationService) - an in-app list only, no OS push. Each value is
// generated from exactly one place; see NotificationService's own callers (BookingController,
// MessageController, AdminVerificationController).
public enum NotificationType {
	// To the provider - a customer just requested a booking.
	BOOKING_REQUESTED,
	// To the customer - the provider accepted/declined their request.
	BOOKING_ACCEPTED,
	BOOKING_DECLINED,
	// To the customer - the provider is on the way / has started the job / finished it.
	BOOKING_EN_ROUTE,
	BOOKING_IN_PROGRESS,
	BOOKING_COMPLETED,
	// To the provider - the customer cancelled.
	BOOKING_CANCELLED,
	// To whichever side didn't send it.
	NEW_MESSAGE,
	// To the provider - an admin decided on their verification application.
	VERIFICATION_APPROVED,
	VERIFICATION_REJECTED,
	VERIFICATION_DOCS_REQUESTED
}
