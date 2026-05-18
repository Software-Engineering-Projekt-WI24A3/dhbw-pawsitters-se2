package com.pawsitters.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record ReviewCreateRequest(
        @NotNull Long bookingId,
        @NotNull @Min(1) @Max(5) Integer rating,
        @Min(1) @Max(5) Integer communicationRating,
        @Min(1) @Max(5) Integer reliabilityRating,
        @Min(1) @Max(5) Integer careRating,
        @Size(max = 1000) String comment
) {
}
