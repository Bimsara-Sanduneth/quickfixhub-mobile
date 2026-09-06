package com.quickfixhub.backend.provider;

import com.quickfixhub.backend.catalog.ServiceOffering;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;

import java.math.BigDecimal;
import java.util.UUID;

// A provider's own price/duration for one catalog service. Named to match the spec; unlike the
// catalog's ServiceOffering, "ProviderService" doesn't collide with
// org.springframework.stereotype.Service.
@Entity
@Table(name = "provider_services")
public class ProviderService {

	@Id
	@GeneratedValue(strategy = GenerationType.UUID)
	private UUID id;

	@ManyToOne(optional = false)
	@JoinColumn(name = "provider_profile_id", nullable = false)
	private ProviderProfile providerProfile;

	@ManyToOne(optional = false)
	@JoinColumn(name = "service_id", nullable = false)
	private ServiceOffering service;

	@Column(nullable = false, precision = 10, scale = 2)
	private BigDecimal price;

	@Column(name = "duration_minutes")
	private Integer durationMinutes;

	protected ProviderService() {
	}

	public ProviderService(ProviderProfile providerProfile, ServiceOffering service, BigDecimal price,
			Integer durationMinutes) {
		this.providerProfile = providerProfile;
		this.service = service;
		this.price = price;
		this.durationMinutes = durationMinutes;
	}

	public UUID getId() {
		return id;
	}

	public ProviderProfile getProviderProfile() {
		return providerProfile;
	}

	public ServiceOffering getService() {
		return service;
	}

	public BigDecimal getPrice() {
		return price;
	}

	public Integer getDurationMinutes() {
		return durationMinutes;
	}
}
