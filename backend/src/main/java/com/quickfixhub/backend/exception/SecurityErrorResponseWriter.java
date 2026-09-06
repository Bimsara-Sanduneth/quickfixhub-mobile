package com.quickfixhub.backend.exception;

import jakarta.servlet.http.HttpServletResponse;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import tools.jackson.databind.ObjectMapper;

import java.io.IOException;

final class SecurityErrorResponseWriter {

	private SecurityErrorResponseWriter() {
	}

	static void write(HttpServletResponse response, ObjectMapper objectMapper, HttpStatus status,
			String message, String path) throws IOException {
		ApiError body = ApiError.of(status.value(), status.getReasonPhrase(), message, path);
		response.setStatus(status.value());
		response.setContentType(MediaType.APPLICATION_JSON_VALUE);
		objectMapper.writeValue(response.getWriter(), body);
	}
}
