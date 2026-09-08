package com.quickfixhub.backend.provider;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

public interface ProviderServiceRepository extends JpaRepository<ProviderService, UUID> {

	boolean existsByProviderProfileIdAndServiceId(UUID providerProfileId, UUID serviceId);

	// Fetches the catalog service eagerly to avoid N+1 lookups when mapping to a response DTO.
	@Query("SELECT ps FROM ProviderService ps JOIN FETCH ps.service WHERE ps.providerProfile.id = :providerProfileId")
	List<ProviderService> findByProviderProfileId(@Param("providerProfileId") UUID providerProfileId);

	// One batched query for a whole page of providers' "from" price, rather than one query per
	// provider (which is exactly the N+1 shape findByProviderProfileId's JOIN FETCH already
	// avoids for the single-provider case).
	@Query("""
			SELECT ps.providerProfile.id AS providerId, MIN(ps.price) AS minPrice
			FROM ProviderService ps
			WHERE ps.providerProfile.id IN :providerProfileIds
			GROUP BY ps.providerProfile.id
			""")
	List<ProviderMinPrice> findMinPricesByProviderProfileIds(@Param("providerProfileIds") List<UUID> providerProfileIds);

	interface ProviderMinPrice {
		UUID getProviderId();

		BigDecimal getMinPrice();
	}
}
