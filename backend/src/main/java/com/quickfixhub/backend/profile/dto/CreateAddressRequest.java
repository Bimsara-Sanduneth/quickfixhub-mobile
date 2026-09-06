package com.quickfixhub.backend.profile.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record CreateAddressRequest(
		@NotBlank @Size(max = 100) String label,
		@NotBlank @Size(max = 500) String addressText) {
}
