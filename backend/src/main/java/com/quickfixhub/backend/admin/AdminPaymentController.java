package com.quickfixhub.backend.admin;

import com.quickfixhub.backend.payment.Payment;
import com.quickfixhub.backend.payment.PaymentRepository;
import com.quickfixhub.backend.payment.PaymentStatus;
import com.quickfixhub.backend.payment.dto.PaymentResponse;
import com.quickfixhub.backend.payment.dto.RefundRequest;
import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import java.time.Instant;
import java.util.UUID;

// 2w - not a formal dispute-ticket system (nothing in this app lets a customer raise a dispute
// yet), just an admin browsing paid bookings with the ability to issue a refund and a reason -
// the concrete capability the design's dispute-detail screen actually needs. A payment can only
// be refunded once (PAID -> PARTIALLY_REFUNDED or REFUNDED), not incrementally.
@RestController
@RequestMapping("/admin/payments")
@PreAuthorize("hasRole('ADMIN')")
public class AdminPaymentController {

	private final PaymentRepository paymentRepository;

	public AdminPaymentController(PaymentRepository paymentRepository) {
		this.paymentRepository = paymentRepository;
	}

	@GetMapping
	public Page<PaymentResponse> listPayments(@PageableDefault(size = 20) Pageable pageable) {
		// paidAt DESC is baked into the JOIN FETCH query itself (Pageable's own sort doesn't
		// combine cleanly with a fetch-join query), so an explicit unsorted Pageable is fine here.
		return paymentRepository.findAllWithBookingDetails(Pageable.ofSize(pageable.getPageSize()).withPage(pageable.getPageNumber()))
				.map(PaymentResponse::from);
	}

	@PostMapping("/{id}/refund")
	public PaymentResponse refund(@PathVariable UUID id, @Valid @RequestBody RefundRequest request) {
		Payment payment = paymentRepository.findById(id)
				.orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Payment not found"));

		if (payment.getStatus() != PaymentStatus.PAID) {
			throw new ResponseStatusException(HttpStatus.CONFLICT, "This payment has already been refunded");
		}
		if (request.amount().compareTo(payment.getAmount()) > 0) {
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Refund amount can't exceed the payment amount");
		}

		payment.setStatus(request.amount().compareTo(payment.getAmount()) == 0 ? PaymentStatus.REFUNDED : PaymentStatus.PARTIALLY_REFUNDED);
		payment.setRefundAmount(request.amount());
		payment.setRefundReason(request.reason());
		payment.setRefundedAt(Instant.now());
		return PaymentResponse.from(paymentRepository.save(payment));
	}
}
