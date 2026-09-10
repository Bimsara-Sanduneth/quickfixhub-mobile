package com.quickfixhub.backend.auth;

import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Component;

import java.time.Duration;

// Per-email cap on forgot-password requests, so the endpoint can't be used to spam someone's
// inbox (or to grind through reset codes by requesting a fresh one each time). Keyed by email
// only - unlike LoginRateLimiter there's no IP component, since the abuse target is the inbox
// owner and a code request reveals nothing about the caller.
@Component
public class PasswordResetRateLimiter {

	private static final String KEY_PREFIX = "auth:pwreset:requests:";

	private final StringRedisTemplate redisTemplate;
	private final PasswordResetProperties properties;

	public PasswordResetRateLimiter(StringRedisTemplate redisTemplate, PasswordResetProperties properties) {
		this.redisTemplate = redisTemplate;
		this.properties = properties;
	}

	public boolean isBlocked(String email) {
		String raw = redisTemplate.opsForValue().get(key(email));
		int requests = raw != null ? Integer.parseInt(raw) : 0;
		return requests >= properties.maxRequestsPerWindow();
	}

	public void recordRequest(String email) {
		String key = key(email);
		Long requests = redisTemplate.opsForValue().increment(key);
		if (requests != null && requests == 1L) {
			redisTemplate.expire(key, Duration.ofMinutes(properties.requestWindowMinutes()));
		}
	}

	private String key(String email) {
		return KEY_PREFIX + email.toLowerCase();
	}
}
