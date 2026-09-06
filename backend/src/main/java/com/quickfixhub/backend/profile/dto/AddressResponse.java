package com.quickfixhub.backend.profile.dto;

import com.quickfixhub.backend.profile.Address;

import java.util.UUID;

public record AddressResponse(UUID id, String label, String addressText) {

	public static AddressResponse from(Address address) {
		return new AddressResponse(address.getId(), address.getLabel(), address.getAddressText());
	}
}
