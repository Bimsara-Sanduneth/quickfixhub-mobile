package com.quickfixhub.backend.provider;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface ProviderProfileRepository extends JpaRepository<ProviderProfile, UUID>,
		JpaSpecificationExecutor<ProviderProfile> {

	Optional<ProviderProfile> findByUserId(UUID userId);

	long countByVerified(boolean verified);

	List<ProviderProfile> findByVerifiedFalseOrderByCreatedAtAsc();
}
