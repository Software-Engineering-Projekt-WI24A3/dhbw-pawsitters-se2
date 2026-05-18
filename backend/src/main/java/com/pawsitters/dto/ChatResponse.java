package com.pawsitters.dto;

import com.pawsitters.model.Chat;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;

public record ChatResponse(
        Long id,
        Long offerId,
        String offerTitle,
        BigDecimal offerPricePerDay,
        LocalDate offerAvailableFrom,
        LocalDate offerAvailableTo,
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
                chat.getOffer().getPricePerDay(),
                chat.getOffer().getAvailableFrom(),
                chat.getOffer().getAvailableTo(),
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
