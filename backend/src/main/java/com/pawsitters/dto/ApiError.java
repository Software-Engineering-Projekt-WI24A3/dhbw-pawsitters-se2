package com.pawsitters.dto;

import java.util.List;

public record ApiError(
        String code,
        List<FieldErrorDetail> details
) {
    public static ApiError of(String code) {
        return new ApiError(code, List.of());
    }

    public static ApiError of(String code, List<FieldErrorDetail> details) {
        return new ApiError(code, details == null ? List.of() : details);
    }
}
