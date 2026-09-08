package com.quickfixhub.backend.admin;

import com.quickfixhub.backend.admin.dto.AdminProviderResponse;
import com.quickfixhub.backend.provider.ProviderProfile;
import com.quickfixhub.backend.provider.ProviderProfileRepository;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.UUID;

// 2v - the verification queue. No document-upload path exists for a provider to submit anything
// to be verified against - this is "here's every unverified provider, with what's already on
// their profile" rather than a review of submitted credentials.
@RestController
@RequestMapping("/admin/providers")
@PreAuthorize("hasRole('ADMIN')")
public class AdminVerificationController {

	private final ProviderProfileRepository providerProfileRepository;

	public AdminVerificationController(ProviderProfileRepository providerProfileRepository) {
		this.providerProfileRepository = providerProfileRepository;
	}

	@GetMapping("/pending")
	public List<AdminProviderResponse> listPending() {
		return providerProfileRepository.findByVerifiedFalseOrderByCreatedAtAsc().stream()
				.map(AdminProviderResponse::from)
				.toList();
	}

	@PatchMapping("/{id}/verify")
	public AdminProviderResponse verify(@PathVariable UUID id) {
		ProviderProfile profile = providerProfileRepository.findById(id)
				.orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Provider not found"));
		profile.setVerified(true);
		return AdminProviderResponse.from(providerProfileRepository.save(profile));
	}
}
