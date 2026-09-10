package com.quickfixhub.backend.auth;

import com.quickfixhub.backend.auth.dto.AuthResponse;
import com.quickfixhub.backend.auth.dto.ForgotPasswordRequest;
import com.quickfixhub.backend.auth.dto.LoginRequest;
import com.quickfixhub.backend.auth.dto.RefreshRequest;
import com.quickfixhub.backend.auth.dto.RegisterRequest;
import com.quickfixhub.backend.auth.dto.ResetPasswordRequest;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/auth")
public class AuthController {

	private final AuthService authService;

	public AuthController(AuthService authService) {
		this.authService = authService;
	}

	@PostMapping("/register")
	@ResponseStatus(HttpStatus.CREATED)
	public AuthResponse register(@Valid @RequestBody RegisterRequest request) {
		return authService.register(request);
	}

	@PostMapping("/login")
	public AuthResponse login(@Valid @RequestBody LoginRequest request, HttpServletRequest servletRequest) {
		return authService.login(request, clientIp(servletRequest));
	}

	@PostMapping("/refresh")
	public AuthResponse refresh(@Valid @RequestBody RefreshRequest request) {
		return authService.refresh(request);
	}

	@PostMapping("/logout")
	public ResponseEntity<Void> logout(@Valid @RequestBody RefreshRequest request) {
		authService.logout(request);
		return ResponseEntity.noContent().build();
	}

	// Always 204, whether or not the email is registered - see AuthService.forgotPassword.
	@PostMapping("/forgot-password")
	@ResponseStatus(HttpStatus.NO_CONTENT)
	public void forgotPassword(@Valid @RequestBody ForgotPasswordRequest request) {
		authService.forgotPassword(request);
	}

	@PostMapping("/reset-password")
	@ResponseStatus(HttpStatus.NO_CONTENT)
	public void resetPassword(@Valid @RequestBody ResetPasswordRequest request) {
		authService.resetPassword(request);
	}

	// TODO: once a reverse proxy/load balancer sits in front (see AWS deployment in README),
	// resolve the client IP from a trusted forwarded header instead of the raw socket address.
	private String clientIp(HttpServletRequest request) {
		return request.getRemoteAddr();
	}
}
