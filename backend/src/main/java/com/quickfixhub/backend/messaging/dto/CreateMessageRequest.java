package com.quickfixhub.backend.messaging.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record CreateMessageRequest(@NotBlank @Size(max = 2000) String body) {
}
