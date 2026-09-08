package com.quickfixhub.backend.provider.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.Pattern;

public record AvailabilityDayRequest(
		@Min(0) @Max(6) int dayOfWeek,
		boolean isOpen,
		@Pattern(regexp = "^([01]\\d|2[0-3]):[0-5]\\d$", message = "must be HH:mm") String startTime,
		@Pattern(regexp = "^([01]\\d|2[0-3]):[0-5]\\d$", message = "must be HH:mm") String endTime) {
}
