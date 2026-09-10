package com.quickfixhub.backend.provider;

import com.quickfixhub.backend.provider.dto.AvailabilityDayResponse;
import com.quickfixhub.backend.provider.dto.AvailabilityResponse;
import com.quickfixhub.backend.provider.dto.UpdateAvailabilityRequest;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.UUID;

// Weekly open hours and service radius (design 2t). Nothing else in the app reads this yet - a
// provider's booking eligibility isn't gated by it - this is purely the provider setting and
// seeing their own values.
@RestController
@RequestMapping("/me/provider-profile/availability")
public class ProviderAvailabilityController {

	private final ProviderProfileRepository providerProfileRepository;
	private final ProviderAvailabilityRepository availabilityRepository;

	public ProviderAvailabilityController(ProviderProfileRepository providerProfileRepository,
			ProviderAvailabilityRepository availabilityRepository) {
		this.providerProfileRepository = providerProfileRepository;
		this.availabilityRepository = availabilityRepository;
	}

	@GetMapping
	@PreAuthorize("hasRole('PROVIDER')")
	public AvailabilityResponse getAvailability(@AuthenticationPrincipal UUID userId) {
		ProviderProfile profile = requireProfile(userId);
		List<ProviderAvailability> saved = availabilityRepository.findByProviderProfileIdOrderByDayOfWeek(profile.getId());
		List<AvailabilityDayResponse> days = mergeWithDefaults(saved);
		return new AvailabilityResponse(profile.getServiceRadiusKm(), days);
	}

	// The delete-then-insert below is a "replace all 7 rows" operation, not two independent writes
	// - without an explicit transaction, deleteByProviderProfileId (a derived bulk-delete query)
	// has no active EntityManager transaction to run in and throws
	// InvalidDataAccessApiUsageException immediately, before ever reaching the inserts.
	@PutMapping
	@PreAuthorize("hasRole('PROVIDER')")
	@Transactional
	public AvailabilityResponse updateAvailability(@AuthenticationPrincipal UUID userId,
			@Valid @RequestBody UpdateAvailabilityRequest request) {
		ProviderProfile profile = requireProfile(userId);

		Set<Integer> daysGiven = new HashSet<>();
		for (var day : request.days()) {
			if (!daysGiven.add(day.dayOfWeek())) {
				throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "day " + day.dayOfWeek() + " was listed more than once");
			}
			if (day.isOpen() && (day.startTime() == null || day.endTime() == null)) {
				throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "day " + day.dayOfWeek() + " is open but missing a start/end time");
			}
		}

		profile.setServiceRadiusKm(request.serviceRadiusKm());
		providerProfileRepository.save(profile);

		availabilityRepository.deleteByProviderProfileId(profile.getId());
		// Hibernate queues writes and flushes them in a fixed order - inserts before deletes,
		// regardless of the order they were issued in code - so without forcing the delete to
		// hit the database now, the inserts below would run first and collide with the old rows
		// on (provider_profile_id, day_of_week), which is exactly what happened on a second save.
		availabilityRepository.flush();
		List<ProviderAvailability> rows = request.days().stream()
				.map(day -> new ProviderAvailability(profile, day.dayOfWeek(), day.isOpen(), day.startTime(), day.endTime()))
				.toList();
		availabilityRepository.saveAll(rows);

		List<AvailabilityDayResponse> days = mergeWithDefaults(rows);
		return new AvailabilityResponse(profile.getServiceRadiusKm(), days);
	}

	// Always returns exactly 7 entries (Monday=0..Sunday=6), filling in "closed" for any day the
	// provider hasn't saved yet, so the mobile screen never has to handle a sparse list.
	private List<AvailabilityDayResponse> mergeWithDefaults(List<ProviderAvailability> saved) {
		AvailabilityDayResponse[] days = new AvailabilityDayResponse[7];
		for (int i = 0; i < 7; i++) {
			days[i] = AvailabilityDayResponse.closed(i);
		}
		for (ProviderAvailability row : saved) {
			days[row.getDayOfWeek()] = AvailabilityDayResponse.from(row);
		}
		return List.of(days);
	}

	private ProviderProfile requireProfile(UUID userId) {
		return providerProfileRepository.findByUserId(userId)
				.orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "No provider profile yet"));
	}
}
