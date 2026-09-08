package com.quickfixhub.backend.booking;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface BookingRepository extends JpaRepository<Booking, UUID> {

	// customer/providerProfile/providerService/address are all default-fetch (EAGER) @ManyToOne
	// associations, same convention as the rest of this codebase (e.g. ProviderService.service) -
	// safe to read straight off the returned entities with open-in-view disabled, at the cost of
	// one extra query per association per row. Fine at this project's data volume; worth revisiting
	// with an explicit JOIN FETCH query if a provider's booking list ever needs to scale up.
	List<Booking> findByCustomerIdOrderByScheduledAtDesc(UUID customerId);

	List<Booking> findByProviderProfileIdOrderByScheduledAtDesc(UUID providerProfileId);

	long countByStatus(BookingStatus status);
}
