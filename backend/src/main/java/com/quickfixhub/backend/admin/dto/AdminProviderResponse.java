package com.quickfixhub.backend.admin.dto;

import com.quickfixhub.backend.provider.ProviderProfile;

import java.time.Instant;
import java.util.UUID;

public record AdminProviderResponse(
		UUID id,
		String businessName,
		String ownerEmail,
		String bio,
		Integer yearsExperience,
		String city,
		Instant createdAt) {

	public static AdminProviderResponse from(ProviderProfile profile) {
		return new AdminProviderResponse(
				profile.getId(),
				profile.getBusinessName(),
				profile.getUser().getEmail(),
				profile.getBio(),
				profile.getYearsExperience(),
				profile.getCity(),
				profile.getCreatedAt());
	}
}
