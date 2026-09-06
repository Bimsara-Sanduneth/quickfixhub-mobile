package com.quickfixhub.backend.auth;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "app.login-rate-limit")
public record LoginRateLimitProperties(int maxAttempts, long windowMinutes) {
}
