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
		List<ProviderServiceResponse> services) {

	public static ProviderDetailResponse from(ProviderProfile profile, List<ProviderServiceResponse> services) {
		return new ProviderDetailResponse(
				profile.getId(),
				profile.getBusinessName(),
				profile.getBio(),
				profile.getYearsExperience(),
				profile.getCity(),
				profile.isVerified(),
				services);
	}
}
