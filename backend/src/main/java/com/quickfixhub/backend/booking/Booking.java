package com.quickfixhub.backend.booking;

import com.quickfixhub.backend.profile.Address;
import com.quickfixhub.backend.provider.ProviderProfile;
import com.quickfixhub.backend.provider.ProviderService;
import com.quickfixhub.backend.user.User;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

// providerProfile is denormalized alongside providerService (rather than reached via
// providerService.getProviderProfile()) so a provider's incoming bookings can be queried directly
// off this table once a provider dashboard needs that - see the "known gap" note on
// BookingController for why that endpoint doesn't exist yet.
@Entity
@Table(name = "bookings")
public class Booking {

	@Id
	@GeneratedValue(strategy = GenerationType.UUID)
	private UUID id;

	@ManyToOne(optional = false)
	@JoinColumn(name = "customer_id", nullable = false)
	private User customer;

	@ManyToOne(optional = false)
	@JoinColumn(name = "provider_profile_id", nullable = false)
	private ProviderProfile providerProfile;

	@ManyToOne(optional = false)
	@JoinColumn(name = "provider_service_id", nullable = false)
	private ProviderService providerService;

	@ManyToOne(optional = false)
	@JoinColumn(name = "address_id", nullable = false)
	private Address address;

	@Column(name = "scheduled_at", nullable = false)
	private Instant scheduledAt;

	@Enumerated(EnumType.STRING)
	@Column(nullable = false, length = 20)
	private BookingStatus status = BookingStatus.PENDING;

	// Snapshot of the provider's price at booking time, so a later price change on the provider's
	// listing doesn't silently change what an existing booking shows/charges.
	@Column(name = "price_at_booking", nullable = false, precision = 10, scale = 2)
	private BigDecimal priceAtBooking;

	@Column(length = 1000)
	private String notes;

	@Column(name = "created_at", nullable = false)
	private Instant createdAt;

	@Column(name = "updated_at", nullable = false)
	private Instant updatedAt;

	protected Booking() {
	}

	public Booking(User customer, ProviderProfile providerProfile, ProviderService providerService, Address address,
			Instant scheduledAt, BigDecimal priceAtBooking, String notes) {
		this.customer = customer;
		this.providerProfile = providerProfile;
		this.providerService = providerService;
		this.address = address;
		this.scheduledAt = scheduledAt;
		this.priceAtBooking = priceAtBooking;
		this.notes = notes;
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

	public User getCustomer() {
		return customer;
	}

	public ProviderProfile getProviderProfile() {
		return providerProfile;
	}

	public ProviderService getProviderService() {
		return providerService;
	}

	public Address getAddress() {
		return address;
	}

	public Instant getScheduledAt() {
		return scheduledAt;
	}

	public BookingStatus getStatus() {
		return status;
	}

	public void setStatus(BookingStatus status) {
		this.status = status;
	}

	public BigDecimal getPriceAtBooking() {
		return priceAtBooking;
	}

	public String getNotes() {
		return notes;
	}

	public Instant getCreatedAt() {
		return createdAt;
	}

	public Instant getUpdatedAt() {
		return updatedAt;
	}
}
