package com.quickfixhub.backend.auth;

import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Component;

import java.time.Duration;

@Component
public class LoginRateLimiter {

	private static final String KEY_PREFIX = "auth:login:attempts:";

	private final StringRedisTemplate redisTemplate;
	private final LoginRateLimitProperties properties;

	public LoginRateLimiter(StringRedisTemplate redisTemplate, LoginRateLimitProperties properties) {
		this.redisTemplate = redisTemplate;
		this.properties = properties;
	}

	public boolean isBlocked(String ip, String email) {
		String raw = redisTemplate.opsForValue().get(key(ip, email));
		int attempts = raw != null ? Integer.parseInt(raw) : 0;
		return attempts >= properties.maxAttempts();
	}

	public void recordFailure(String ip, String email) {
		String key = key(ip, email);
		Long attempts = redisTemplate.opsForValue().increment(key);
		if (attempts != null && attempts == 1L) {
			redisTemplate.expire(key, Duration.ofMinutes(properties.windowMinutes()));
		}
	}

	public void reset(String ip, String email) {
		redisTemplate.delete(key(ip, email));
	}

	private String key(String ip, String email) {
		return KEY_PREFIX + ip + ":" + email.toLowerCase();
	}
}
