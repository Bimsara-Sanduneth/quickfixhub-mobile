package com.quickfixhub.backend.review;

import com.quickfixhub.backend.booking.Booking;
import com.quickfixhub.backend.provider.ProviderProfile;
import com.quickfixhub.backend.user.User;
import jakarta.persistence.Column;
import jakarta.persistence.Convert;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToOne;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

// customer/providerProfile are denormalized off the booking (rather than reached via
// booking.getCustomer()/getProviderProfile()) for the same reason Booking denormalizes
// providerProfile off providerService - lets a provider's reviews be queried directly without
// joining through bookings.
@Entity
@Table(name = "reviews")
public class Review {

	@Id
	@GeneratedValue(strategy = GenerationType.UUID)
	private UUID id;

	@OneToOne(optional = false)
	@JoinColumn(name = "booking_id", nullable = false, unique = true)
	private Booking booking;

	@ManyToOne(optional = false)
	@JoinColumn(name = "customer_id", nullable = false)
	private User customer;

	@ManyToOne(optional = false)
	@JoinColumn(name = "provider_profile_id", nullable = false)
	private ProviderProfile providerProfile;

	@Column(nullable = false)
	private int rating;

	@Column(length = 1000)
	private String comment;

	// Quick-select chips (2p) - "ON_TIME", "TIDY_WORK", etc. See TagsConverter for the storage
	// format; no fixed enum is enforced server-side, the mobile client owns the chip vocabulary.
	@Convert(converter = TagsConverter.class)
	@Column(length = 500)
	private List<String> tags = List.of();

	@Column(name = "created_at", nullable = false)
	private Instant createdAt;

	protected Review() {
	}

	public Review(Booking booking, User customer, ProviderProfile providerProfile, int rating, String comment, List<String> tags) {
		this.booking = booking;
		this.customer = customer;
		this.providerProfile = providerProfile;
		this.rating = rating;
		this.comment = comment;
		this.tags = tags != null ? tags : List.of();
	}

	@PrePersist
	void onCreate() {
		createdAt = Instant.now();
	}

	public UUID getId() {
		return id;
	}

	public Booking getBooking() {
		return booking;
	}

	public User getCustomer() {
		return customer;
	}

	public ProviderProfile getProviderProfile() {
		return providerProfile;
	}

	public int getRating() {
		return rating;
	}

	public String getComment() {
		return comment;
	}

	public List<String> getTags() {
		return tags;
	}

	public Instant getCreatedAt() {
		return createdAt;
	}
}
