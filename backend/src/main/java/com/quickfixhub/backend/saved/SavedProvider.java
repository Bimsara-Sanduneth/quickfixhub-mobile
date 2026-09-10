package com.quickfixhub.backend.saved;

import com.quickfixhub.backend.provider.ProviderProfile;
import com.quickfixhub.backend.user.User;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;

import java.time.Instant;
import java.util.UUID;

// A customer bookmarking a provider (2q's "saved providers" section) - no bookmarking existed
// anywhere in the app before this.
@Entity
@Table(name = "saved_providers", uniqueConstraints = @UniqueConstraint(columnNames = { "user_id", "provider_profile_id" }))
public class SavedProvider {

	@Id
	@GeneratedValue(strategy = GenerationType.UUID)
	private UUID id;

	@ManyToOne(optional = false)
	@JoinColumn(name = "user_id", nullable = false)
	private User user;

	@ManyToOne(optional = false)
	@JoinColumn(name = "provider_profile_id", nullable = false)
	private ProviderProfile providerProfile;

	@Column(name = "created_at", nullable = false)
	private Instant createdAt;

	protected SavedProvider() {
	}

	public SavedProvider(User user, ProviderProfile providerProfile) {
		this.user = user;
		this.providerProfile = providerProfile;
	}

	@PrePersist
	void onCreate() {
		createdAt = Instant.now();
	}

	public UUID getId() {
		return id;
	}

	public User getUser() {
		return user;
	}

	public ProviderProfile getProviderProfile() {
		return providerProfile;
	}

	public Instant getCreatedAt() {
		return createdAt;
	}
}
