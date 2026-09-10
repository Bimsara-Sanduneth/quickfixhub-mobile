package com.quickfixhub.backend.provider;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;

import java.util.UUID;

// One row per weekday (0=Monday..6=Sunday) for a provider's open hours. start/end are kept as
// plain "HH:mm" strings rather than LocalTime - simpler to round-trip through JSON without a
// serialization format decision, and the value is never used in date arithmetic server-side.
@Entity
@Table(name = "provider_availability")
public class ProviderAvailability {

	@Id
	@GeneratedValue(strategy = GenerationType.UUID)
	private UUID id;

	@ManyToOne(optional = false)
	@JoinColumn(name = "provider_profile_id", nullable = false)
	private ProviderProfile providerProfile;

	@Column(name = "day_of_week", nullable = false)
	private int dayOfWeek;

	@Column(name = "is_open", nullable = false)
	private boolean open;

	@Column(name = "start_time", length = 5)
	private String startTime;

	@Column(name = "end_time", length = 5)
	private String endTime;

	protected ProviderAvailability() {
	}

	public ProviderAvailability(ProviderProfile providerProfile, int dayOfWeek, boolean open, String startTime,
			String endTime) {
		this.providerProfile = providerProfile;
		this.dayOfWeek = dayOfWeek;
		this.open = open;
		this.startTime = startTime;
		this.endTime = endTime;
	}

	public UUID getId() {
		return id;
	}

	public ProviderProfile getProviderProfile() {
		return providerProfile;
	}

	public int getDayOfWeek() {
		return dayOfWeek;
	}

	public boolean isOpen() {
		return open;
	}

	public String getStartTime() {
		return startTime;
	}

	public String getEndTime() {
		return endTime;
	}
}
