package com.quickfixhub.backend.auth;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;
import java.util.UUID;

public interface RefreshTokenRepository extends JpaRepository<RefreshToken, UUID> {

	Optional<RefreshToken> findByTokenHash(String tokenHash);

	// Bulk revoke every live session for a user - used after a password reset so a stolen refresh
	// token can't outlive the password it was issued under. Bypasses the persistence context
	// (@Modifying), so it must run inside a transaction - AuthService is @Transactional.
	@Modifying
	@Query("update RefreshToken t set t.revoked = true where t.user.id = :userId and t.revoked = false")
	void revokeAllForUser(@Param("userId") UUID userId);
}
