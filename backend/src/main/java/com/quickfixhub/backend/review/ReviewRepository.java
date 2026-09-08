package com.quickfixhub.backend.review;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.UUID;

public interface ReviewRepository extends JpaRepository<Review, UUID> {

	boolean existsByBookingId(UUID bookingId);

	// Sort order comes from the controller's @PageableDefault rather than an "OrderBy" clause here,
	// so there's one place (not two) declaring the default sort.
	Page<Review> findByProviderProfileId(UUID providerProfileId, Pageable pageable);

	// Which of these booking ids already have a review - batched the same way as
	// ProviderServiceRepository's min-price lookup, so listing a customer's bookings doesn't run
	// one exists-query per row.
	@Query("SELECT r.booking.id FROM Review r WHERE r.booking.id IN :bookingIds")
	List<UUID> findReviewedBookingIds(@Param("bookingIds") List<UUID> bookingIds);

	// One batched query for a whole page of providers' rating aggregate, and reused as a
	// single-element-list call for the single-provider detail endpoint too, rather than
	// duplicating a near-identical query for each shape.
	@Query("""
			SELECT r.providerProfile.id AS providerId, AVG(r.rating) AS averageRating, COUNT(r) AS reviewCount
			FROM Review r
			WHERE r.providerProfile.id IN :providerProfileIds
			GROUP BY r.providerProfile.id
			""")
	List<ProviderRatingSummary> findRatingSummariesByProviderProfileIds(@Param("providerProfileIds") List<UUID> providerProfileIds);

	interface ProviderRatingSummary {
		UUID getProviderId();

		Double getAverageRating();

		Long getReviewCount();
	}
}
