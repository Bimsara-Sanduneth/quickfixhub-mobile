package com.quickfixhub.backend.auth;

import com.quickfixhub.backend.user.User;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.springframework.stereotype.Service;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.time.Instant;
import java.util.Date;
import java.util.UUID;

@Service
public class JwtService {

	private final SecretKey key;
	private final JwtProperties properties;

	public JwtService(JwtProperties properties) {
		this.properties = properties;
		this.key = Keys.hmacShaKeyFor(properties.secret().getBytes(StandardCharsets.UTF_8));
	}

	public String generateAccessToken(User user) {
		Instant now = Instant.now();
		Instant expiry = now.plus(accessTokenTtl());
		return Jwts.builder()
				.subject(user.getId().toString())
				.claim("email", user.getEmail())
				.claim("role", user.getRole().name())
				.issuedAt(Date.from(now))
				.expiration(Date.from(expiry))
				.signWith(key)
				.compact();
	}

	public Claims parseAndValidate(String token) {
		return Jwts.parser()
				.verifyWith(key)
				.build()
				.parseSignedClaims(token)
				.getPayload();
	}

	public UUID extractUserId(Claims claims) {
		return UUID.fromString(claims.getSubject());
	}

	public Duration accessTokenTtl() {
		return Duration.ofMinutes(properties.accessTokenTtlMinutes());
	}

	public Duration refreshTokenTtl() {
		return Duration.ofDays(properties.refreshTokenTtlDays());
	}
}
