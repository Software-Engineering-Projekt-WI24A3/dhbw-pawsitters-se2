package com.pawsitters.dto;

import com.pawsitters.model.Chat;

import java.time.Instant;

public record ChatResponse(
        Long id,
        Long offerId,
        String offerTitle,
        Long hostId,
        String hostFirstName,
        String hostLastName,
        Long requesterId,
        String requesterFirstName,
        String requesterLastName,
        Instant createdAt,
        Instant lastMessageAt,
        Instant closedAt,
        Long closedByUserId,
        String lastMessagePreview
) {
    public static ChatResponse from(Chat chat, String lastMessagePreview) {
        return new ChatResponse(
                chat.getId(),
                chat.getOffer().getId(),
                chat.getOffer().getTitle(),
                chat.getHost().getId(),
                chat.getHost().getFirstName(),
                chat.getHost().getLastName(),
                chat.getRequester().getId(),
                chat.getRequester().getFirstName(),
                chat.getRequester().getLastName(),
                chat.getCreatedAt(),
                chat.getLastMessageAt(),
                chat.getClosedAt(),
                chat.getClosedByUser() == null ? null : chat.getClosedByUser().getId(),
                lastMessagePreview
        );
    }
}
