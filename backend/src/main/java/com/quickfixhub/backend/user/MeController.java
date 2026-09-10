package com.quickfixhub.backend.user;

import com.quickfixhub.backend.user.dto.UpdatePhotoRequest;
import com.quickfixhub.backend.user.dto.UserResponse;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
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
		return UserResponse.from(requireUser(userId));
	}

	// Stored as a data: URI directly on the row - see User.photoDataUri. No object storage exists
	// in this project yet.
	@PutMapping("/me/photo")
	public UserResponse updatePhoto(@AuthenticationPrincipal UUID userId, @Valid @RequestBody UpdatePhotoRequest request) {
		User user = requireUser(userId);
		user.setPhotoDataUri(request.photoDataUri());
		return UserResponse.from(userRepository.save(user));
	}

	@DeleteMapping("/me/photo")
	public UserResponse deletePhoto(@AuthenticationPrincipal UUID userId) {
		User user = requireUser(userId);
		user.setPhotoDataUri(null);
		return UserResponse.from(userRepository.save(user));
	}

	@PutMapping("/me/cover-photo")
	public UserResponse updateCoverPhoto(@AuthenticationPrincipal UUID userId, @Valid @RequestBody UpdatePhotoRequest request) {
		User user = requireUser(userId);
		user.setCoverPhotoDataUri(request.photoDataUri());
		return UserResponse.from(userRepository.save(user));
	}

	@DeleteMapping("/me/cover-photo")
	public UserResponse deleteCoverPhoto(@AuthenticationPrincipal UUID userId) {
		User user = requireUser(userId);
		user.setCoverPhotoDataUri(null);
		return UserResponse.from(userRepository.save(user));
	}

	private User requireUser(UUID userId) {
		return userRepository.findById(userId)
				.orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));
	}
}
