package com.quickfixhub.backend.messaging.dto;

import com.quickfixhub.backend.booking.BookingStatus;

import java.time.Instant;
import java.util.UUID;

// One row per booking the caller is party to (as customer or provider) - a booking IS the
// conversation thread, see the comment on Message. Sorted by lastMessageAt (falling back to the
// booking's own createdAt for a thread with no messages yet) so an active conversation surfaces
// above a booking nobody's messaged about.
public record ConversationResponse(
		UUID bookingId,
		String otherPartyName,
		String serviceName,
		BookingStatus status,
		String lastMessage,
		Instant lastMessageAt) {
}
