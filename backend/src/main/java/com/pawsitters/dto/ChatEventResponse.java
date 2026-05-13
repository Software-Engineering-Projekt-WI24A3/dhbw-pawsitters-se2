package com.pawsitters.dto;

import java.time.Instant;

public record ChatEventResponse(
        String type,
        Long chatId,
        ChatMessageResponse message,
        Instant timestamp
) {
    public static ChatEventResponse of(String type, ChatMessageResponse message) {
        return new ChatEventResponse(type, message.chatId(), message, Instant.now());
    }
}
