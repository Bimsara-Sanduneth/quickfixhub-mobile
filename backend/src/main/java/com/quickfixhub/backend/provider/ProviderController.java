package com.quickfixhub.backend.provider;

import com.quickfixhub.backend.provider.dto.ProviderDetailResponse;
import com.quickfixhub.backend.provider.dto.ProviderServiceResponse;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import java.util.UUID;

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
