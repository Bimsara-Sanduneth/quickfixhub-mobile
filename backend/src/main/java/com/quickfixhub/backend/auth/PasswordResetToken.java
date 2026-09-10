package com.quickfixhub.backend.auth;

import com.quickfixhub.backend.user.User;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.OneToOne;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;

import java.time.Instant;
import java.util.UUID;

// At most one row per user (user_id is UNIQUE) - a fresh forgot-password request overwrites the
// previous code. Deleted outright once used or exhausted, so a row existing means "a code is
// currently outstanding for this account".
@Entity
@Table(name = "password_reset_tokens")
public class PasswordResetToken {

	@Id
	@GeneratedValue(strategy = GenerationType.UUID)
	private UUID id;

	@OneToOne(optional = false)
	@JoinColumn(name = "user_id", nullable = false, unique = true)
	private User user;

	@Column(name = "code_hash", nullable = false)
	private String codeHash;

	@Column(name = "expires_at", nullable = false)
	private Instant expiresAt;

	@Column(nullable = false)
	private int attempts = 0;

	@Column(name = "created_at", nullable = false)
	private Instant createdAt;

	protected PasswordResetToken() {
	}

	public PasswordResetToken(User user, String codeHash, Instant expiresAt) {
		this.user = user;
		this.codeHash = codeHash;
		this.expiresAt = expiresAt;
	}

	@PrePersist
	void onCreate() {
		createdAt = Instant.now();
	}

	// Replaces the outstanding code for this user in place (the row is reused rather than
	// deleted+reinserted, which would trip the user_id UNIQUE constraint on Hibernate's
	// insert-before-delete flush order).
	public void reissue(String codeHash, Instant expiresAt) {
		this.codeHash = codeHash;
		this.expiresAt = expiresAt;
		this.attempts = 0;
	}

	public boolean isExpired() {
		return expiresAt.isBefore(Instant.now());
	}

	public boolean hasAttemptsLeft(int maxAttempts) {
		return attempts < maxAttempts;
	}

	public void recordFailedAttempt() {
		attempts++;
	}

	public UUID getId() {
		return id;
	}

	public User getUser() {
		return user;
	}

	public String getCodeHash() {
		return codeHash;
	}

	public Instant getExpiresAt() {
		return expiresAt;
	}

	public int getAttempts() {
		return attempts;
	}

	public Instant getCreatedAt() {
		return createdAt;
	}
}
