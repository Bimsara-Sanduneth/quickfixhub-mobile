package com.quickfixhub.backend.review;

import com.quickfixhub.backend.booking.Booking;
import com.quickfixhub.backend.booking.BookingRepository;
import com.quickfixhub.backend.booking.BookingStatus;
import com.quickfixhub.backend.review.dto.CreateReviewRequest;
import com.quickfixhub.backend.review.dto.ReviewResponse;
import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import java.util.UUID;

// Nested under both /bookings and /providers rather than owning a top-level /reviews path,
// matching how a review is only ever reached through one of its two parents - same shape as
// AddressController living under /me rather than its own resource root.
@RestController
public class ReviewController {

	private final ReviewRepository reviewRepository;
	private final BookingRepository bookingRepository;

	public ReviewController(ReviewRepository reviewRepository, BookingRepository bookingRepository) {
		this.reviewRepository = reviewRepository;
		this.bookingRepository = bookingRepository;
	}

	@PostMapping("/bookings/{bookingId}/reviews")
	@ResponseStatus(HttpStatus.CREATED)
	public ReviewResponse createReview(@AuthenticationPrincipal UUID userId, @PathVariable UUID bookingId,
			@Valid @RequestBody CreateReviewRequest request) {
		Booking booking = bookingRepository.findById(bookingId)
				.filter(b -> b.getCustomer().getId().equals(userId))
				.orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Booking not found"));

		if (booking.getStatus() != BookingStatus.COMPLETED) {
			throw new ResponseStatusException(HttpStatus.CONFLICT, "Only completed bookings can be reviewed");
		}
		if (reviewRepository.existsByBookingId(bookingId)) {
			throw new ResponseStatusException(HttpStatus.CONFLICT, "This booking has already been reviewed");
		}

		Review review = new Review(booking, booking.getCustomer(), booking.getProviderProfile(), request.rating(), request.comment(),
				request.tags());
		return ReviewResponse.from(reviewRepository.save(review));
	}

	@GetMapping("/providers/{providerId}/reviews")
	public Page<ReviewResponse> listProviderReviews(@PathVariable UUID providerId,
			@PageableDefault(size = 20, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {
		return reviewRepository.findByProviderProfileId(providerId, pageable).map(ReviewResponse::from);
	}
}
