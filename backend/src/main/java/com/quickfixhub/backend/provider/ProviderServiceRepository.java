package com.quickfixhub.backend.provider;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.UUID;

public interface ProviderServiceRepository extends JpaRepository<ProviderService, UUID> {

	// Fetches the catalog service eagerly to avoid N+1 lookups when mapping to a response DTO.
	@Query("SELECT ps FROM ProviderService ps JOIN FETCH ps.service WHERE ps.providerProfile.id = :providerProfileId")
	List<ProviderService> findByProviderProfileId(@Param("providerProfileId") UUID providerProfileId);
}
