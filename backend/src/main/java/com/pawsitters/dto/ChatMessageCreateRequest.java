package com.pawsitters.dto;

import jakarta.validation.constraints.Size;

public record ChatMessageCreateRequest(
        @Size(max = 2000, message = "Nachrichten duerfen hoechstens 2000 Zeichen lang sein.")
        String content
) {
}
