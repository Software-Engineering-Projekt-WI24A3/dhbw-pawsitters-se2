package com.pawsitters.dto;

import org.springframework.http.HttpStatus;

public record ApiResponse<T>(
        boolean success,
        int status,
        String message,
        T data,
        ApiError error,
        ApiMeta meta
) {
    public static <T> ApiResponse<T> success(HttpStatus status, String message, T data, String path) {
        return new ApiResponse<>(true, status.value(), message, data, null, ApiMeta.of(path));
    }

    public static <T> ApiResponse<T> success(HttpStatus status, String message, T data, String path, Integer total) {
        return new ApiResponse<>(true, status.value(), message, data, null, ApiMeta.of(path, total));
    }

    public static ApiResponse<Void> failure(HttpStatus status, String message, String code, String path) {
        return failure(status, message, ApiError.of(code), path);
    }

    public static ApiResponse<Void> failure(HttpStatus status, String message, ApiError error, String path) {
        return new ApiResponse<>(false, status.value(), message, null, error, ApiMeta.of(path));
    }
}
