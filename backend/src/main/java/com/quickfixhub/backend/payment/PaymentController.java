package com.quickfixhub.backend.payment;

import com.quickfixhub.backend.booking.Booking;
import com.quickfixhub.backend.booking.BookingRepository;
import com.quickfixhub.backend.payment.dto.PaymentResponse;
import com.quickfixhub.backend.provider.ProviderProfileRepository;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import java.util.UUID;

// The receipt (2p) - only reachable by the booking's own customer or provider, 404 (not 403) on
// anyone else's booking, same IDOR-avoidance shape as the rest of the booking endpoints. 404 also
// when the booking exists but was never completed - a Payment row only exists post-completion
// (see PaymentService).
@RestController
public class PaymentController {

	private final BookingRepository bookingRepository;
	private final PaymentRepository paymentRepository;
	private final ProviderProfileRepository providerProfileRepository;

	public PaymentController(BookingRepository bookingRepository, PaymentRepository paymentRepository,
			ProviderProfileRepository providerProfileRepository) {
		this.bookingRepository = bookingRepository;
		this.paymentRepository = paymentRepository;
		this.providerProfileRepository = providerProfileRepository;
	}

	@GetMapping("/bookings/{id}/payment")
	public PaymentResponse getPayment(@AuthenticationPrincipal UUID userId, @PathVariable UUID id) {
		Booking booking = bookingRepository.findById(id)
				.orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Booking not found"));

		boolean isCustomer = booking.getCustomer().getId().equals(userId);
		boolean isProvider = providerProfileRepository.findByUserId(userId)
				.map(p -> p.getId().equals(booking.getProviderProfile().getId()))
				.orElse(false);
		if (!isCustomer && !isProvider) {
			throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Booking not found");
		}

		Payment payment = paymentRepository.findByBookingId(id)
				.orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "No payment recorded for this booking yet"));
		return PaymentResponse.from(payment);
	}
}
