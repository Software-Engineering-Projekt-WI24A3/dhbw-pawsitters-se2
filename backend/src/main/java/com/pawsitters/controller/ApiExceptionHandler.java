package com.pawsitters.controller;

import com.pawsitters.dto.ApiError;
import com.pawsitters.dto.ApiResponse;
import com.pawsitters.dto.FieldErrorDetail;
import com.pawsitters.exception.ForbiddenException;
import com.pawsitters.exception.NotFoundException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.ConstraintViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.core.AuthenticationException;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.server.ResponseStatusException;

import java.util.ArrayList;
import java.util.List;

@RestControllerAdvice
public class ApiExceptionHandler {

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ApiResponse<Void>> handleValidation(MethodArgumentNotValidException ex,
                                                              HttpServletRequest request) {
        List<FieldErrorDetail> details = new ArrayList<>();
        for (FieldError fieldError : ex.getBindingResult().getFieldErrors()) {
            details.add(new FieldErrorDetail(fieldError.getField(), fieldError.getDefaultMessage()));
        }
        return error(
                HttpStatus.BAD_REQUEST,
                "Validation failed.",
                ApiError.of("VALIDATION_FAILED", details),
                request
        );
    }

    @ExceptionHandler(ConstraintViolationException.class)
    public ResponseEntity<ApiResponse<Void>> handleConstraintViolation(ConstraintViolationException ex,
                                                                       HttpServletRequest request) {
        List<FieldErrorDetail> details = ex.getConstraintViolations().stream()
                .map(violation -> {
                    String field = violation.getPropertyPath() != null
                            ? violation.getPropertyPath().toString()
                            : "request";
                    if (field == null || field.isBlank()) {
                        field = "request";
                    }
                    return new FieldErrorDetail(field, violation.getMessage());
                })
                .toList();

        return error(
                HttpStatus.BAD_REQUEST,
                "Validation failed.",
                ApiError.of("VALIDATION_FAILED", details),
                request
        );
    }

    @ExceptionHandler(HttpMessageNotReadableException.class)
    public ResponseEntity<ApiResponse<Void>> handleBadPayload(HttpMessageNotReadableException ex,
                                                              HttpServletRequest request) {
        FieldErrorDetail detail = new FieldErrorDetail("request", ex.getMostSpecificCause().getMessage());
        return error(
                HttpStatus.BAD_REQUEST,
                "Malformed request payload.",
                ApiError.of("MALFORMED_REQUEST", List.of(detail)),
                request
        );
    }

    @ExceptionHandler(BadCredentialsException.class)
    public ResponseEntity<ApiResponse<Void>> handleBadCredentials(BadCredentialsException ex,
                                                                  HttpServletRequest request) {
        return error(
                HttpStatus.UNAUTHORIZED,
                "Ungültige Credentials.",
                ApiError.of("AUTH_INVALID_CREDENTIALS"),
                request
        );
    }

    @ExceptionHandler(AuthenticationException.class)
    public ResponseEntity<ApiResponse<Void>> handleAuthentication(AuthenticationException ex,
                                                                 HttpServletRequest request) {
        return error(
                HttpStatus.UNAUTHORIZED,
                "Authentication required.",
                ApiError.of("AUTH_REQUIRED"),
                request
        );
    }

    @ExceptionHandler(AccessDeniedException.class)
    public ResponseEntity<ApiResponse<Void>> handleAccessDenied(AccessDeniedException ex,
                                                                HttpServletRequest request) {
        return error(
                HttpStatus.FORBIDDEN,
                "Access denied.",
                ApiError.of("ACCESS_DENIED"),
                request
        );
    }

    @ExceptionHandler(NotFoundException.class)
    public ResponseEntity<ApiResponse<Void>> handleNotFound(NotFoundException ex,
                                                            HttpServletRequest request) {
        return error(HttpStatus.NOT_FOUND, ex.getMessage(), ApiError.of("NOT_FOUND"), request);
    }

    @ExceptionHandler(ForbiddenException.class)
    public ResponseEntity<ApiResponse<Void>> handleForbidden(ForbiddenException ex,
                                                             HttpServletRequest request) {
        return error(HttpStatus.FORBIDDEN, ex.getMessage(), ApiError.of("ACCESS_DENIED"), request);
    }

    @ExceptionHandler(ResponseStatusException.class)
    public ResponseEntity<ApiResponse<Void>> handleResponseStatus(ResponseStatusException ex,
                                                                  HttpServletRequest request) {
        HttpStatus status = HttpStatus.valueOf(ex.getStatusCode().value());
        String message = ex.getReason() == null || ex.getReason().isBlank()
                ? status.getReasonPhrase()
                : ex.getReason();
        return error(status, message, ApiError.of(status.name()), request);
    }

    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<ApiResponse<Void>> handleIllegalArgument(IllegalArgumentException ex,
                                                                  HttpServletRequest request) {
        return error(HttpStatus.BAD_REQUEST, ex.getMessage(), ApiError.of("BAD_REQUEST"), request);
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<ApiResponse<Void>> handleUnexpected(Exception ex,
                                                             HttpServletRequest request) {
        return error(
                HttpStatus.INTERNAL_SERVER_ERROR,
                "Internal server error.",
                ApiError.of("INTERNAL_ERROR"),
                request
        );
    }

    private ResponseEntity<ApiResponse<Void>> error(HttpStatus status,
                                                    String message,
                                                    ApiError apiError,
                                                    HttpServletRequest request) {
        return ResponseEntity.status(status).body(ApiResponse.failure(
                status,
                message,
                apiError,
                request.getRequestURI()
        ));
    }
}
