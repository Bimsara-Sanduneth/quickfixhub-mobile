package com.quickfixhub.backend.profile;

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

import java.time.Instant;
import java.util.UUID;

// A customer's saved address (e.g. "Home", "Work"). Deliberately just a label + free-text
// address for now; lat/lng can be added once the maps milestone needs geocoding.
@Entity
@Table(name = "addresses")
public class Address {

	@Id
	@GeneratedValue(strategy = GenerationType.UUID)
	private UUID id;

	@ManyToOne(optional = false)
	@JoinColumn(name = "user_id", nullable = false)
	private User user;

	@Column(nullable = false, length = 100)
	private String label;

	@Column(name = "address_text", nullable = false, length = 500)
	private String addressText;

	@Column(name = "created_at", nullable = false)
	private Instant createdAt;

	protected Address() {
	}

	public Address(User user, String label, String addressText) {
		this.user = user;
		this.label = label;
		this.addressText = addressText;
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

	public String getLabel() {
		return label;
	}

	public String getAddressText() {
		return addressText;
	}

	public Instant getCreatedAt() {
		return createdAt;
	}
}
