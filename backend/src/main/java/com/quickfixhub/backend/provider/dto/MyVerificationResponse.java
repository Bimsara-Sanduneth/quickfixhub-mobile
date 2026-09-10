package com.quickfixhub.backend.provider.dto;

import com.quickfixhub.backend.provider.VerificationStatus;

import java.util.List;

// Self-view only (GET /me/provider-profile/verification) - deliberately not folded into the
// shared ProviderDetailResponse, since that record also serves the public GET /providers/{id}
// endpoint and providerMessage/documents are private to the provider it belongs to.
public record MyVerificationResponse(
		VerificationStatus status,
		String providerMessage,
		List<ProviderDocumentResponse> documents) {
}
