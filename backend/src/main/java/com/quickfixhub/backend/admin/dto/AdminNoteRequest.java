package com.quickfixhub.backend.admin.dto;

import jakarta.validation.constraints.Size;

// Internal-only - never shown to the provider. Blank/null clears the note, unlike
// AdminDecisionRequest's reason which is always required.
public record AdminNoteRequest(@Size(max = 2000) String note) {
}
