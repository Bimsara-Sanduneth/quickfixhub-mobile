package com.quickfixhub.backend.catalog;

import org.springframework.data.jpa.domain.Specification;

import java.util.UUID;

final class ServiceOfferingSpecifications {

	private ServiceOfferingSpecifications() {
	}

	// Returning null (rather than an always-true predicate) is the documented way to signal
	// "no restriction" to a Specification — it also sidesteps a Hibernate/PostgreSQL quirk where
	// a JPQL LIKE/LOWER expression built around a null bind parameter fails with
	// "function lower(bytea) does not exist" because the parameter's type can't be inferred.
	static Specification<ServiceOffering> categoryIdEquals(UUID categoryId) {
		return (root, query, cb) -> categoryId == null ? null : cb.equal(root.get("category").get("id"), categoryId);
	}

	static Specification<ServiceOffering> nameContains(String q) {
		return (root, query, cb) -> (q == null || q.isBlank())
				? null
				: cb.like(cb.lower(root.get("name")), "%" + q.toLowerCase() + "%");
	}
}
