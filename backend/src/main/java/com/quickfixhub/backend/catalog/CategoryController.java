package com.quickfixhub.backend.catalog;

import com.quickfixhub.backend.catalog.dto.ServiceCategoryResponse;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/categories")
public class CategoryController {

	private final ServiceCategoryRepository categoryRepository;

	public CategoryController(ServiceCategoryRepository categoryRepository) {
		this.categoryRepository = categoryRepository;
	}

	@GetMapping
	public List<ServiceCategoryResponse> listCategories() {
		return categoryRepository.findAllByOrderByNameAsc().stream()
				.map(ServiceCategoryResponse::from)
				.toList();
	}
}
