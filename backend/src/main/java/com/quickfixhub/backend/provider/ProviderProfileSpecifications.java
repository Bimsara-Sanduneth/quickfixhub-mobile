package com.quickfixhub.backend.provider;

import org.springframework.data.jpa.domain.Specification;

import java.util.UUID;

final class ProviderProfileSpecifications {

	private ProviderProfileSpecifications() {
	}

	// See ServiceOfferingSpecifications in the catalog package for why this is a Specification
	// rather than a JPQL "(:param IS NULL OR ...)" query: the latter crashes on Postgres when a
	// LOWER()/LIKE expression is built around a null bind parameter.
	static Specification<ProviderProfile> offersCategory(UUID categoryId) {
		return (root, query, cb) -> {
			if (categoryId == null) {
				return null;
			}
			query.distinct(true);
			var services = root.join("services");
			return cb.equal(services.get("service").get("category").get("id"), categoryId);
		};
	}

	static Specification<ProviderProfile> offersService(UUID serviceId) {
		return (root, query, cb) -> {
			if (serviceId == null) {
				return null;
			}
			query.distinct(true);
			var services = root.join("services");
			return cb.equal(services.get("service").get("id"), serviceId);
		};
	}

	static Specification<ProviderProfile> businessNameContains(String q) {
		return (root, query, cb) -> (q == null || q.isBlank())
				? null
				: cb.like(cb.lower(root.get("businessName")), "%" + q.toLowerCase() + "%");
	}

	static Specification<ProviderProfile> cityContains(String city) {
		return (root, query, cb) -> (city == null || city.isBlank())
				? null
				: cb.like(cb.lower(root.get("city")), "%" + city.toLowerCase() + "%");
	}

	static Specification<ProviderProfile> verifiedOnly(Boolean verified) {
		return (root, query, cb) -> (verified == null || !verified)
				? null
				: cb.isTrue(root.get("verified"));
	}

	// A logged-in provider searching (e.g. the Home screen's "Recommended for you", which is
	// really just an unfiltered search) shouldn't see their own listing recommended to them.
	static Specification<ProviderProfile> excludeUser(UUID userId) {
		return (root, query, cb) -> userId == null
				? null
				: cb.notEqual(root.get("user").get("id"), userId);
	}
}
