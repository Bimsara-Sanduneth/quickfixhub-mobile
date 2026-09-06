package com.quickfixhub.backend.catalog;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;

import java.util.UUID;

// Named ServiceOffering rather than the spec's plain "Service" to avoid every future class in
// this package colliding with org.springframework.stereotype.Service on import. Maps to the
// "services" table.
@Entity
@Table(name = "services")
public class ServiceOffering {

	@Id
	@GeneratedValue(strategy = GenerationType.UUID)
	private UUID id;

	@ManyToOne(optional = false)
	@JoinColumn(name = "category_id", nullable = false)
	private ServiceCategory category;

	@Column(nullable = false)
	private String name;

	@Column(nullable = false, unique = true)
	private String slug;

	@Column
	private String description;

	protected ServiceOffering() {
	}

	public ServiceOffering(ServiceCategory category, String name, String slug, String description) {
		this.category = category;
		this.name = name;
		this.slug = slug;
		this.description = description;
	}

	public UUID getId() {
		return id;
	}

	public ServiceCategory getCategory() {
		return category;
	}

	public String getName() {
		return name;
	}

	public String getSlug() {
		return slug;
	}

	public String getDescription() {
		return description;
	}
}
