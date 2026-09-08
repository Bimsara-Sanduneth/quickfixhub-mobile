package com.quickfixhub.backend.provider.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record CreateProviderProfileRequest(
		@NotBlank @Size(max = 255) String businessName,
		@Size(max = 2000) String bio,
		@Min(0) @Max(80) Integer yearsExperience,
		@Size(max = 255) String city) {
}
