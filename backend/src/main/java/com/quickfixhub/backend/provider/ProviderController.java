package com.quickfixhub.backend.provider;

import com.quickfixhub.backend.provider.dto.ProviderDetailResponse;
import com.quickfixhub.backend.provider.dto.ProviderServiceResponse;
import com.quickfixhub.backend.provider.dto.ProviderSummaryResponse;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

import static com.quickfixhub.backend.provider.ProviderProfileSpecifications.businessNameContains;
import static com.quickfixhub.backend.provider.ProviderProfileSpecifications.cityContains;
import static com.quickfixhub.backend.provider.ProviderProfileSpecifications.offersCategory;
import static com.quickfixhub.backend.provider.ProviderProfileSpecifications.offersService;
import static com.quickfixhub.backend.provider.ProviderProfileSpecifications.verifiedOnly;

@RestController
@RequestMapping("/providers")
public class ProviderController {

	private final ProviderProfileRepository providerProfileRepository;
	private final ProviderServiceRepository providerServiceRepository;

	public ProviderController(ProviderProfileRepository providerProfileRepository,
			ProviderServiceRepository providerServiceRepository) {
		this.providerProfileRepository = providerProfileRepository;
		this.providerServiceRepository = providerServiceRepository;
	}

	@GetMapping
	public Page<ProviderSummaryResponse> searchProviders(
			@RequestParam(required = false) UUID categoryId,
			@RequestParam(required = false) UUID serviceId,
			@RequestParam(required = false) String q,
			@RequestParam(required = false) String city,
			@RequestParam(required = false) Boolean verified,
			@PageableDefault(size = 20, sort = "businessName") Pageable pageable) {
		Specification<ProviderProfile> spec = Specification
				.where(offersCategory(categoryId))
				.and(offersService(serviceId))
				.and(businessNameContains(q))
				.and(cityContains(city))
				.and(verifiedOnly(verified));
		Page<ProviderProfile> page = providerProfileRepository.findAll(spec, pageable);

		var providerIds = page.getContent().stream().map(ProviderProfile::getId).toList();
		Map<UUID, BigDecimal> fromPrices = providerServiceRepository.findMinPricesByProviderProfileIds(providerIds).stream()
				.collect(Collectors.toMap(
						ProviderServiceRepository.ProviderMinPrice::getProviderId,
						ProviderServiceRepository.ProviderMinPrice::getMinPrice));

		return page.map(profile -> ProviderSummaryResponse.from(profile, fromPrices.get(profile.getId())));
	}

	@GetMapping("/{id}")
	public ProviderDetailResponse getProvider(@PathVariable UUID id) {
		ProviderProfile profile = providerProfileRepository.findById(id)
				.orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Provider not found"));
		var services = providerServiceRepository.findByProviderProfileId(id).stream()
				.map(ProviderServiceResponse::from)
				.toList();
		return ProviderDetailResponse.from(profile, services);
	}
}
