package com.pawsitters.dto;

import com.pawsitters.model.HostAvailability;

import java.time.DayOfWeek;
import java.time.Instant;
import java.time.LocalDate;
import java.util.Set;
import java.util.TreeSet;

public record AvailabilityResponse(
        Long id,
        Long hostId,
        LocalDate startDate,
        LocalDate endDate,
        boolean recurring,
        Set<DayOfWeek> daysOfWeek,
        Instant createdAt
) {
    public static AvailabilityResponse from(HostAvailability availability) {
        return new AvailabilityResponse(
                availability.getId(),
                availability.getHost().getId(),
                availability.getStartDate(),
                availability.getEndDate(),
                availability.isRecurring(),
                new TreeSet<>(availability.getDaysOfWeek()),
                availability.getCreatedAt()
        );
    }
}
