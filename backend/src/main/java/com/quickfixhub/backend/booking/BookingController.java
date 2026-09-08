package com.quickfixhub.backend.booking;

import com.quickfixhub.backend.booking.dto.BookingResponse;
import com.quickfixhub.backend.booking.dto.CreateBookingRequest;
import com.quickfixhub.backend.profile.Address;
import com.quickfixhub.backend.profile.AddressRepository;
import com.quickfixhub.backend.provider.ProviderProfile;
import com.quickfixhub.backend.provider.ProviderProfileRepository;
import com.quickfixhub.backend.provider.ProviderService;
import com.quickfixhub.backend.provider.ProviderServiceRepository;
import com.quickfixhub.backend.review.ReviewRepository;
import com.quickfixhub.backend.user.UserRepository;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.UUID;

// Known gap, not silently worked around: lists/creates/cancels are CUSTOMER-side only (scoped to
// the caller's own customer_id, same IDOR-avoidance shape as AddressController). The one
// provider-side action here (complete) exists only because Reviews needs a COMPLETED booking to
// attach to - there's still no "provider views bookings made against their profile" listing or a
// confirm/decline transition; those belong to the provider-dashboard milestone.
@RestController
@RequestMapping("/bookings")
public class BookingController {

	private final BookingRepository bookingRepository;
	private final ProviderServiceRepository providerServiceRepository;
	private final ProviderProfileRepository providerProfileRepository;
	private final AddressRepository addressRepository;
	private final UserRepository userRepository;
	private final ReviewRepository reviewRepository;

	public BookingController(BookingRepository bookingRepository, ProviderServiceRepository providerServiceRepository,
			ProviderProfileRepository providerProfileRepository, AddressRepository addressRepository,
			UserRepository userRepository, ReviewRepository reviewRepository) {
		this.bookingRepository = bookingRepository;
		this.providerServiceRepository = providerServiceRepository;
		this.providerProfileRepository = providerProfileRepository;
		this.addressRepository = addressRepository;
		this.userRepository = userRepository;
		this.reviewRepository = reviewRepository;
	}

	@PostMapping
	@ResponseStatus(HttpStatus.CREATED)
	public BookingResponse createBooking(@AuthenticationPrincipal UUID userId, @Valid @RequestBody CreateBookingRequest request) {
		ProviderService providerService = providerServiceRepository.findById(request.providerServiceId())
				.orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Service not found"));

		// 404 rather than 403 on someone else's address - doesn't confirm to the caller that the
		// id belongs to another account at all, same reasoning as AddressController's /me scoping.
		Address address = addressRepository.findById(request.addressId())
				.filter(a -> a.getUser().getId().equals(userId))
				.orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Address not found"));

		Booking booking = new Booking(
				userRepository.getReferenceById(userId),
				providerService.getProviderProfile(),
				providerService,
				address,
				request.scheduledAt(),
				providerService.getPrice(),
				request.notes());

		return BookingResponse.from(bookingRepository.save(booking), false);
	}

	@GetMapping
	public List<BookingResponse> listMyBookings(@AuthenticationPrincipal UUID userId) {
		List<Booking> bookings = bookingRepository.findByCustomerIdOrderByScheduledAtDesc(userId);
		Set<UUID> reviewedIds = new HashSet<>(
				reviewRepository.findReviewedBookingIds(bookings.stream().map(Booking::getId).toList()));
		return bookings.stream()
				.map(b -> BookingResponse.from(b, reviewedIds.contains(b.getId())))
				.toList();
	}

	@PatchMapping("/{id}/cancel")
	public BookingResponse cancelBooking(@AuthenticationPrincipal UUID userId, @PathVariable UUID id) {
		Booking booking = bookingRepository.findById(id)
				.filter(b -> b.getCustomer().getId().equals(userId))
				.orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Booking not found"));

		if (booking.getStatus() != BookingStatus.PENDING && booking.getStatus() != BookingStatus.CONFIRMED) {
			throw new ResponseStatusException(HttpStatus.CONFLICT, "Only pending or confirmed bookings can be cancelled");
		}
		booking.setStatus(BookingStatus.CANCELLED);
		return BookingResponse.from(bookingRepository.save(booking), false);
	}

	// Provider-side counterpart to cancel - scoped to the provider profile that owns the booking,
	// same ownership-check shape as the customer-side actions above. See the class comment for why
	// this exists without a fuller provider-dashboard around it yet.
	@PatchMapping("/{id}/complete")
	public BookingResponse completeBooking(@AuthenticationPrincipal UUID userId, @PathVariable UUID id) {
		ProviderProfile providerProfile = providerProfileRepository.findByUserId(userId)
				.orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Booking not found"));

		Booking booking = bookingRepository.findById(id)
				.filter(b -> b.getProviderProfile().getId().equals(providerProfile.getId()))
				.orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Booking not found"));

		if (booking.getStatus() != BookingStatus.PENDING && booking.getStatus() != BookingStatus.CONFIRMED) {
			throw new ResponseStatusException(HttpStatus.CONFLICT, "Only pending or confirmed bookings can be completed");
		}
		booking.setStatus(BookingStatus.COMPLETED);
		return BookingResponse.from(bookingRepository.save(booking), false);
	}
}
