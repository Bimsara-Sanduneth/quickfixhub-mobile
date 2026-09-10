package com.quickfixhub.backend.messaging;

import com.quickfixhub.backend.booking.Booking;
import com.quickfixhub.backend.booking.BookingRepository;
import com.quickfixhub.backend.messaging.dto.ConversationResponse;
import com.quickfixhub.backend.provider.ProviderProfileRepository;
import com.quickfixhub.backend.user.Role;
import com.quickfixhub.backend.user.User;
import com.quickfixhub.backend.user.UserRepository;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import java.util.Comparator;
import java.util.List;
import java.util.UUID;

// The CHAT tab (was previously wired to nothing - a booking's chat was only reachable from its
// own detail screen). One row per booking, fetching each one's latest message individually - an
// N+1 shape, but fine at this project's per-user booking volume (same reasoning already used for
// Booking's own default-fetch associations).
@RestController
@RequestMapping("/me/conversations")
public class ConversationController {

	private final BookingRepository bookingRepository;
	private final MessageRepository messageRepository;
	private final UserRepository userRepository;
	private final ProviderProfileRepository providerProfileRepository;

	public ConversationController(BookingRepository bookingRepository, MessageRepository messageRepository,
			UserRepository userRepository, ProviderProfileRepository providerProfileRepository) {
		this.bookingRepository = bookingRepository;
		this.messageRepository = messageRepository;
		this.userRepository = userRepository;
		this.providerProfileRepository = providerProfileRepository;
	}

	@GetMapping
	public List<ConversationResponse> listConversations(@AuthenticationPrincipal UUID userId) {
		User user = userRepository.findById(userId)
				.orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));

		List<Booking> bookings;
		boolean isProvider = user.getRole() == Role.PROVIDER;
		if (isProvider) {
			bookings = providerProfileRepository.findByUserId(userId)
					.map(profile -> bookingRepository.findByProviderProfileIdOrderByScheduledAtDesc(profile.getId()))
					.orElse(List.of());
		} else {
			bookings = bookingRepository.findByCustomerIdOrderByScheduledAtDesc(userId);
		}

		return bookings.stream()
				.map(booking -> {
					var lastMessage = messageRepository.findFirstByBookingIdOrderByCreatedAtDesc(booking.getId());
					String otherPartyName = isProvider ? booking.getCustomer().getFullName() : booking.getProviderProfile().getBusinessName();
					return new ConversationResponse(
							booking.getId(),
							otherPartyName,
							booking.getProviderService().getService().getName(),
							booking.getStatus(),
							lastMessage.map(Message::getBody).orElse(null),
							lastMessage.map(Message::getCreatedAt).orElse(booking.getCreatedAt()));
				})
				.sorted(Comparator.comparing(ConversationResponse::lastMessageAt).reversed())
				.toList();
	}
}
