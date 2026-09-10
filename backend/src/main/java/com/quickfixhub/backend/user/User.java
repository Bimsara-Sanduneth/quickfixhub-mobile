package com.quickfixhub.backend.user;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "users")
public class User {

	@Id
	@GeneratedValue(strategy = GenerationType.UUID)
	private UUID id;

	@Column(nullable = false, unique = true)
	private String email;

	@Column(name = "password_hash", nullable = false)
	private String passwordHash;

	@Column(name = "full_name", nullable = false)
	private String fullName;

	@Column
	private String phone;

	// A data: URI (e.g. "data:image/jpeg;base64,...") - stored directly in the row since no
	// object storage exists in this project. Null until the user uploads one.
	@Column(name = "photo_data_uri", columnDefinition = "TEXT")
	private String photoDataUri;

	// Same shape as photoDataUri - shown on a provider's public detail page, or just kept private
	// in a customer's own profile section (nowhere else reads it for a customer today).
	@Column(name = "cover_photo_data_uri", columnDefinition = "TEXT")
	private String coverPhotoDataUri;

	@Enumerated(EnumType.STRING)
	@Column(nullable = false, length = 20)
	private Role role;

	@Column(nullable = false)
	private boolean enabled = true;

	@Column(name = "created_at", nullable = false)
	private Instant createdAt;

	@Column(name = "updated_at", nullable = false)
	private Instant updatedAt;

	protected User() {
	}

	public User(String email, String passwordHash, String fullName, String phone, Role role) {
		this.email = email;
		this.passwordHash = passwordHash;
		this.fullName = fullName;
		this.phone = phone;
		this.role = role;
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

	public String getEmail() {
		return email;
	}

	public String getPasswordHash() {
		return passwordHash;
	}

	// Only ever set to an already-encoded hash - see AuthService (registration, password reset).
	public void setPasswordHash(String passwordHash) {
		this.passwordHash = passwordHash;
	}

	public String getFullName() {
		return fullName;
	}

	public String getPhone() {
		return phone;
	}

	public String getPhotoDataUri() {
		return photoDataUri;
	}

	public void setPhotoDataUri(String photoDataUri) {
		this.photoDataUri = photoDataUri;
	}

	public String getCoverPhotoDataUri() {
		return coverPhotoDataUri;
	}

	public void setCoverPhotoDataUri(String coverPhotoDataUri) {
		this.coverPhotoDataUri = coverPhotoDataUri;
	}

	public Role getRole() {
		return role;
	}

	public boolean isEnabled() {
		return enabled;
	}

	public Instant getCreatedAt() {
		return createdAt;
	}

	public Instant getUpdatedAt() {
		return updatedAt;
	}
}
