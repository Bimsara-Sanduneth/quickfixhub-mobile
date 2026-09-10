package com.quickfixhub.backend.notification;

import com.quickfixhub.backend.user.User;
import org.springframework.stereotype.Service;

import java.util.UUID;

// The whole of Phase 5's "notifications", scoped down to an in-app list (see the type's own
// comment) - real OS push would need a dev-client build and push credentials neither of which
// exist in this project yet. Callers pass an already-loaded User (never look one up themselves),
// since every call site already has the recipient in hand from the entity it's acting on.
@Service
public class NotificationService {

	private final NotificationRepository notificationRepository;

	public NotificationService(NotificationRepository notificationRepository) {
		this.notificationRepository = notificationRepository;
	}

	public void notify(User recipient, NotificationType type, String title, String body) {
		notify(recipient, type, title, body, null);
	}

	public void notify(User recipient, NotificationType type, String title, String body, UUID bookingId) {
		notificationRepository.save(new Notification(recipient, type, title, body, bookingId));
	}
}
