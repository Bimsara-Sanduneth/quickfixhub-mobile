package com.quickfixhub.backend.provider;

import com.quickfixhub.backend.booking.Booking;
import com.quickfixhub.backend.booking.BookingExpiryService;
import com.quickfixhub.backend.booking.BookingRepository;
import com.quickfixhub.backend.booking.dto.BookingResponse;
import com.quickfixhub.backend.catalog.ServiceOffering;
import com.quickfixhub.backend.catalog.ServiceOfferingRepository;
import com.quickfixhub.backend.geo.GeocodingService;
import com.quickfixhub.backend.provider.dto.AddProviderServiceRequest;
import com.quickfixhub.backend.provider.dto.CreateProviderProfileRequest;
import com.quickfixhub.backend.provider.dto.MyVerificationResponse;
import com.quickfixhub.backend.provider.dto.ProviderDetailResponse;
import com.quickfixhub.backend.provider.dto.ProviderDocumentResponse;
import com.quickfixhub.backend.provider.dto.ProviderServiceResponse;
import com.quickfixhub.backend.provider.dto.UploadDocumentRequest;
import com.quickfixhub.backend.review.ReviewRepository;
import com.quickfixhub.backend.user.User;
import com.quickfixhub.backend.user.UserRepository;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.UUID;

// The "provider onboarding" gap: registering with role=PROVIDER only ever set that flag on the
// user row - nothing created the provider_profiles row the public /providers listing actually
// reads from, so a self-registered provider was permanently invisible to customers even though
// their account looked fine. These are the endpoints that were missing.
@RestController
@RequestMapping("/me/provider-profile")
public class MyProviderProfileController {

	private final ProviderProfileRepository providerProfileRepository;
	private final ProviderServiceRepository providerServiceRepository;
	private final ServiceOfferingRepository serviceOfferingRepository;
	private final ProviderDocumentRepository providerDocumentRepository;
	private final ReviewRepository reviewRepository;
	private final UserRepository userRepository;
	private final BookingRepository bookingRepository;
	private final BookingExpiryService bookingExpiryService;
	private final GeocodingService geocodingService;

	public MyProviderProfileController(ProviderProfileRepository providerProfileRepository,
			ProviderServiceRepository providerServiceRepository, ServiceOfferingRepository serviceOfferingRepository,
			ProviderDocumentRepository providerDocumentRepository, ReviewRepository reviewRepository,
			UserRepository userRepository, BookingRepository bookingRepository,
			BookingExpiryService bookingExpiryService, GeocodingService geocodingService) {
		this.providerProfileRepository = providerProfileRepository;
		this.providerServiceRepository = providerServiceRepository;
		this.serviceOfferingRepository = serviceOfferingRepository;
		this.providerDocumentRepository = providerDocumentRepository;
		this.reviewRepository = reviewRepository;
		this.userRepository = userRepository;
		this.bookingRepository = bookingRepository;
		this.bookingExpiryService = bookingExpiryService;
		this.geocodingService = geocodingService;
	}

	@GetMapping
	public ProviderDetailResponse getMyProfile(@AuthenticationPrincipal UUID userId) {
		ProviderProfile profile = providerProfileRepository.findByUserId(userId)
				.orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "No provider profile yet"));
		return toDetailResponse(profile);
	}

	@PostMapping
	@ResponseStatus(HttpStatus.CREATED)
	@PreAuthorize("hasRole('PROVIDER')")
	public ProviderDetailResponse createMyProfile(@AuthenticationPrincipal UUID userId,
			@Valid @RequestBody CreateProviderProfileRequest request) {
		if (providerProfileRepository.findByUserId(userId).isPresent()) {
			throw new ResponseStatusException(HttpStatus.CONFLICT, "Provider profile already exists");
		}
		// A real (not getReferenceById-proxy) User - toDetailResponse() now needs
		// user.getPhotoDataUri()/getCoverPhotoDataUri() (added alongside the profile-photo
		// feature), and a lazy proxy can't satisfy that outside a session (open-in-view is
		// disabled). Same LazyInitializationException shape already hit and fixed in
		// BookingController.createBooking and MessageController.sendMessage.
		User user = userRepository.findById(userId)
				.orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));
		ProviderProfile profile = new ProviderProfile(user, request.businessName(),
				request.bio(), request.yearsExperience(), request.city());
		// Best-effort - a geocoding failure (network, no match) never blocks profile creation,
		// it just leaves the provider off the discovery map (2g) until fixed some other way.
		geocodingService.geocode(request.city()).ifPresent(latLng -> {
			profile.setLatitude(latLng[0]);
			profile.setLongitude(latLng[1]);
		});
		return toDetailResponse(providerProfileRepository.save(profile));
	}

	@PostMapping("/services")
	@ResponseStatus(HttpStatus.CREATED)
	@PreAuthorize("hasRole('PROVIDER')")
	public ProviderServiceResponse addMyService(@AuthenticationPrincipal UUID userId,
			@Valid @RequestBody AddProviderServiceRequest request) {
		ProviderProfile profile = providerProfileRepository.findByUserId(userId)
				.orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Create a provider profile first"));
		ServiceOffering service = serviceOfferingRepository.findById(request.serviceId())
				.orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Service not found"));
		if (providerServiceRepository.existsByProviderProfileIdAndServiceId(profile.getId(), service.getId())) {
			throw new ResponseStatusException(HttpStatus.CONFLICT, "You've already listed this service");
		}

		ProviderService providerService = new ProviderService(profile, service, request.price(), request.durationMinutes());
		return ProviderServiceResponse.from(providerServiceRepository.save(providerService));
	}

	@GetMapping("/verification")
	@PreAuthorize("hasRole('PROVIDER')")
	public MyVerificationResponse getMyVerification(@AuthenticationPrincipal UUID userId) {
		ProviderProfile profile = providerProfileRepository.findByUserId(userId)
				.orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "No provider profile yet"));
		List<ProviderDocumentResponse> documents = providerDocumentRepository
				.findByProviderProfileIdOrderByDocumentType(profile.getId()).stream()
				.map(ProviderDocumentResponse::from)
				.toList();
		return new MyVerificationResponse(profile.getVerificationStatus(), profile.getProviderMessage(), documents);
	}

	// Upsert by document type - a re-upload (e.g. after a rejection) replaces the existing row and
	// resets it to PENDING rather than accumulating old submissions.
	@PutMapping("/documents")
	@PreAuthorize("hasRole('PROVIDER')")
	public ProviderDocumentResponse uploadDocument(@AuthenticationPrincipal UUID userId,
			@Valid @RequestBody UploadDocumentRequest request) {
		ProviderProfile profile = providerProfileRepository.findByUserId(userId)
				.orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "No provider profile yet"));
		ProviderDocument document = providerDocumentRepository
				.findByProviderProfileIdAndDocumentType(profile.getId(), request.documentType())
				.orElseGet(() -> new ProviderDocument(profile, request.documentType(), request.fileDataUri()));
		document.setFileDataUri(request.fileDataUri());
		document.setStatus(DocumentStatus.PENDING);
		document.setReviewNote(null);
		return ProviderDocumentResponse.from(providerDocumentRepository.save(document));
	}

	@GetMapping("/bookings")
	public List<BookingResponse> listMyBookings(@AuthenticationPrincipal UUID userId) {
		ProviderProfile profile = providerProfileRepository.findByUserId(userId)
				.orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "No provider profile yet"));
		List<Booking> bookings = bookingExpiryService.expireIfNeeded(
				bookingRepository.findByProviderProfileIdOrderByScheduledAtDesc(profile.getId()));
		// "reviewed" isn't a concept the provider side acts on (only the customer who received the
		// service can leave one), but it's part of the shared BookingResponse shape, so compute it
		// properly rather than hardcoding it - same batched lookup BookingController's own
		// listMyBookings uses.
		Set<UUID> reviewedIds = new HashSet<>(
				reviewRepository.findReviewedBookingIds(bookings.stream().map(Booking::getId).toList()));
		return bookings.stream()
				.map(b -> BookingResponse.from(b, reviewedIds.contains(b.getId())))
				.toList();
	}

	private ProviderDetailResponse toDetailResponse(ProviderProfile profile) {
		List<ProviderServiceResponse> services = providerServiceRepository.findByProviderProfileId(profile.getId()).stream()
				.map(ProviderServiceResponse::from)
				.toList();
		// Reuses the same batched-rating-summary query ProviderController uses for the public
		// endpoints, just with a single-element id list.
		var ratings = reviewRepository.findRatingSummariesByProviderProfileIds(List.of(profile.getId()));
		Double averageRating = ratings.isEmpty() ? null : ratings.get(0).getAverageRating();
		long reviewCount = ratings.isEmpty() ? 0 : ratings.get(0).getReviewCount();
		return ProviderDetailResponse.from(profile, services, averageRating, reviewCount);
	}
}
