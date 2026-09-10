package com.quickfixhub.backend.payment;

import com.quickfixhub.backend.booking.Booking;
import org.springframework.stereotype.Service;

@Service
public class PaymentService {

	private final PaymentRepository paymentRepository;

	public PaymentService(PaymentRepository paymentRepository) {
		this.paymentRepository = paymentRepository;
	}

	// Called once, right after a booking transitions to COMPLETED (see BookingController). Not
	// idempotent-guarded here - the booking's own status guard already ensures completeBooking
	// can only ever fire once per booking, so a duplicate Payment row can't happen this way.
	public void recordPayment(Booking booking) {
		paymentRepository.save(new Payment(booking, booking.getPriceAtBooking()));
	}
}
