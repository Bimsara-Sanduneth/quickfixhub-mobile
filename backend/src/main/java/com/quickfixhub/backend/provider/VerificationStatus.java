package com.quickfixhub.backend.provider;

// PENDING is also where a rejected/needs-more-docs provider lands back after "request docs" -
// there's deliberately no fourth state for that; the provider-facing message (providerMessage on
// ProviderProfile) is what distinguishes "never reviewed yet" from "sent back with feedback".
public enum VerificationStatus {
	PENDING,
	APPROVED,
	REJECTED
}
