package com.quickfixhub.backend.provider.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotEmpty;

import java.util.List;

public record UpdateAvailabilityRequest(
		@Min(0) @Max(500) Integer serviceRadiusKm,
		@NotEmpty @Valid List<AvailabilityDayRequest> days) {
}
