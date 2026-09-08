package com.quickfixhub.backend.payment;

import com.quickfixhub.backend.booking.Booking;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.OneToOne;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

// A mocked payment ledger, not a real charge - no gateway is wired up (see the roadmap's
// "payments" decision). One row is created automatically the moment a booking reaches COMPLETED
// (PaymentService), always PAID for the full booking price - there's no "pending" or "failed"
// state to model since nothing can actually fail here. Exists so 2p can show a receipt and 2w
// (admin) has something real to refund - the schema is meant to survive a real gateway
// replacing just the "how does PAID happen" part later.
@Entity
@Table(name = "payments")
public class Payment {

	@Id
	@GeneratedValue(strategy = GenerationType.UUID)
	private UUID id;

	@OneToOne(optional = false)
	@JoinColumn(name = "booking_id", nullable = false, unique = true)
	private Booking booking;

	@Column(nullable = false)
	private BigDecimal amount;

	@Enumerated(EnumType.STRING)
	@Column(nullable = false)
	private PaymentStatus status;

	@Column(nullable = false)
	private String method = "MOCK";

	@Column(name = "paid_at", nullable = false)
	private Instant paidAt;

	@Column(name = "refund_amount")
	private BigDecimal refundAmount;

	@Column(name = "refund_reason", length = 500)
	private String refundReason;

	@Column(name = "refunded_at")
	private Instant refundedAt;

	@Column(name = "created_at", nullable = false)
	private Instant createdAt;

	protected Payment() {
	}

	public Payment(Booking booking, BigDecimal amount) {
		this.booking = booking;
		this.amount = amount;
		this.status = PaymentStatus.PAID;
		this.paidAt = Instant.now();
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

	public BigDecimal getAmount() {
		return amount;
	}

	public PaymentStatus getStatus() {
		return status;
	}

	public void setStatus(PaymentStatus status) {
		this.status = status;
	}

	public String getMethod() {
		return method;
	}

	public Instant getPaidAt() {
		return paidAt;
	}

	public BigDecimal getRefundAmount() {
		return refundAmount;
	}

	public void setRefundAmount(BigDecimal refundAmount) {
		this.refundAmount = refundAmount;
	}

	public String getRefundReason() {
		return refundReason;
	}

	public void setRefundReason(String refundReason) {
		this.refundReason = refundReason;
	}

	public Instant getRefundedAt() {
		return refundedAt;
	}

	public void setRefundedAt(Instant refundedAt) {
		this.refundedAt = refundedAt;
	}

	public Instant getCreatedAt() {
		return createdAt;
	}
}
