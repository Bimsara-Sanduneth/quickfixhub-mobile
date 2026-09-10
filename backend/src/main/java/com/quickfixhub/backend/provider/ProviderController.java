package com.quickfixhub.backend.provider;

import com.quickfixhub.backend.geo.GeoUtils;
import com.quickfixhub.backend.provider.dto.ProviderDetailResponse;
import com.quickfixhub.backend.provider.dto.ProviderServiceResponse;
import com.quickfixhub.backend.provider.dto.ProviderSummaryResponse;
import com.quickfixhub.backend.review.ReviewRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

import static com.quickfixhub.backend.provider.ProviderProfileSpecifications.businessNameContains;
import static com.quickfixhub.backend.provider.ProviderProfileSpecifications.cityContains;
import static com.quickfixhub.backend.provider.ProviderProfileSpecifications.excludeUser;
import static com.quickfixhub.backend.provider.ProviderProfileSpecifications.offersCategory;
import static com.quickfixhub.backend.provider.ProviderProfileSpecifications.offersService;
import static com.quickfixhub.backend.provider.ProviderProfileSpecifications.verifiedOnly;

@RestController
@RequestMapping("/providers")
public class ProviderController {

	private final ProviderProfileRepository providerProfileRepository;
	private final ProviderServiceRepository providerServiceRepository;
	private final ReviewRepository reviewRepository;

	public ProviderController(ProviderProfileRepository providerProfileRepository,
			ProviderServiceRepository providerServiceRepository, ReviewRepository reviewRepository) {
		this.providerProfileRepository = providerProfileRepository;
		this.providerServiceRepository = providerServiceRepository;
		this.reviewRepository = reviewRepository;
	}

	@GetMapping
	public Page<ProviderSummaryResponse> searchProviders(
			// Public endpoint, but the JWT filter still authenticates a request that carries a
			// valid token regardless of path - so this is non-null exactly when the caller is
			// logged in, letting a provider's own listing be excluded from their own results
			// below, and null for a genuinely anonymous request.
			@AuthenticationPrincipal UUID callerId,
			@RequestParam(required = false) UUID categoryId,
			@RequestParam(required = false) UUID serviceId,
			@RequestParam(required = false) String q,
			@RequestParam(required = false) String city,
			@RequestParam(required = false) Boolean verified,
			// Radius discovery (2g) - when all three are given, results are filtered to
			// providers within radiusKm of (lat, lng) and sorted nearest-first instead of the
			// default businessName ordering. A provider with no geocoded location is excluded
			// (there's nothing to measure a distance from).
			@RequestParam(required = false) Double lat,
			@RequestParam(required = false) Double lng,
			@RequestParam(required = false) Double radiusKm,
			@PageableDefault(size = 20, sort = "businessName") Pageable pageable) {
		Specification<ProviderProfile> spec = Specification
				.where(offersCategory(categoryId))
				.and(offersService(serviceId))
				.and(businessNameContains(q))
				.and(cityContains(city))
				.and(verifiedOnly(verified))
				.and(excludeUser(callerId));

		Page<ProviderProfile> page = (lat != null && lng != null && radiusKm != null)
				? searchWithinRadius(spec, lat, lng, radiusKm, pageable)
				: providerProfileRepository.findAll(spec, pageable);

		var providerIds = page.getContent().stream().map(ProviderProfile::getId).toList();
		Map<UUID, BigDecimal> fromPrices = providerServiceRepository.findMinPricesByProviderProfileIds(providerIds).stream()
				.collect(Collectors.toMap(
						ProviderServiceRepository.ProviderMinPrice::getProviderId,
						ProviderServiceRepository.ProviderMinPrice::getMinPrice));
		Map<UUID, ReviewRepository.ProviderRatingSummary> ratings = reviewRepository.findRatingSummariesByProviderProfileIds(providerIds)
				.stream()
				.collect(Collectors.toMap(ReviewRepository.ProviderRatingSummary::getProviderId, r -> r));

		return page.map(profile -> {
			ReviewRepository.ProviderRatingSummary rating = ratings.get(profile.getId());
			Double averageRating = rating != null ? rating.getAverageRating() : null;
			long reviewCount = rating != null ? rating.getReviewCount() : 0;
			return ProviderSummaryResponse.from(profile, fromPrices.get(profile.getId()), averageRating, reviewCount);
		});
	}

	// In-memory distance filter/sort/paginate rather than a Criteria-API Haversine expression -
	// simpler to read, and this project's provider count is nowhere near the scale where fetching
	// the (already category/city/etc-filtered) candidate set unpaged would matter.
	private Page<ProviderProfile> searchWithinRadius(Specification<ProviderProfile> spec, double lat, double lng,
			double radiusKm, Pageable pageable) {
		List<ProviderProfile> withinRadius = providerProfileRepository.findAll(spec).stream()
				.filter(p -> p.getLatitude() != null && p.getLongitude() != null)
				.filter(p -> GeoUtils.haversineKm(lat, lng, p.getLatitude(), p.getLongitude()) <= radiusKm)
				.sorted(Comparator.comparingDouble(p -> GeoUtils.haversineKm(lat, lng, p.getLatitude(), p.getLongitude())))
				.toList();

		int start = (int) pageable.getOffset();
		if (start >= withinRadius.size()) {
			return new PageImpl<>(List.of(), pageable, withinRadius.size());
		}
		int end = Math.min(start + pageable.getPageSize(), withinRadius.size());
		return new PageImpl<>(withinRadius.subList(start, end), pageable, withinRadius.size());
	}

	@GetMapping("/{id}")
	public ProviderDetailResponse getProvider(@PathVariable UUID id) {
		ProviderProfile profile = providerProfileRepository.findById(id)
				.orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Provider not found"));
		var services = providerServiceRepository.findByProviderProfileId(id).stream()
				.map(ProviderServiceResponse::from)
				.toList();

		// Reuses the same batched-rating-summary query as searchProviders, just with a
		// single-element id list, rather than duplicating a near-identical aggregate query.
		var ratings = reviewRepository.findRatingSummariesByProviderProfileIds(List.of(id));
		Double averageRating = ratings.isEmpty() ? null : ratings.get(0).getAverageRating();
		long reviewCount = ratings.isEmpty() ? 0 : ratings.get(0).getReviewCount();

		return ProviderDetailResponse.from(profile, services, averageRating, reviewCount);
	}
}
