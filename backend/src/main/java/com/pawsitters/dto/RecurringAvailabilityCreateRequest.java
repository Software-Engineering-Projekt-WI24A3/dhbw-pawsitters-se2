package com.pawsitters.dto;

import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;

import java.time.DayOfWeek;
import java.time.LocalDate;
import java.util.Set;

public record RecurringAvailabilityCreateRequest(
        @NotNull LocalDate startDate,
        @NotNull LocalDate endDate,
        @NotEmpty Set<@NotNull DayOfWeek> daysOfWeek
) {
}
