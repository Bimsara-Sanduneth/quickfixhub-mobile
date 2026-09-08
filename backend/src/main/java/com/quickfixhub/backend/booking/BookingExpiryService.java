package com.quickfixhub.backend.booking;

import org.springframework.stereotype.Component;

import java.time.Instant;
import java.util.List;

// No scheduler in this codebase yet, so a REQUESTED booking past its accept window is expired
// lazily, the first time it's next read - on every list/action path a booking can reach, on
// either the customer (BookingController) or provider (MyProviderProfileController) side.
// Auto-expiry lands on DECLINED (not a separate EXPIRED status): from either party's point of
// view an unanswered request that timed out reads the same as one the provider explicitly
// turned down.
@Component
public class BookingExpiryService {

	private final BookingRepository bookingRepository;

	public BookingExpiryService(BookingRepository bookingRepository) {
		this.bookingRepository = bookingRepository;
	}

	public List<Booking> expireIfNeeded(List<Booking> bookings) {
		Instant now = Instant.now();
		List<Booking> expired = bookings.stream()
				.filter(b -> b.getStatus() == BookingStatus.REQUESTED && b.getExpiresAt() != null && b.getExpiresAt().isBefore(now))
				.peek(b -> {
					b.setStatus(BookingStatus.DECLINED);
					b.setDeclinedAt(now);
				})
				.toList();
		if (!expired.isEmpty()) {
			bookingRepository.saveAll(expired);
		}
		return bookings;
	}

	public Booking expireIfNeeded(Booking booking) {
		expireIfNeeded(List.of(booking));
		return booking;
	}
}
