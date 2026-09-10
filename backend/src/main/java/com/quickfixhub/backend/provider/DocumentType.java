package com.quickfixhub.backend.provider;

public enum DocumentType {
	NATIONAL_ID(true),
	TRADE_LICENSE(true),
	INSURANCE(false),
	PROOF_OF_ADDRESS(false);

	private final boolean required;

	DocumentType(boolean required) {
		this.required = required;
	}

	// Identity + business legitimacy are the two AdminVerificationController.verify() actually
	// gates on - insurance and proof of address are still requestable/reviewable but never block
	// approval on their own.
	public boolean isRequired() {
		return required;
	}
}
