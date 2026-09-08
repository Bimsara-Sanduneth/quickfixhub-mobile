package com.quickfixhub.backend.booking.dto;

import jakarta.validation.constraints.Future;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.time.Instant;
import java.util.UUID;

public record CreateBookingRequest(
		@NotNull UUID providerServiceId,
		@NotNull UUID addressId,
		@NotNull @Future Instant scheduledAt,
		@Size(max = 1000) String notes) {
}
