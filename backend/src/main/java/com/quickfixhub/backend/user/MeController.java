package com.quickfixhub.backend.user;

import com.quickfixhub.backend.user.dto.UserResponse;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import java.util.UUID;

@RestController
public class MeController {

	private final UserRepository userRepository;

	public MeController(UserRepository userRepository) {
		this.userRepository = userRepository;
	}

	@GetMapping("/me")
	public UserResponse getCurrentUser(@AuthenticationPrincipal UUID userId) {
		User user = userRepository.findById(userId)
				.orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));
		return UserResponse.from(user);
	}
}
