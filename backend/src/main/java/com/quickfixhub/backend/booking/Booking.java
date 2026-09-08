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
import java.time.temporal.ChronoUnit;
import java.util.UUID;

// providerProfile is denormalized alongside providerService (rather than reached via
// providerService.getProviderProfile()) so a provider's incoming bookings can be queried directly
// off this table - see MyProviderProfileController.listMyBookings.
//
// The per-transition timestamp columns (acceptedAt, enRouteAt, ...) exist so the mobile "booking
// tracking" timeline has real data to render without a separate status-history table - each is
// set once, by the controller action that makes that transition, alongside status itself. Kept as
// plain setters (no accept()/decline()/... domain methods) to match this codebase's convention of
// business logic living in the controller, not the entity - see BookingController.
@Entity
@Table(name = "bookings")
public class Booking {

	// How long a REQUESTED booking waits for the provider to accept or decline before it's treated
	// as expired (auto-declined) - matches the accept window shown on the "request sent" screen.
	public static final long ACCEPT_WINDOW_MINUTES = 30;

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
	private BookingStatus status = BookingStatus.REQUESTED;

	// Snapshot of the provider's price at booking time, so a later price change on the provider's
	// listing doesn't silently change what an existing booking shows/charges.
	@Column(name = "price_at_booking", nullable = false, precision = 10, scale = 2)
	private BigDecimal priceAtBooking;

	@Column(length = 1000)
	private String notes;

	@Column(name = "expires_at")
	private Instant expiresAt;

	@Column(name = "accepted_at")
	private Instant acceptedAt;

	@Column(name = "en_route_at")
	private Instant enRouteAt;

	@Column(name = "in_progress_at")
	private Instant inProgressAt;

	@Column(name = "completed_at")
	private Instant completedAt;

	@Column(name = "declined_at")
	private Instant declinedAt;

	@Column(name = "cancelled_at")
	private Instant cancelledAt;

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
		expiresAt = now.plus(ACCEPT_WINDOW_MINUTES, ChronoUnit.MINUTES);
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

	public Instant getExpiresAt() {
		return expiresAt;
	}

	public Instant getAcceptedAt() {
		return acceptedAt;
	}

	public void setAcceptedAt(Instant acceptedAt) {
		this.acceptedAt = acceptedAt;
	}

	public Instant getEnRouteAt() {
		return enRouteAt;
	}

	public void setEnRouteAt(Instant enRouteAt) {
		this.enRouteAt = enRouteAt;
	}

	public Instant getInProgressAt() {
		return inProgressAt;
	}

	public void setInProgressAt(Instant inProgressAt) {
		this.inProgressAt = inProgressAt;
	}

	public Instant getCompletedAt() {
		return completedAt;
	}

	public void setCompletedAt(Instant completedAt) {
		this.completedAt = completedAt;
	}

	public Instant getDeclinedAt() {
		return declinedAt;
	}

	public void setDeclinedAt(Instant declinedAt) {
		this.declinedAt = declinedAt;
	}

	public Instant getCancelledAt() {
		return cancelledAt;
	}

	public void setCancelledAt(Instant cancelledAt) {
		this.cancelledAt = cancelledAt;
	}

	public Instant getCreatedAt() {
		return createdAt;
	}

	public Instant getUpdatedAt() {
		return updatedAt;
	}
}
