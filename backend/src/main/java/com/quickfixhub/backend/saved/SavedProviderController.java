package com.quickfixhub.backend.saved;

import com.quickfixhub.backend.provider.ProviderProfile;
import com.quickfixhub.backend.provider.ProviderProfileRepository;
import com.quickfixhub.backend.provider.ProviderServiceRepository;
import com.quickfixhub.backend.provider.dto.ProviderSummaryResponse;
import com.quickfixhub.backend.review.ReviewRepository;
import com.quickfixhub.backend.user.UserRepository;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

// A customer's bookmarked providers (2q). Save/unsave are both idempotent (repeat-save is a
// no-op, unsave-of-something-not-saved is a no-op) - simpler for a toggle button than surfacing
// a 404/409 the UI would just have to swallow anyway.
@RestController
@RequestMapping("/me/saved-providers")
public class SavedProviderController {

	private final SavedProviderRepository savedProviderRepository;
	private final ProviderProfileRepository providerProfileRepository;
	private final ProviderServiceRepository providerServiceRepository;
	private final ReviewRepository reviewRepository;
	private final UserRepository userRepository;

	public SavedProviderController(SavedProviderRepository savedProviderRepository,
			ProviderProfileRepository providerProfileRepository, ProviderServiceRepository providerServiceRepository,
			ReviewRepository reviewRepository, UserRepository userRepository) {
		this.savedProviderRepository = savedProviderRepository;
		this.providerProfileRepository = providerProfileRepository;
		this.providerServiceRepository = providerServiceRepository;
		this.reviewRepository = reviewRepository;
		this.userRepository = userRepository;
	}

	@GetMapping
	public List<ProviderSummaryResponse> listSaved(@AuthenticationPrincipal UUID userId) {
		List<ProviderProfile> profiles = savedProviderRepository.findByUserIdOrderByCreatedAtDesc(userId).stream()
				.map(SavedProvider::getProviderProfile)
				.toList();
		var providerIds = profiles.stream().map(ProviderProfile::getId).toList();

		// Same batched fromPrice/rating lookups ProviderController's search uses.
		Map<UUID, BigDecimal> fromPrices = providerServiceRepository.findMinPricesByProviderProfileIds(providerIds).stream()
				.collect(Collectors.toMap(
						ProviderServiceRepository.ProviderMinPrice::getProviderId,
						ProviderServiceRepository.ProviderMinPrice::getMinPrice));
		Map<UUID, ReviewRepository.ProviderRatingSummary> ratings = reviewRepository.findRatingSummariesByProviderProfileIds(providerIds)
				.stream()
				.collect(Collectors.toMap(ReviewRepository.ProviderRatingSummary::getProviderId, r -> r));

		return profiles.stream().map(profile -> {
			var rating = ratings.get(profile.getId());
			Double averageRating = rating != null ? rating.getAverageRating() : null;
			long reviewCount = rating != null ? rating.getReviewCount() : 0;
			return ProviderSummaryResponse.from(profile, fromPrices.get(profile.getId()), averageRating, reviewCount);
		}).toList();
	}

	@PutMapping("/{providerId}")
	@ResponseStatus(HttpStatus.NO_CONTENT)
	public void save(@AuthenticationPrincipal UUID userId, @PathVariable UUID providerId) {
		if (savedProviderRepository.existsByUserIdAndProviderProfileId(userId, providerId)) {
			return;
		}
		ProviderProfile profile = providerProfileRepository.findById(providerId)
				.orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Provider not found"));
		savedProviderRepository.save(new SavedProvider(userRepository.getReferenceById(userId), profile));
	}

	@DeleteMapping("/{providerId}")
	@ResponseStatus(HttpStatus.NO_CONTENT)
	@Transactional
	public void unsave(@AuthenticationPrincipal UUID userId, @PathVariable UUID providerId) {
		savedProviderRepository.deleteByUserIdAndProviderProfileId(userId, providerId);
	}
}
