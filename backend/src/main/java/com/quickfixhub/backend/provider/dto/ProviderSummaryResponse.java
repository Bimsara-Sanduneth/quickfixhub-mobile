package com.quickfixhub.backend.provider.dto;

import com.quickfixhub.backend.provider.ProviderProfile;

import java.math.BigDecimal;
import java.util.UUID;

public record ProviderSummaryResponse(
		UUID id,
		String businessName,
		String city,
		boolean verified,
		Integer yearsExperience,
		// The lowest price among the provider's listed services; null if they haven't listed any.
		// No rating/review count here - there's no reviews system yet, and this endpoint won't
		// fabricate one.
		BigDecimal fromPrice) {

	public static ProviderSummaryResponse from(ProviderProfile profile, BigDecimal fromPrice) {
		return new ProviderSummaryResponse(
				profile.getId(),
				profile.getBusinessName(),
				profile.getCity(),
				profile.isVerified(),
				profile.getYearsExperience(),
				fromPrice);
	}
}
