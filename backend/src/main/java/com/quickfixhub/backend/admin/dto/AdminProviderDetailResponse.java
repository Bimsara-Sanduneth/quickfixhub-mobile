package com.quickfixhub.backend.admin.dto;

import com.quickfixhub.backend.provider.ProviderProfile;
import com.quickfixhub.backend.provider.VerificationStatus;
import com.quickfixhub.backend.provider.dto.ProviderDocumentResponse;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

public record AdminProviderDetailResponse(
		UUID id,
		String businessName,
		String ownerEmail,
		String bio,
		Integer yearsExperience,
		String city,
		VerificationStatus verificationStatus,
		String providerMessage,
		String internalNote,
		String photoDataUri,
		List<ProviderDocumentResponse> documents,
		Instant createdAt) {

	public static AdminProviderDetailResponse from(ProviderProfile profile, List<ProviderDocumentResponse> documents) {
		return new AdminProviderDetailResponse(
				profile.getId(),
				profile.getBusinessName(),
				profile.getUser().getEmail(),
				profile.getBio(),
				profile.getYearsExperience(),
				profile.getCity(),
				profile.getVerificationStatus(),
				profile.getProviderMessage(),
				profile.getInternalNote(),
				profile.getUser().getPhotoDataUri(),
				documents,
				profile.getCreatedAt());
	}
}
