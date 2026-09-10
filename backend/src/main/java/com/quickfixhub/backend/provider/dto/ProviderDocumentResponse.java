package com.quickfixhub.backend.provider.dto;

import com.quickfixhub.backend.provider.DocumentStatus;
import com.quickfixhub.backend.provider.DocumentType;
import com.quickfixhub.backend.provider.ProviderDocument;

import java.time.Instant;
import java.util.UUID;

public record ProviderDocumentResponse(
		UUID id,
		DocumentType documentType,
		DocumentStatus status,
		String reviewNote,
		String fileDataUri,
		Instant createdAt) {

	public static ProviderDocumentResponse from(ProviderDocument document) {
		return new ProviderDocumentResponse(
				document.getId(),
				document.getDocumentType(),
				document.getStatus(),
				document.getReviewNote(),
				document.getFileDataUri(),
				document.getCreatedAt());
	}
}
