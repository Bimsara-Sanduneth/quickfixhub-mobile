package com.quickfixhub.backend.provider.dto;

import com.quickfixhub.backend.provider.DocumentType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record UploadDocumentRequest(
		@NotNull DocumentType documentType,
		@NotBlank
		@Size(max = 3_000_000)
		@Pattern(regexp = "^data:image/(png|jpe?g|webp);base64,.+$", message = "must be a data:image/... base64 URI")
		String fileDataUri) {
}
