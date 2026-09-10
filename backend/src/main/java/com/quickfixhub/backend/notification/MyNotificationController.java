package com.quickfixhub.backend.notification;

import com.quickfixhub.backend.notification.dto.NotificationResponse;
import com.quickfixhub.backend.notification.dto.UnreadCountResponse;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.UUID;

// Polled, not pushed - same "no real-time transport" shape as messaging (see MessageController's
// own comment). The mobile client polls unread-count from a shared header badge and the list
// itself while the Notifications screen is open.
@RestController
@RequestMapping("/me/notifications")
public class MyNotificationController {

	private final NotificationRepository notificationRepository;

	public MyNotificationController(NotificationRepository notificationRepository) {
		this.notificationRepository = notificationRepository;
	}

	@GetMapping
	public List<NotificationResponse> list(@AuthenticationPrincipal UUID userId) {
		return notificationRepository.findTop50ByRecipientIdOrderByCreatedAtDesc(userId).stream()
				.map(NotificationResponse::from)
				.toList();
	}

	@GetMapping("/unread-count")
	public UnreadCountResponse unreadCount(@AuthenticationPrincipal UUID userId) {
		return new UnreadCountResponse(notificationRepository.countByRecipientIdAndReadFalse(userId));
	}

	@PatchMapping("/{id}/read")
	public NotificationResponse markRead(@AuthenticationPrincipal UUID userId, @PathVariable UUID id) {
		Notification notification = notificationRepository.findById(id)
				.filter(n -> n.getRecipient().getId().equals(userId))
				.orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Notification not found"));
		notification.setRead(true);
		return NotificationResponse.from(notificationRepository.save(notification));
	}

	@PatchMapping("/read-all")
	@Transactional
	public void markAllRead(@AuthenticationPrincipal UUID userId) {
		notificationRepository.markAllRead(userId);
	}
}
