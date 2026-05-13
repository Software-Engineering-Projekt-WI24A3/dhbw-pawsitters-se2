package com.pawsitters.dto;

import jakarta.validation.constraints.NotNull;

public record ChatCreateRequest(
        @NotNull Long offerId
) {
}
