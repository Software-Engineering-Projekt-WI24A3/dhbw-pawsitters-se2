package com.pawsitters.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

public record UserRatingRequest(
        @NotNull @Min(1) @Max(5) Integer rating
) {
}
