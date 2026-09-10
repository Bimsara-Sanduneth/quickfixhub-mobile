package com.quickfixhub.backend.provider;

import com.quickfixhub.backend.user.User;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.OneToMany;
import jakarta.persistence.OneToOne;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Entity
@Table(name = "provider_profiles")
public class ProviderProfile {

	@Id
	@GeneratedValue(strategy = GenerationType.UUID)
	private UUID id;

	@OneToOne(optional = false)
	@JoinColumn(name = "user_id", nullable = false, unique = true)
	private User user;

	@Column(name = "business_name", nullable = false)
	private String businessName;

	@Column
	private String bio;

	@Column(name = "years_experience")
	private Integer yearsExperience;

	@Column
	private String city;

	// Geocoded from `city` at profile-creation time (best-effort, via GeocodingService) - city
	// level precision only, no street address exists to geocode more precisely. Null if
	// geocoding failed or no city was given; the discovery map just omits an ungeocoded provider.
	@Column
	private Double latitude;

	@Column
	private Double longitude;

	// How far the provider is willing to travel for a job. Nullable - unset until the provider
	// visits the availability screen (2t); no booking-eligibility logic reads this yet.
	@Column(name = "service_radius_km")
	private Integer serviceRadiusKm;

	// Kept in sync with verificationStatus (true iff APPROVED) by setVerificationStatus - existing
	// queries (search's verifiedOnly filter, the "Verified" badge, admin's overview stats) all
	// read this bare boolean and don't need a third REJECTED state to make sense of.
	@Column(nullable = false)
	private boolean verified = false;

	@Enumerated(EnumType.STRING)
	@Column(name = "verification_status", nullable = false)
	private VerificationStatus verificationStatus = VerificationStatus.PENDING;

	// Set alongside a reject/request-docs decision, shown to the provider; cleared on approval.
	@Column(name = "provider_message", columnDefinition = "TEXT")
	private String providerMessage;

	// Admin-only scratchpad - never serialized into a provider-facing response.
	@Column(name = "internal_note", columnDefinition = "TEXT")
	private String internalNote;

	@Column(name = "created_at", nullable = false)
	private Instant createdAt;

	@Column(name = "updated_at", nullable = false)
	private Instant updatedAt;

	// Inverse side, unmapped column - exists so search queries can join from ProviderProfile to
	// the services a provider offers (e.g. "providers offering service X / in category Y").
	@OneToMany(mappedBy = "providerProfile")
	private List<ProviderService> services = new ArrayList<>();

	protected ProviderProfile() {
	}

	public ProviderProfile(User user, String businessName, String bio, Integer yearsExperience, String city) {
		this.user = user;
		this.businessName = businessName;
		this.bio = bio;
		this.yearsExperience = yearsExperience;
		this.city = city;
	}

	@PrePersist
	void onCreate() {
		Instant now = Instant.now();
		createdAt = now;
		updatedAt = now;
	}

	@PreUpdate
	void onUpdate() {
		updatedAt = Instant.now();
	}

	public UUID getId() {
		return id;
	}

	public User getUser() {
		return user;
	}

	public String getBusinessName() {
		return businessName;
	}

	public String getBio() {
		return bio;
	}

	public Integer getYearsExperience() {
		return yearsExperience;
	}

	public String getCity() {
		return city;
	}

	public Double getLatitude() {
		return latitude;
	}

	public void setLatitude(Double latitude) {
		this.latitude = latitude;
	}

	public Double getLongitude() {
		return longitude;
	}

	public void setLongitude(Double longitude) {
		this.longitude = longitude;
	}

	public Integer getServiceRadiusKm() {
		return serviceRadiusKm;
	}

	public void setServiceRadiusKm(Integer serviceRadiusKm) {
		this.serviceRadiusKm = serviceRadiusKm;
	}

	public boolean isVerified() {
		return verified;
	}

	public void setVerified(boolean verified) {
		this.verified = verified;
	}

	public VerificationStatus getVerificationStatus() {
		return verificationStatus;
	}

	// The one place `verified` is set from now on - keeps the two fields from ever disagreeing.
	public void setVerificationStatus(VerificationStatus verificationStatus) {
		this.verificationStatus = verificationStatus;
		this.verified = verificationStatus == VerificationStatus.APPROVED;
	}

	public String getProviderMessage() {
		return providerMessage;
	}

	public void setProviderMessage(String providerMessage) {
		this.providerMessage = providerMessage;
	}

	public String getInternalNote() {
		return internalNote;
	}

	public void setInternalNote(String internalNote) {
		this.internalNote = internalNote;
	}

	public Instant getCreatedAt() {
		return createdAt;
	}

	public Instant getUpdatedAt() {
		return updatedAt;
	}
}
