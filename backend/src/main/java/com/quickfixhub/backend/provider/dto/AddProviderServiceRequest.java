package com.quickfixhub.backend.provider.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Digits;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;
import java.util.UUID;

public record AddProviderServiceRequest(
		@NotNull UUID serviceId,
		@NotNull @DecimalMin(value = "2000.0", message = "Price must be at least Rs. 2,000") @Digits(integer = 8, fraction = 2) BigDecimal price,
		@Min(1) Integer durationMinutes) {
}
