package com.quickfixhub.backend.messaging;

import com.quickfixhub.backend.booking.Booking;
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

// A booking IS the conversation thread here - there's no separate Conversation entity, since
// every booking already ties exactly one customer to one provider profile. Chat before any
// booking exists (e.g. asking a question first) isn't supported yet.
@Entity
@Table(name = "messages")
public class Message {

	@Id
	@GeneratedValue(strategy = GenerationType.UUID)
	private UUID id;

	@ManyToOne(optional = false)
	@JoinColumn(name = "booking_id", nullable = false)
	private Booking booking;

	@ManyToOne(optional = false)
	@JoinColumn(name = "sender_id", nullable = false)
	private User sender;

	@Column(nullable = false, length = 2000)
	private String body;

	@Column(name = "created_at", nullable = false)
	private Instant createdAt;

	protected Message() {
	}

	public Message(Booking booking, User sender, String body) {
		this.booking = booking;
		this.sender = sender;
		this.body = body;
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

	public User getSender() {
		return sender;
	}

	public String getBody() {
		return body;
	}

	public Instant getCreatedAt() {
		return createdAt;
	}
}
