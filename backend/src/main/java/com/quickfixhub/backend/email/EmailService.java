package com.quickfixhub.backend.email;

import jakarta.mail.internet.MimeMessage;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

// Every send is @Async and best-effort: a dead SMTP server, a bad address, or a transient
// failure is logged and swallowed, never propagated back into the request that triggered it
// (a booking must not fail because a receipt email bounced). Running off the request thread also
// keeps the forgot-password endpoint's response time identical whether or not the account
// exists - a synchronous send would leak that via timing.
//
// When no SMTP transport is configured (no `spring.mail.host`), JavaMailSender isn't created and
// messages are logged instead, so local dev works with nothing running.
@Service
public class EmailService {

	private static final Logger log = LoggerFactory.getLogger(EmailService.class);

	private final ObjectProvider<JavaMailSender> mailSenderProvider;
	private final MailProperties properties;

	public EmailService(ObjectProvider<JavaMailSender> mailSenderProvider, MailProperties properties) {
		this.mailSenderProvider = mailSenderProvider;
		this.properties = properties;
	}

	@Async
	public void sendWelcome(String to, String fullName) {
		String body = wrap("Welcome aboard",
				"<p>Hi " + escape(firstName(fullName)) + ",</p>"
						+ "<p>Your QuickFixHub account is ready. You can now book trusted local pros - "
						+ "or, if you signed up as a provider, start taking jobs once your business profile is set up.</p>");
		deliver(to, "Welcome to QuickFixHub", body);
	}

	@Async
	public void sendPasswordResetCode(String to, String fullName, String code, long ttlMinutes) {
		String body = wrap("Reset your password",
				"<p>Hi " + escape(firstName(fullName)) + ",</p>"
						+ "<p>Use this code to reset your QuickFixHub password:</p>"
						+ "<p style=\"font-size:30px;font-weight:800;letter-spacing:6px;margin:20px 0;\">" + escape(code) + "</p>"
						+ "<p>It expires in " + ttlMinutes + " minutes. If you didn't ask to reset your password, "
						+ "you can ignore this email - your password won't change.</p>");
		deliver(to, "Your QuickFixHub password reset code", body);
	}

	@Async
	public void sendPasswordChangedConfirmation(String to, String fullName) {
		String body = wrap("Password changed",
				"<p>Hi " + escape(firstName(fullName)) + ",</p>"
						+ "<p>Your QuickFixHub password was just changed. If this was you, no action is needed.</p>"
						+ "<p>If it wasn't, someone may have access to your email - reset your password again and "
						+ "secure your inbox.</p>");
		deliver(to, "Your QuickFixHub password was changed", body);
	}

	private void deliver(String to, String subject, String htmlBody) {
		JavaMailSender sender = mailSenderProvider.getIfAvailable();
		if (sender == null) {
			log.info("SMTP not configured - would have sent email to {} | subject: {}", to, subject);
			return;
		}
		try {
			MimeMessage message = sender.createMimeMessage();
			MimeMessageHelper helper = new MimeMessageHelper(message, "UTF-8");
			helper.setFrom(properties.from(), properties.fromName());
			helper.setTo(to);
			helper.setSubject(subject);
			helper.setText(htmlBody, true);
			sender.send(message);
			log.info("Sent email to {} | subject: {}", to, subject);
		} catch (Exception e) {
			log.error("Failed to send email to {} | subject: {}", to, subject, e);
		}
	}

	private String wrap(String heading, String innerHtml) {
		return "<!doctype html><html><body style=\"margin:0;background:#f3f2f2;font-family:Arial,Helvetica,sans-serif;color:#201e1d;\">"
				+ "<div style=\"max-width:520px;margin:0 auto;padding:32px 24px;\">"
				+ "<div style=\"font-weight:800;font-size:15px;letter-spacing:1px;color:#ec3013;\">QUICKFIXHUB</div>"
				+ "<h1 style=\"font-size:22px;margin:16px 0;\">" + escape(heading) + "</h1>"
				+ "<div style=\"font-size:14px;line-height:1.5;\">" + innerHtml + "</div>"
				+ "<p style=\"font-size:12px;color:#7d7979;margin-top:32px;\">QuickFixHub &middot; this is an automated message, please don't reply.</p>"
				+ "</div></body></html>";
	}

	private String firstName(String fullName) {
		if (fullName == null || fullName.isBlank()) {
			return "there";
		}
		return fullName.trim().split("\\s+")[0];
	}

	private String escape(String value) {
		if (value == null) {
			return "";
		}
		return value.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;").replace("\"", "&quot;");
	}
}
