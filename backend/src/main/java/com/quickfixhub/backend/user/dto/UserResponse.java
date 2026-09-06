package com.quickfixhub.backend.user.dto;

import com.quickfixhub.backend.user.Role;
import com.quickfixhub.backend.user.User;

import java.util.UUID;

public record UserResponse(UUID id, String email, String fullName, String phone, Role role) {

	public static UserResponse from(User user) {
		return new UserResponse(user.getId(), user.getEmail(), user.getFullName(), user.getPhone(), user.getRole());
	}
}
