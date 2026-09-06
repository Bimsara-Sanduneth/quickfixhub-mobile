package com.quickfixhub.backend.provider;

import com.quickfixhub.backend.user.User;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
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

	@Column(nullable = false)
	private boolean verified = false;

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

	public boolean isVerified() {
		return verified;
	}

	public Instant getCreatedAt() {
		return createdAt;
	}

	public Instant getUpdatedAt() {
		return updatedAt;
	}
}
