package com.quickfixhub.backend.review.dto;

import com.quickfixhub.backend.review.Review;

import java.time.Instant;
import java.util.UUID;

public record ReviewResponse(
		UUID id,
		int rating,
		String comment,
		// First name only - a public review doesn't need to expose the reviewer's full identity.
		String reviewerFirstName,
		Instant createdAt) {

	public static ReviewResponse from(Review review) {
		return new ReviewResponse(
				review.getId(),
				review.getRating(),
				review.getComment(),
				review.getCustomer().getFullName().split(" ")[0],
				review.getCreatedAt());
	}
}
