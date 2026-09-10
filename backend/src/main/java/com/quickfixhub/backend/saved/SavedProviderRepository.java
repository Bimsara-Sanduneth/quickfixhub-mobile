package com.quickfixhub.backend.saved;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.UUID;

public interface SavedProviderRepository extends JpaRepository<SavedProvider, UUID> {

	// Fetches the provider profile eagerly - the list endpoint always needs it to build a
	// ProviderSummaryResponse, same JOIN FETCH pattern as ProviderServiceRepository.
	@Query("SELECT sp FROM SavedProvider sp JOIN FETCH sp.providerProfile WHERE sp.user.id = :userId ORDER BY sp.createdAt DESC")
	List<SavedProvider> findByUserIdOrderByCreatedAtDesc(@Param("userId") UUID userId);

	boolean existsByUserIdAndProviderProfileId(UUID userId, UUID providerProfileId);

	void deleteByUserIdAndProviderProfileId(UUID userId, UUID providerProfileId);
}
