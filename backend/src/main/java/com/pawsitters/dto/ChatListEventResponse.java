package com.pawsitters.dto;

import java.time.Instant;

public record ChatListEventResponse(
        String type,
        ChatResponse chat,
        Instant timestamp
) {
    public static ChatListEventResponse of(String type, ChatResponse chat) {
        return new ChatListEventResponse(type, chat, Instant.now());
    }
}
