package com.quickfixhub.backend.admin.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

// Used for both /reject and /request-docs - a reason is required either way so the provider
// always sees why, whether their application was turned down or just needs another document.
public record AdminDecisionRequest(@NotBlank @Size(max = 1000) String reason) {
}
