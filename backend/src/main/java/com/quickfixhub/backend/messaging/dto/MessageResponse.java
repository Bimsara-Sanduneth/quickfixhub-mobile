package com.quickfixhub.backend.messaging.dto;

import com.quickfixhub.backend.messaging.Message;

import java.time.Instant;
import java.util.UUID;

public record MessageResponse(UUID id, UUID bookingId, UUID senderId, String senderName, String body, Instant createdAt) {

	public static MessageResponse from(Message message) {
		return new MessageResponse(
				message.getId(),
				message.getBooking().getId(),
				message.getSender().getId(),
				message.getSender().getFullName(),
				message.getBody(),
				message.getCreatedAt());
	}
}
