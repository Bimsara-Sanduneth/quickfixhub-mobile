package com.quickfixhub.backend.provider.dto;

import com.quickfixhub.backend.provider.ProviderProfile;

import java.util.List;
import java.util.UUID;

public record ProviderDetailResponse(
		UUID id,
		String businessName,
		String bio,
		Integer yearsExperience,
		String city,
		boolean verified,
		List<ProviderServiceResponse> services,
		// Null (not 0) averageRating means "no reviews yet".
		Double averageRating,
		long reviewCount,
		// Geocoded from the provider's city at profile-creation time (best-effort - null if
		// geocoding failed or the provider never set a city).
		Double latitude,
		Double longitude) {

	public static ProviderDetailResponse from(ProviderProfile profile, List<ProviderServiceResponse> services,
			Double averageRating, long reviewCount) {
		return new ProviderDetailResponse(
				profile.getId(),
				profile.getBusinessName(),
				profile.getBio(),
				profile.getYearsExperience(),
				profile.getCity(),
				profile.isVerified(),
				services,
				averageRating,
				reviewCount,
				profile.getLatitude(),
				profile.getLongitude());
	}
}
