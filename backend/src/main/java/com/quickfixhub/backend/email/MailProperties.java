package com.quickfixhub.backend.email;

import org.springframework.boot.context.properties.ConfigurationProperties;

// `from` / `from-name` are this app's own sender identity - separate from spring.mail.* which is
// the transport (host/port/credentials of the SMTP server we hand messages to).
@ConfigurationProperties(prefix = "app.mail")
public record MailProperties(String from, String fromName) {
}
