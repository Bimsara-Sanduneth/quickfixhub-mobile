package com.quickfixhub.backend.catalog;

import com.quickfixhub.backend.catalog.dto.ServiceOfferingResponse;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.data.web.PageableDefault;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.UUID;

import static com.quickfixhub.backend.catalog.ServiceOfferingSpecifications.categoryIdEquals;
import static com.quickfixhub.backend.catalog.ServiceOfferingSpecifications.nameContains;

@RestController
@RequestMapping("/services")
public class ServiceController {

	private final ServiceOfferingRepository serviceOfferingRepository;

	public ServiceController(ServiceOfferingRepository serviceOfferingRepository) {
		this.serviceOfferingRepository = serviceOfferingRepository;
	}

	@GetMapping
	public Page<ServiceOfferingResponse> searchServices(
			@RequestParam(required = false) UUID categoryId,
			@RequestParam(required = false) String q,
			@PageableDefault(size = 20, sort = "name") Pageable pageable) {
		Specification<ServiceOffering> spec = Specification.where(categoryIdEquals(categoryId)).and(nameContains(q));
		return serviceOfferingRepository.findAll(spec, pageable)
				.map(ServiceOfferingResponse::from);
	}
}
