package com.quickfixhub.backend.user.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record UpdatePhotoRequest(
		@NotBlank
		// ~3MB of base64 - the mobile client compresses/resizes before upload, this is just a
		// backstop against something absurd landing in the database.
		@Size(max = 3_000_000)
		@Pattern(regexp = "^data:image/(png|jpe?g|webp);base64,.+$", message = "must be a data:image/... base64 URI")
		String photoDataUri) {
}
