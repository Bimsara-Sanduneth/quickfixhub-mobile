package com.quickfixhub.backend.booking;

import com.quickfixhub.backend.booking.dto.BookingResponse;
import com.quickfixhub.backend.booking.dto.CreateBookingRequest;
import com.quickfixhub.backend.notification.NotificationService;
import com.quickfixhub.backend.notification.NotificationType;
import com.quickfixhub.backend.payment.PaymentService;
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

import java.time.Instant;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.UUID;

// Customer-side actions (create/list/cancel) are scoped to the caller's own customer_id, same
// IDOR-avoidance shape as AddressController. Provider-side actions (accept/decline/start-travel/
// start-job/complete) are scoped to the caller's own provider profile the same way - see
// resolveOwnedByProvider. The provider's own booking *listing* lives on
// MyProviderProfileController instead of here, since it's naturally "things scoped to my provider
// profile" rather than a booking-lifecycle action.
//
// Lifecycle: REQUESTED -[accept]-> ACCEPTED -[start-travel]-> EN_ROUTE -[start-job]-> IN_PROGRESS
// -[complete]-> COMPLETED. REQUESTED can also go to DECLINED (explicitly, or auto-expired - see
// BookingExpiryService). REQUESTED/ACCEPTED/EN_ROUTE can be CANCELLED by the customer; once
// IN_PROGRESS the job can no longer be cancelled, only completed.
@RestController
@RequestMapping("/bookings")
public class BookingController {

	private final BookingRepository bookingRepository;
	private final ProviderServiceRepository providerServiceRepository;
	private final ProviderProfileRepository providerProfileRepository;
	private final AddressRepository addressRepository;
	private final UserRepository userRepository;
	private final ReviewRepository reviewRepository;
	private final BookingExpiryService bookingExpiryService;
	private final PaymentService paymentService;
	private final NotificationService notificationService;

	public BookingController(BookingRepository bookingRepository, ProviderServiceRepository providerServiceRepository,
			ProviderProfileRepository providerProfileRepository, AddressRepository addressRepository,
			UserRepository userRepository, ReviewRepository reviewRepository, BookingExpiryService bookingExpiryService,
			PaymentService paymentService, NotificationService notificationService) {
		this.bookingRepository = bookingRepository;
		this.providerServiceRepository = providerServiceRepository;
		this.providerProfileRepository = providerProfileRepository;
		this.addressRepository = addressRepository;
		this.userRepository = userRepository;
		this.reviewRepository = reviewRepository;
		this.bookingExpiryService = bookingExpiryService;
		this.paymentService = paymentService;
		this.notificationService = notificationService;
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

		// A real (not getReferenceById-proxy) User, since BookingResponse.from() needs
		// customer.getFullName() right after save() - a lazy proxy can't satisfy that outside a
		// session/transaction, and there isn't one open here (open-in-view is disabled).
		var customer = userRepository.findById(userId)
				.orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));

		Booking booking = new Booking(
				customer,
				providerService.getProviderProfile(),
				providerService,
				address,
				request.scheduledAt(),
				providerService.getPrice(),
				request.notes());
		booking = bookingRepository.save(booking);

		notificationService.notify(providerService.getProviderProfile().getUser(), NotificationType.BOOKING_REQUESTED,
				"New booking request",
				customer.getFullName() + " wants " + providerService.getService().getName(), booking.getId());

		return BookingResponse.from(booking, false);
	}

	@GetMapping
	public List<BookingResponse> listMyBookings(@AuthenticationPrincipal UUID userId) {
		List<Booking> bookings = bookingExpiryService.expireIfNeeded(bookingRepository.findByCustomerIdOrderByScheduledAtDesc(userId));
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
		booking = bookingExpiryService.expireIfNeeded(booking);

		if (booking.getStatus() != BookingStatus.REQUESTED && booking.getStatus() != BookingStatus.ACCEPTED
				&& booking.getStatus() != BookingStatus.EN_ROUTE) {
			throw new ResponseStatusException(HttpStatus.CONFLICT,
					"Only a requested, accepted or en-route booking can be cancelled");
		}
		booking.setStatus(BookingStatus.CANCELLED);
		booking.setCancelledAt(Instant.now());
		booking = bookingRepository.save(booking);

		notificationService.notify(booking.getProviderProfile().getUser(), NotificationType.BOOKING_CANCELLED,
				"Booking cancelled",
				booking.getCustomer().getFullName() + " cancelled their " + booking.getProviderService().getService().getName() + " booking",
				booking.getId());

		return BookingResponse.from(booking, false);
	}

	@PatchMapping("/{id}/accept")
	public BookingResponse acceptBooking(@AuthenticationPrincipal UUID userId, @PathVariable UUID id) {
		Booking booking = bookingExpiryService.expireIfNeeded(resolveOwnedByProvider(userId, id));
		if (booking.getStatus() != BookingStatus.REQUESTED) {
			throw new ResponseStatusException(HttpStatus.CONFLICT, "Only a requested booking can be accepted");
		}
		booking.setStatus(BookingStatus.ACCEPTED);
		booking.setAcceptedAt(Instant.now());
		booking = bookingRepository.save(booking);

		notificationService.notify(booking.getCustomer(), NotificationType.BOOKING_ACCEPTED,
				"Booking accepted",
				booking.getProviderProfile().getBusinessName() + " accepted your " + booking.getProviderService().getService().getName() + " request",
				booking.getId());

		return BookingResponse.from(booking, false);
	}

	@PatchMapping("/{id}/decline")
	public BookingResponse declineBooking(@AuthenticationPrincipal UUID userId, @PathVariable UUID id) {
		Booking booking = bookingExpiryService.expireIfNeeded(resolveOwnedByProvider(userId, id));
		if (booking.getStatus() != BookingStatus.REQUESTED) {
			throw new ResponseStatusException(HttpStatus.CONFLICT, "Only a requested booking can be declined");
		}
		booking.setStatus(BookingStatus.DECLINED);
		booking.setDeclinedAt(Instant.now());
		booking = bookingRepository.save(booking);

		notificationService.notify(booking.getCustomer(), NotificationType.BOOKING_DECLINED,
				"Booking declined",
				booking.getProviderProfile().getBusinessName() + " can't take your " + booking.getProviderService().getService().getName() + " request",
				booking.getId());

		return BookingResponse.from(booking, false);
	}

	@PatchMapping("/{id}/start-travel")
	public BookingResponse startTravel(@AuthenticationPrincipal UUID userId, @PathVariable UUID id) {
		Booking booking = resolveOwnedByProvider(userId, id);
		if (booking.getStatus() != BookingStatus.ACCEPTED) {
			throw new ResponseStatusException(HttpStatus.CONFLICT, "Only an accepted booking can start travel");
		}
		booking.setStatus(BookingStatus.EN_ROUTE);
		booking.setEnRouteAt(Instant.now());
		booking = bookingRepository.save(booking);

		notificationService.notify(booking.getCustomer(), NotificationType.BOOKING_EN_ROUTE,
				"Provider on the way",
				booking.getProviderProfile().getBusinessName() + " is on the way", booking.getId());

		return BookingResponse.from(booking, false);
	}

	@PatchMapping("/{id}/start-job")
	public BookingResponse startJob(@AuthenticationPrincipal UUID userId, @PathVariable UUID id) {
		Booking booking = resolveOwnedByProvider(userId, id);
		if (booking.getStatus() != BookingStatus.EN_ROUTE) {
			throw new ResponseStatusException(HttpStatus.CONFLICT, "Only an en-route booking can be started");
		}
		booking.setStatus(BookingStatus.IN_PROGRESS);
		booking.setInProgressAt(Instant.now());
		booking = bookingRepository.save(booking);

		notificationService.notify(booking.getCustomer(), NotificationType.BOOKING_IN_PROGRESS,
				"Job started",
				booking.getProviderProfile().getBusinessName() + " started your " + booking.getProviderService().getService().getName() + " job",
				booking.getId());

		return BookingResponse.from(booking, false);
	}

	@PatchMapping("/{id}/complete")
	public BookingResponse completeBooking(@AuthenticationPrincipal UUID userId, @PathVariable UUID id) {
		Booking booking = resolveOwnedByProvider(userId, id);
		if (booking.getStatus() != BookingStatus.IN_PROGRESS) {
			throw new ResponseStatusException(HttpStatus.CONFLICT, "Only an in-progress booking can be completed");
		}
		booking.setStatus(BookingStatus.COMPLETED);
		booking.setCompletedAt(Instant.now());
		booking = bookingRepository.save(booking);
		// Mocked "charge" - see PaymentService. The booking's own IN_PROGRESS guard above already
		// ensures this fires at most once per booking.
		paymentService.recordPayment(booking);

		notificationService.notify(booking.getCustomer(), NotificationType.BOOKING_COMPLETED,
				"Job completed",
				booking.getProviderProfile().getBusinessName() + " marked your " + booking.getProviderService().getService().getName() + " job complete - leave a review",
				booking.getId());

		return BookingResponse.from(booking, false);
	}

	// Shared by accept/decline/start-travel/start-job/complete: 404 (not 403) on a booking that
	// exists but isn't against the caller's own provider profile, same "don't confirm the id
	// belongs to someone else" reasoning as the customer-side address/booking lookups above.
	private Booking resolveOwnedByProvider(UUID userId, UUID bookingId) {
		ProviderProfile providerProfile = providerProfileRepository.findByUserId(userId)
				.orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Booking not found"));
		return bookingRepository.findById(bookingId)
				.filter(b -> b.getProviderProfile().getId().equals(providerProfile.getId()))
				.orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Booking not found"));
	}
}
