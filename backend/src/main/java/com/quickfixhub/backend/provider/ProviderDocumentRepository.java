package com.quickfixhub.backend.provider;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface ProviderDocumentRepository extends JpaRepository<ProviderDocument, UUID> {

	List<ProviderDocument> findByProviderProfileIdOrderByDocumentType(UUID providerProfileId);

	Optional<ProviderDocument> findByProviderProfileIdAndDocumentType(UUID providerProfileId, DocumentType documentType);

	long countByProviderProfileId(UUID providerProfileId);

	long countByProviderProfileIdAndStatus(UUID providerProfileId, DocumentStatus status);
}
