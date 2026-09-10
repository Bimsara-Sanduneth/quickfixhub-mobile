package com.quickfixhub.backend.auth;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "app.password-reset")
public record PasswordResetProperties(
		long codeTtlMinutes,
		int maxVerifyAttempts,
		int maxRequestsPerWindow,
		long requestWindowMinutes) {
}
