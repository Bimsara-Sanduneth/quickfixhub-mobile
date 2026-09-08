package com.quickfixhub.backend.booking;

// REQUESTED -> ACCEPTED -> EN_ROUTE -> IN_PROGRESS -> COMPLETED is the happy path; DECLINED only
// ever follows REQUESTED (provider declines, or the request expires unanswered) and CANCELLED can
// follow REQUESTED, ACCEPTED or EN_ROUTE (the customer's own choice) but never IN_PROGRESS or
// later - see BookingController for the exact per-transition guards.
public enum BookingStatus {
	REQUESTED,
	ACCEPTED,
	EN_ROUTE,
	IN_PROGRESS,
	COMPLETED,
	DECLINED,
	CANCELLED
}
