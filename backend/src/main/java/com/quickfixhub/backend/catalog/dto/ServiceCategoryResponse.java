package com.quickfixhub.backend.catalog.dto;

import com.quickfixhub.backend.catalog.ServiceCategory;

import java.util.UUID;

public record ServiceCategoryResponse(UUID id, String name, String slug, String description) {

	public static ServiceCategoryResponse from(ServiceCategory category) {
		return new ServiceCategoryResponse(category.getId(), category.getName(), category.getSlug(),
				category.getDescription());
	}
}
