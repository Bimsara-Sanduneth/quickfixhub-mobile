package com.quickfixhub.backend.provider.dto;

import com.quickfixhub.backend.provider.ProviderService;

import java.math.BigDecimal;
import java.util.UUID;

public record ProviderServiceResponse(
		UUID serviceId,
		String serviceName,
		BigDecimal price,
		Integer durationMinutes) {

	public static ProviderServiceResponse from(ProviderService providerService) {
		return new ProviderServiceResponse(
				providerService.getService().getId(),
				providerService.getService().getName(),
				providerService.getPrice(),
				providerService.getDurationMinutes());
	}
}
