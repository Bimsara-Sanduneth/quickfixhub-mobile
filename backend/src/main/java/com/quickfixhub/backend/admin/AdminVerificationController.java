package com.quickfixhub.backend.admin;

import com.quickfixhub.backend.admin.dto.AdminDecisionRequest;
import com.quickfixhub.backend.admin.dto.AdminDocumentReviewRequest;
import com.quickfixhub.backend.admin.dto.AdminNoteRequest;
import com.quickfixhub.backend.admin.dto.AdminProviderDetailResponse;
import com.quickfixhub.backend.admin.dto.AdminProviderResponse;
import com.quickfixhub.backend.notification.NotificationService;
import com.quickfixhub.backend.notification.NotificationType;
import com.quickfixhub.backend.provider.DocumentStatus;
import com.quickfixhub.backend.provider.DocumentType;
import com.quickfixhub.backend.provider.ProviderDocument;
import com.quickfixhub.backend.provider.ProviderDocumentRepository;
import com.quickfixhub.backend.provider.ProviderProfile;
import com.quickfixhub.backend.provider.ProviderProfileRepository;
import com.quickfixhub.backend.provider.VerificationStatus;
import com.quickfixhub.backend.provider.dto.ProviderDocumentResponse;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import java.util.Arrays;
import java.util.List;
import java.util.Locale;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

// 2u/2v - document-based verification queue. Approve/reject/request-docs all funnel through
// ProviderProfile.setVerificationStatus so the legacy `verified` boolean search filter and admin
// overview stats stay correct without knowing about the tri-state status themselves.
@RestController
@RequestMapping("/admin/providers")
@PreAuthorize("hasRole('ADMIN')")
public class AdminVerificationController {

	private final ProviderProfileRepository providerProfileRepository;
	private final ProviderDocumentRepository providerDocumentRepository;
	private final NotificationService notificationService;

	public AdminVerificationController(ProviderProfileRepository providerProfileRepository,
			ProviderDocumentRepository providerDocumentRepository, NotificationService notificationService) {
		this.providerProfileRepository = providerProfileRepository;
		this.providerDocumentRepository = providerDocumentRepository;
		this.notificationService = notificationService;
	}

	@GetMapping
	public List<AdminProviderResponse> list(@RequestParam(defaultValue = "PENDING") VerificationStatus status) {
		return providerProfileRepository.findByVerificationStatusOrderByCreatedAtAsc(status).stream()
				.map(profile -> AdminProviderResponse.from(profile,
						providerDocumentRepository.countByProviderProfileId(profile.getId()),
						providerDocumentRepository.countByProviderProfileIdAndStatus(profile.getId(), DocumentStatus.CHECKED)))
				.toList();
	}

	@GetMapping("/{id}")
	public AdminProviderDetailResponse getDetail(@PathVariable UUID id) {
		ProviderProfile profile = requireProfile(id);
		List<ProviderDocumentResponse> documents = providerDocumentRepository.findByProviderProfileIdOrderByDocumentType(id).stream()
				.map(ProviderDocumentResponse::from)
				.toList();
		return AdminProviderDetailResponse.from(profile, documents);
	}

	@PatchMapping("/{id}/verify")
	public AdminProviderDetailResponse verify(@PathVariable UUID id) {
		ProviderProfile profile = requireProfile(id);

		// A provider can only be approved once they've at least submitted the required documents
		// (identity + business legitimacy) - "submitted" only, not necessarily marked CHECKED yet,
		// so the admin's own document review is still a separate, deliberate step.
		Set<DocumentType> submitted = providerDocumentRepository.findByProviderProfileIdOrderByDocumentType(id).stream()
				.map(ProviderDocument::getDocumentType)
				.collect(Collectors.toSet());
		List<DocumentType> missing = Arrays.stream(DocumentType.values())
				.filter(DocumentType::isRequired)
				.filter(type -> !submitted.contains(type))
				.toList();
		if (!missing.isEmpty()) {
			String names = missing.stream()
					.map(type -> type.name().replace('_', ' ').toLowerCase(Locale.ROOT))
					.collect(Collectors.joining(", "));
			throw new ResponseStatusException(HttpStatus.CONFLICT,
					"Provider hasn't submitted all required documents yet: " + names);
		}

		profile.setVerificationStatus(VerificationStatus.APPROVED);
		profile.setProviderMessage(null);
		providerProfileRepository.save(profile);

		notificationService.notify(profile.getUser(), NotificationType.VERIFICATION_APPROVED,
				"You're verified!", "Customers now see a Verified badge on " + profile.getBusinessName() + ".");

		return getDetail(profile.getId());
	}

	@PatchMapping("/{id}/reject")
	public AdminProviderDetailResponse reject(@PathVariable UUID id, @Valid @RequestBody AdminDecisionRequest request) {
		ProviderProfile profile = requireProfile(id);
		profile.setVerificationStatus(VerificationStatus.REJECTED);
		profile.setProviderMessage(request.reason());
		providerProfileRepository.save(profile);

		notificationService.notify(profile.getUser(), NotificationType.VERIFICATION_REJECTED,
				"Verification rejected", request.reason());

		return getDetail(profile.getId());
	}

	// Softer than /reject - sends the provider back to PENDING (still "in the queue", not turned
	// down) with a note about what's missing, rather than a hard rejection.
	@PatchMapping("/{id}/request-docs")
	public AdminProviderDetailResponse requestDocs(@PathVariable UUID id, @Valid @RequestBody AdminDecisionRequest request) {
		ProviderProfile profile = requireProfile(id);
		profile.setVerificationStatus(VerificationStatus.PENDING);
		profile.setProviderMessage(request.reason());
		providerProfileRepository.save(profile);

		notificationService.notify(profile.getUser(), NotificationType.VERIFICATION_DOCS_REQUESTED,
				"More documents needed", request.reason());

		return getDetail(profile.getId());
	}

	@PutMapping("/{id}/note")
	public AdminProviderDetailResponse setNote(@PathVariable UUID id, @Valid @RequestBody AdminNoteRequest request) {
		ProviderProfile profile = requireProfile(id);
		profile.setInternalNote(request.note());
		return getDetail(providerProfileRepository.save(profile).getId());
	}

	@PatchMapping("/{id}/documents/{documentId}")
	public AdminProviderDetailResponse reviewDocument(@PathVariable UUID id, @PathVariable UUID documentId,
			@Valid @RequestBody AdminDocumentReviewRequest request) {
		requireProfile(id);
		ProviderDocument document = providerDocumentRepository.findById(documentId)
				.orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Document not found"));
		if (!document.getProviderProfile().getId().equals(id)) {
			throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Document not found");
		}
		document.setStatus(request.status());
		document.setReviewNote(request.reviewNote());
		providerDocumentRepository.save(document);
		return getDetail(id);
	}

	private ProviderProfile requireProfile(UUID id) {
		return providerProfileRepository.findById(id)
				.orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Provider not found"));
	}
}
