package com.quickfixhub.backend.provider;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface ProviderAvailabilityRepository extends JpaRepository<ProviderAvailability, UUID> {

	List<ProviderAvailability> findByProviderProfileIdOrderByDayOfWeek(UUID providerProfileId);

	// Availability is always replaced wholesale (the mobile screen submits all 7 days at once),
	// so clearing the old rows before inserting the new ones is simpler and safer than trying to
	// diff/upsert per day.
	void deleteByProviderProfileId(UUID providerProfileId);
}
