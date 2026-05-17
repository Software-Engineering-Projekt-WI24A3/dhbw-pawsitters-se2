package com.pawsitters.dto;

import jakarta.validation.constraints.NotNull;

import java.time.LocalDate;

public record AvailabilityCreateRequest(
        @NotNull LocalDate startDate,
        @NotNull LocalDate endDate
) {
}
