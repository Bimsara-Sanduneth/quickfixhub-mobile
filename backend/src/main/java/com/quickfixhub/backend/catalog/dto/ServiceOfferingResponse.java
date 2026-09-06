package com.quickfixhub.backend.catalog.dto;

import com.quickfixhub.backend.catalog.ServiceOffering;

import java.util.UUID;

public record ServiceOfferingResponse(
		UUID id,
		UUID categoryId,
		String categoryName,
		String name,
		String slug,
		String description) {

	public static ServiceOfferingResponse from(ServiceOffering service) {
		return new ServiceOfferingResponse(
				service.getId(),
				service.getCategory().getId(),
				service.getCategory().getName(),
				service.getName(),
				service.getSlug(),
				service.getDescription());
	}
}
