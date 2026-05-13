package com.pawsitters.dto;

import com.pawsitters.model.ChatMessage;

import java.time.Instant;
import java.util.List;

public record ChatMessageResponse(
        Long id,
        Long chatId,
        Long senderId,
        String senderFirstName,
        String senderLastName,
        String content,
        Instant createdAt,
        List<MessageAttachmentResponse> attachments
) {
    public static ChatMessageResponse from(ChatMessage message) {
        List<MessageAttachmentResponse> attachments = message.getAttachments() == null
                ? List.of()
                : message.getAttachments().stream()
                        .map(MessageAttachmentResponse::from)
                        .toList();

        return new ChatMessageResponse(
                message.getId(),
                message.getChat().getId(),
                message.getSender().getId(),
                message.getSender().getFirstName(),
                message.getSender().getLastName(),
                message.getContent(),
                message.getCreatedAt(),
                attachments
        );
    }
}
