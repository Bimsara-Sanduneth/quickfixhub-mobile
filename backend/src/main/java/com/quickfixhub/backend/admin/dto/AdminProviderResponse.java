package com.quickfixhub.backend.admin.dto;

import com.quickfixhub.backend.provider.ProviderProfile;
import com.quickfixhub.backend.provider.VerificationStatus;

import java.time.Instant;
import java.util.UUID;

// Row shape for the verification queue list (GET /admin/providers). documentCount/checkedCount
// let the list show "3 documents, 1 checked" without the mobile client fetching each provider's
// full detail just to render a row.
public record AdminProviderResponse(
		UUID id,
		String businessName,
		String ownerEmail,
		String bio,
		Integer yearsExperience,
		String city,
		VerificationStatus verificationStatus,
		long documentCount,
		long checkedDocumentCount,
		Instant createdAt) {

	public static AdminProviderResponse from(ProviderProfile profile, long documentCount, long checkedDocumentCount) {
		return new AdminProviderResponse(
				profile.getId(),
				profile.getBusinessName(),
				profile.getUser().getEmail(),
				profile.getBio(),
				profile.getYearsExperience(),
				profile.getCity(),
				profile.getVerificationStatus(),
				documentCount,
				checkedDocumentCount,
				profile.getCreatedAt());
	}
}
