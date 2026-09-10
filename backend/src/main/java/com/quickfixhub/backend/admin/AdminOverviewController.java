package com.quickfixhub.backend.admin;

import com.quickfixhub.backend.admin.dto.AdminOverviewResponse;
import com.quickfixhub.backend.booking.BookingRepository;
import com.quickfixhub.backend.booking.BookingStatus;
import com.quickfixhub.backend.payment.PaymentRepository;
import com.quickfixhub.backend.provider.ProviderProfileRepository;
import com.quickfixhub.backend.provider.VerificationStatus;
import com.quickfixhub.backend.user.Role;
import com.quickfixhub.backend.user.UserRepository;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

// 2u - admin overview. Every number here is a real aggregate query against real data (no fake
// stats), just none of it is exposed to a non-admin anywhere else.
@RestController
@RequestMapping("/admin/overview")
@PreAuthorize("hasRole('ADMIN')")
public class AdminOverviewController {

	private final UserRepository userRepository;
	private final ProviderProfileRepository providerProfileRepository;
	private final BookingRepository bookingRepository;
	private final PaymentRepository paymentRepository;

	public AdminOverviewController(UserRepository userRepository, ProviderProfileRepository providerProfileRepository,
			BookingRepository bookingRepository, PaymentRepository paymentRepository) {
		this.userRepository = userRepository;
		this.providerProfileRepository = providerProfileRepository;
		this.bookingRepository = bookingRepository;
		this.paymentRepository = paymentRepository;
	}

	@GetMapping
	public AdminOverviewResponse getOverview() {
		return new AdminOverviewResponse(
				userRepository.countByRole(Role.CUSTOMER),
				userRepository.countByRole(Role.PROVIDER),
				providerProfileRepository.countByVerified(true),
				// PENDING only, not "everything unverified" - a REJECTED provider isn't waiting on
				// anything, they've already been decided on and are free to resubmit.
				providerProfileRepository.countByVerificationStatus(VerificationStatus.PENDING),
				bookingRepository.count(),
				bookingRepository.countByStatus(BookingStatus.COMPLETED),
				paymentRepository.sumAmount(),
				paymentRepository.sumRefunded());
	}
}
