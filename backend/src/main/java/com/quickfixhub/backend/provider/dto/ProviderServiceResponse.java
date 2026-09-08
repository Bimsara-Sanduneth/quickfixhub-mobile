package com.quickfixhub.backend.provider.dto;

import com.quickfixhub.backend.provider.ProviderService;

import java.math.BigDecimal;
import java.util.UUID;

public record ProviderServiceResponse(
		// The provider's own priced listing id - what a booking request must reference, since a
		// catalog serviceId alone doesn't say which provider's price/duration applies.
		UUID providerServiceId,
		UUID serviceId,
		String serviceName,
		BigDecimal price,
		Integer durationMinutes) {

	public static ProviderServiceResponse from(ProviderService providerService) {
		return new ProviderServiceResponse(
				providerService.getId(),
				providerService.getService().getId(),
				providerService.getService().getName(),
				providerService.getPrice(),
				providerService.getDurationMinutes());
	}
}
