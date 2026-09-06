package com.quickfixhub.backend.auth.dto;

import com.quickfixhub.backend.user.Role;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record RegisterRequest(
		@NotBlank @Email String email,
		@NotBlank @Size(min = 8, max = 72) String password,
		@NotBlank @Size(max = 255) String fullName,
		// Loose on purpose: international formats vary too much for a strict pattern here.
		@Pattern(regexp = "^[+0-9 ()-]{7,32}$", message = "must be a valid phone number") String phone,
		@NotNull Role role) {
}
