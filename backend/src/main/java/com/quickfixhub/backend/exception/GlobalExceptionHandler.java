package com.quickfixhub.backend.exception;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.ConstraintViolationException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.FieldError;
import org.springframework.web.ErrorResponse;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;

import java.util.stream.Collectors;

@RestControllerAdvice
public class GlobalExceptionHandler {

	private static final Logger log = LoggerFactory.getLogger(GlobalExceptionHandler.class);

	@ExceptionHandler(MethodArgumentNotValidException.class)
	public ResponseEntity<ApiError> handleValidation(MethodArgumentNotValidException ex, HttpServletRequest request) {
		String message = ex.getBindingResult().getFieldErrors().stream()
				.map(this::formatFieldError)
				.collect(Collectors.joining(", "));
		return build(HttpStatus.BAD_REQUEST, message.isBlank() ? ex.getMessage() : message, request);
	}

	@ExceptionHandler(ConstraintViolationException.class)
	public ResponseEntity<ApiError> handleConstraintViolation(ConstraintViolationException ex, HttpServletRequest request) {
		return build(HttpStatus.BAD_REQUEST, ex.getMessage(), request);
	}

	// A path/query parameter that fails to convert to its declared type (e.g. a non-UUID id) -
	// this does NOT implement ErrorResponse, so without an explicit handler it falls through to
	// the generic 500 branch below.
	@ExceptionHandler(MethodArgumentTypeMismatchException.class)
	public ResponseEntity<ApiError> handleTypeMismatch(MethodArgumentTypeMismatchException ex, HttpServletRequest request) {
		String expectedType = ex.getRequiredType() != null ? ex.getRequiredType().getSimpleName() : "the expected type";
		String message = "Parameter '" + ex.getName() + "' must be " + expectedType;
		return build(HttpStatus.BAD_REQUEST, message, request);
	}

	// Covers built-in Spring exceptions (NoResourceFoundException, ResponseStatusException,
	// HttpRequestMethodNotSupportedException, etc.) that carry their own status via ErrorResponse
	// rather than a dedicated exception class.
	@ExceptionHandler(Exception.class)
	public ResponseEntity<ApiError> handleException(Exception ex, HttpServletRequest request) {
		if (ex instanceof ErrorResponse errorResponse) {
			HttpStatus status = HttpStatus.valueOf(errorResponse.getStatusCode().value());
			String message = errorResponse.getBody().getDetail();
			return build(status, message != null ? message : status.getReasonPhrase(), request);
		}
		log.error("Unhandled exception while processing {} {}", request.getMethod(), request.getRequestURI(), ex);
		return build(HttpStatus.INTERNAL_SERVER_ERROR, "An unexpected error occurred", request);
	}

	private ResponseEntity<ApiError> build(HttpStatus status, String message, HttpServletRequest request) {
		ApiError body = ApiError.of(status.value(), status.getReasonPhrase(), message, request.getRequestURI());
		return ResponseEntity.status(status).body(body);
	}

	private String formatFieldError(FieldError error) {
		return error.getField() + ": " + error.getDefaultMessage();
	}
}
