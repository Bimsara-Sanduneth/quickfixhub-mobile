package com.quickfixhub.backend.review.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.Size;

import java.util.List;

public record CreateReviewRequest(
		@Min(1) @Max(5) int rating,
		@Size(max = 1000) String comment,
		// Quick-select chips (2p), e.g. "ON_TIME", "TIDY_WORK" - the mobile client owns the fixed
		// vocabulary, this just bounds how many/how long so nothing absurd gets stored.
		@Size(max = 6) List<@Size(max = 40) String> tags) {
}
