package com.quickfixhub.backend.messaging;

import com.quickfixhub.backend.booking.Booking;
import com.quickfixhub.backend.booking.BookingRepository;
import com.quickfixhub.backend.messaging.dto.CreateMessageRequest;
import com.quickfixhub.backend.messaging.dto.MessageResponse;
import com.quickfixhub.backend.notification.NotificationService;
import com.quickfixhub.backend.notification.NotificationType;
import com.quickfixhub.backend.user.User;
import com.quickfixhub.backend.user.UserRepository;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.UUID;

// No real-time transport here (no WebSocket in this codebase yet) - the mobile client polls this
// on an interval, same "not real-time push" characteristic as the rest of the app. Access is
// whoever's on either side of the booking (its customer, or the user behind its provider
// profile) - there's no separate Conversation entity, see the comment on Message for why.
@RestController
@RequestMapping("/bookings/{bookingId}/messages")
public class MessageController {

	// A message body over this length is truncated for the notification preview - the message
	// itself is stored/shown in full, this only trims what lands in the notification list.
	private static final int PREVIEW_LENGTH = 120;

	private final MessageRepository messageRepository;
	private final BookingRepository bookingRepository;
	private final UserRepository userRepository;
	private final NotificationService notificationService;

	public MessageController(MessageRepository messageRepository, BookingRepository bookingRepository,
			UserRepository userRepository, NotificationService notificationService) {
		this.messageRepository = messageRepository;
		this.bookingRepository = bookingRepository;
		this.userRepository = userRepository;
		this.notificationService = notificationService;
	}

	@GetMapping
	public List<MessageResponse> listMessages(@AuthenticationPrincipal UUID userId, @PathVariable UUID bookingId) {
		resolveAccessibleBooking(userId, bookingId);
		return messageRepository.findByBookingIdOrderByCreatedAtAsc(bookingId).stream()
				.map(MessageResponse::from)
				.toList();
	}

	@PostMapping
	@ResponseStatus(HttpStatus.CREATED)
	public MessageResponse sendMessage(@AuthenticationPrincipal UUID userId, @PathVariable UUID bookingId,
			@Valid @RequestBody CreateMessageRequest request) {
		Booking booking = resolveAccessibleBooking(userId, bookingId);
		// A real (not getReferenceById-proxy) User - MessageResponse.from() needs
		// sender.getFullName() right after save(), and a lazy proxy can't satisfy that outside a
		// session (open-in-view is disabled). BookingController.createBooking hit the exact same
		// LazyInitializationException before this was learned - see its comment.
		User sender = userRepository.findById(userId)
				.orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));

		Message message = new Message(booking, sender, request.body());
		message = messageRepository.save(message);

		boolean senderIsCustomer = booking.getCustomer().getId().equals(userId);
		User recipient = senderIsCustomer ? booking.getProviderProfile().getUser() : booking.getCustomer();
		String preview = request.body().length() > PREVIEW_LENGTH ? request.body().substring(0, PREVIEW_LENGTH) + "…" : request.body();
		notificationService.notify(recipient, NotificationType.NEW_MESSAGE, "New message from " + sender.getFullName(), preview,
				booking.getId());

		return MessageResponse.from(message);
	}

	// 404 (not 403) for a booking that exists but isn't either side's - same "don't confirm the id
	// belongs to someone else" reasoning as every other ownership check in this codebase.
	private Booking resolveAccessibleBooking(UUID userId, UUID bookingId) {
		Booking booking = bookingRepository.findById(bookingId)
				.orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Booking not found"));
		boolean isCustomer = booking.getCustomer().getId().equals(userId);
		boolean isProvider = booking.getProviderProfile().getUser().getId().equals(userId);
		if (!isCustomer && !isProvider) {
			throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Booking not found");
		}
		return booking;
	}
}
