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
		BigDecimal fromPrice,
		// Null (not 0) averageRating means "no reviews yet" - the mobile app shouldn't render a
		// star rating for a provider that hasn't been reviewed.
		Double averageRating,
		long reviewCount,
		// Geocoded from the provider's city at profile-creation time (best-effort - null if
		// geocoding failed or the provider never set a city). Powers the discovery map's pins.
		Double latitude,
		Double longitude,
		// A provider "is" its owning user - the profile photo shown on a provider's public
		// listing is that person's own account photo, not a separate business-logo concept.
		String photoDataUri,
		String coverPhotoDataUri) {

	public static ProviderSummaryResponse from(ProviderProfile profile, BigDecimal fromPrice, Double averageRating, long reviewCount) {
		return new ProviderSummaryResponse(
				profile.getId(),
				profile.getBusinessName(),
				profile.getCity(),
				profile.isVerified(),
				profile.getYearsExperience(),
				fromPrice,
				averageRating,
				reviewCount,
				profile.getLatitude(),
				profile.getLongitude(),
				profile.getUser().getPhotoDataUri(),
				profile.getUser().getCoverPhotoDataUri());
	}
}
