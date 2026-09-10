package com.quickfixhub.backend.admin.dto;

import com.quickfixhub.backend.provider.DocumentStatus;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record AdminDocumentReviewRequest(@NotNull DocumentStatus status, @Size(max = 500) String reviewNote) {
}
