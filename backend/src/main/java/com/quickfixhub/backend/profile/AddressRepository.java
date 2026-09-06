package com.quickfixhub.backend.profile;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface AddressRepository extends JpaRepository<Address, UUID> {

	List<Address> findByUserIdOrderByCreatedAtAsc(UUID userId);
}
