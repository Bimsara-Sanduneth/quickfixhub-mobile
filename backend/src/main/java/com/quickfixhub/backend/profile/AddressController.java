package com.quickfixhub.backend.profile;

import com.quickfixhub.backend.profile.dto.AddressResponse;
import com.quickfixhub.backend.profile.dto.CreateAddressRequest;
import com.quickfixhub.backend.user.UserRepository;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.UUID;

// Scoped to the caller's own addresses via /me rather than /users/{id}/addresses so there's no
// id in the path to spoof - the standard IDOR-avoidance shape for "my own resource" endpoints.
@RestController
@RequestMapping("/me/addresses")
public class AddressController {

	private final AddressRepository addressRepository;
	private final UserRepository userRepository;

	public AddressController(AddressRepository addressRepository, UserRepository userRepository) {
		this.addressRepository = addressRepository;
		this.userRepository = userRepository;
	}

	@GetMapping
	public List<AddressResponse> listAddresses(@AuthenticationPrincipal UUID userId) {
		return addressRepository.findByUserIdOrderByCreatedAtAsc(userId).stream()
				.map(AddressResponse::from)
				.toList();
	}

	@PostMapping
	@ResponseStatus(HttpStatus.CREATED)
	public AddressResponse addAddress(@AuthenticationPrincipal UUID userId, @Valid @RequestBody CreateAddressRequest request) {
		Address address = new Address(userRepository.getReferenceById(userId), request.label(), request.addressText());
		return AddressResponse.from(addressRepository.save(address));
	}
}
