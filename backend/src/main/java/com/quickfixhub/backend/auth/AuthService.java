package com.quickfixhub.backend.auth;

import com.quickfixhub.backend.auth.dto.AuthResponse;
import com.quickfixhub.backend.auth.dto.ForgotPasswordRequest;
import com.quickfixhub.backend.auth.dto.LoginRequest;
import com.quickfixhub.backend.auth.dto.RefreshRequest;
import com.quickfixhub.backend.auth.dto.RegisterRequest;
import com.quickfixhub.backend.auth.dto.ResetPasswordRequest;
import com.quickfixhub.backend.email.EmailService;
import com.quickfixhub.backend.user.Role;
import com.quickfixhub.backend.user.User;
import com.quickfixhub.backend.user.UserRepository;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;
import java.time.Duration;
import java.time.Instant;
import java.util.Base64;
import java.util.UUID;

@Service
@Transactional
public class AuthService {

	private final UserRepository userRepository;
	private final RefreshTokenRepository refreshTokenRepository;
	private final PasswordResetTokenRepository passwordResetTokenRepository;
	private final PasswordEncoder passwordEncoder;
	private final JwtService jwtService;
	private final LoginRateLimiter rateLimiter;
	private final PasswordResetRateLimiter passwordResetRateLimiter;
	private final PasswordResetProperties passwordResetProperties;
	private final EmailService emailService;
	private final SecureRandom secureRandom = new SecureRandom();
	// A valid-format hash with no matching password, checked when the account doesn't exist so
	// login takes the same time either way and an attacker can't enumerate emails via timing.
	private final String dummyPasswordHash;

	public AuthService(UserRepository userRepository, RefreshTokenRepository refreshTokenRepository,
			PasswordResetTokenRepository passwordResetTokenRepository, PasswordEncoder passwordEncoder,
			JwtService jwtService, LoginRateLimiter rateLimiter, PasswordResetRateLimiter passwordResetRateLimiter,
			PasswordResetProperties passwordResetProperties, EmailService emailService) {
		this.userRepository = userRepository;
		this.refreshTokenRepository = refreshTokenRepository;
		this.passwordResetTokenRepository = passwordResetTokenRepository;
		this.passwordEncoder = passwordEncoder;
		this.jwtService = jwtService;
		this.rateLimiter = rateLimiter;
		this.passwordResetRateLimiter = passwordResetRateLimiter;
		this.passwordResetProperties = passwordResetProperties;
		this.emailService = emailService;
		this.dummyPasswordHash = passwordEncoder.encode(UUID.randomUUID().toString());
	}

	public AuthResponse register(RegisterRequest request) {
		if (request.role() == Role.ADMIN) {
			throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Cannot self-register as ADMIN");
		}
		String email = request.email().toLowerCase();
		if (userRepository.existsByEmail(email)) {
			throw new ResponseStatusException(HttpStatus.CONFLICT, "Email is already registered");
		}
		User user = new User(email, passwordEncoder.encode(request.password()), request.fullName(), request.phone(),
				request.role());
		userRepository.save(user);
		emailService.sendWelcome(user.getEmail(), user.getFullName());
		return issueTokens(user);
	}

	public AuthResponse login(LoginRequest request, String clientIp) {
		String email = request.email().toLowerCase();
		if (rateLimiter.isBlocked(clientIp, email)) {
			throw new ResponseStatusException(HttpStatus.TOO_MANY_REQUESTS, "Too many login attempts. Try again later.");
		}
		User user = userRepository.findByEmail(email).orElse(null);
		String hashToCheck = user != null ? user.getPasswordHash() : dummyPasswordHash;
		boolean passwordMatches = passwordEncoder.matches(request.password(), hashToCheck);
		if (user == null || !user.isEnabled() || !passwordMatches) {
			rateLimiter.recordFailure(clientIp, email);
			throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid email or password");
		}
		rateLimiter.reset(clientIp, email);
		return issueTokens(user);
	}

	public AuthResponse refresh(RefreshRequest request) {
		RefreshToken stored = refreshTokenRepository.findByTokenHash(hash(request.refreshToken()))
				.filter(RefreshToken::isUsable)
				.orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid or expired refresh token"));
		// Rotation: the presented token is single-use, whether or not it was stolen.
		stored.revoke();
		return issueTokens(stored.getUser());
	}

	public void logout(RefreshRequest request) {
		refreshTokenRepository.findByTokenHash(hash(request.refreshToken())).ifPresent(RefreshToken::revoke);
	}

	// Always returns normally, whether or not the email belongs to an account - the caller (and
	// so any attacker) can't tell the difference. A code is only generated + emailed when the
	// account actually exists.
	public void forgotPassword(ForgotPasswordRequest request) {
		String email = request.email().toLowerCase();
		if (passwordResetRateLimiter.isBlocked(email)) {
			return;
		}
		passwordResetRateLimiter.recordRequest(email);

		userRepository.findByEmail(email).ifPresent(user -> {
			String code = generateNumericCode();
			String codeHash = passwordEncoder.encode(code);
			Instant expiresAt = Instant.now().plus(Duration.ofMinutes(passwordResetProperties.codeTtlMinutes()));
			PasswordResetToken token = passwordResetTokenRepository.findByUserId(user.getId())
					.map(existing -> {
						existing.reissue(codeHash, expiresAt);
						return existing;
					})
					.orElseGet(() -> new PasswordResetToken(user, codeHash, expiresAt));
			passwordResetTokenRepository.save(token);
			emailService.sendPasswordResetCode(user.getEmail(), user.getFullName(), code,
					passwordResetProperties.codeTtlMinutes());
		});
	}

	public void resetPassword(ResetPasswordRequest request) {
		String email = request.email().toLowerCase();
		// One generic message for every failure mode (unknown email, wrong code, expired,
		// too many attempts) - nothing here should confirm an email exists or how close a guess was.
		PasswordResetToken token = passwordResetTokenRepository.findByUserEmail(email)
				.orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid or expired reset code"));

		if (token.isExpired() || !token.hasAttemptsLeft(passwordResetProperties.maxVerifyAttempts())) {
			passwordResetTokenRepository.delete(token);
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid or expired reset code");
		}

		if (!passwordEncoder.matches(request.code(), token.getCodeHash())) {
			token.recordFailedAttempt();
			if (!token.hasAttemptsLeft(passwordResetProperties.maxVerifyAttempts())) {
				passwordResetTokenRepository.delete(token);
			} else {
				passwordResetTokenRepository.save(token);
			}
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid or expired reset code");
		}

		User user = token.getUser();
		user.setPasswordHash(passwordEncoder.encode(request.newPassword()));
		userRepository.save(user);
		passwordResetTokenRepository.delete(token);
		// A password reset ends every existing session - a refresh token stolen before the reset
		// must not survive it.
		refreshTokenRepository.revokeAllForUser(user.getId());
		emailService.sendPasswordChangedConfirmation(user.getEmail(), user.getFullName());
	}

	private AuthResponse issueTokens(User user) {
		String accessToken = jwtService.generateAccessToken(user);
		String rawRefreshToken = generateOpaqueToken();
		RefreshToken refreshToken = new RefreshToken(user, hash(rawRefreshToken),
				Instant.now().plus(jwtService.refreshTokenTtl()));
		refreshTokenRepository.save(refreshToken);
		return AuthResponse.of(accessToken, rawRefreshToken, jwtService.accessTokenTtl().toSeconds());
	}

	private String generateOpaqueToken() {
		byte[] bytes = new byte[32];
		secureRandom.nextBytes(bytes);
		return Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
	}

	// 6 digits, zero-padded - matches what the email and the mobile code field expect.
	private String generateNumericCode() {
		return String.format("%06d", secureRandom.nextInt(1_000_000));
	}

	// Refresh tokens are high-entropy random values (not user-chosen secrets), so a fast
	// cryptographic hash is appropriate here; BCrypt is reserved for passwords and the reset code.
	private String hash(String token) {
		try {
			MessageDigest digest = MessageDigest.getInstance("SHA-256");
			return Base64.getEncoder().encodeToString(digest.digest(token.getBytes(StandardCharsets.UTF_8)));
		} catch (NoSuchAlgorithmException e) {
			throw new IllegalStateException("SHA-256 not available", e);
		}
	}
}
