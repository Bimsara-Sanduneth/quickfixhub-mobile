package com.quickfixhub.backend.notification.dto;

import com.quickfixhub.backend.notification.Notification;
import com.quickfixhub.backend.notification.NotificationType;

import java.time.Instant;
import java.util.UUID;

public record NotificationResponse(
		UUID id,
		NotificationType type,
		String title,
		String body,
		UUID bookingId,
		boolean read,
		Instant createdAt) {

	public static NotificationResponse from(Notification notification) {
		return new NotificationResponse(
				notification.getId(),
				notification.getType(),
				notification.getTitle(),
				notification.getBody(),
				notification.getBookingId(),
				notification.isRead(),
				notification.getCreatedAt());
	}
}
