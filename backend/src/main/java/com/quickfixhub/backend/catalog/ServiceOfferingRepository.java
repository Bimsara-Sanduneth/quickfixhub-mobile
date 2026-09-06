package com.quickfixhub.backend.catalog;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

import java.util.UUID;

public interface ServiceOfferingRepository extends JpaRepository<ServiceOffering, UUID>,
		JpaSpecificationExecutor<ServiceOffering> {
}
