package com.quickfixhub.backend.auth;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.UUID;

public interface PasswordResetTokenRepository extends JpaRepository<PasswordResetToken, UUID> {

	Optional<PasswordResetToken> findByUserId(UUID userId);

	Optional<PasswordResetToken> findByUserEmail(String email);

	void deleteByUserId(UUID userId);
}
