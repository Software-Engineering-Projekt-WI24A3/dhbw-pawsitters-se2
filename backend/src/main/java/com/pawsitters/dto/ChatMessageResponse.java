package com.pawsitters.dto;

import com.pawsitters.model.ChatMessage;
import com.pawsitters.model.ChatMessageType;

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
        List<MessageAttachmentResponse> attachments,
        String type,
        BookingProposalResponse bookingProposal
) {
    public ChatMessageResponse(Long id,
                               Long chatId,
                               Long senderId,
                               String senderFirstName,
                               String senderLastName,
                               String content,
                               Instant createdAt,
                               List<MessageAttachmentResponse> attachments) {
        this(id, chatId, senderId, senderFirstName, senderLastName, content, createdAt, attachments, ChatMessageType.TEXT.name(), null);
    }

    public static ChatMessageResponse from(ChatMessage message) {
        List<MessageAttachmentResponse> attachments = message.getAttachments() == null
                ? List.of()
                : message.getAttachments().stream()
                        .map(MessageAttachmentResponse::from)
                        .toList();
        ChatMessageType type = message.getType() == null ? ChatMessageType.TEXT : message.getType();
        BookingProposalResponse bookingProposal = message.getBookingProposal() == null
                ? null
                : BookingProposalResponse.from(message.getBookingProposal());

        return new ChatMessageResponse(
                message.getId(),
                message.getChat().getId(),
                message.getSender().getId(),
                message.getSender().getFirstName(),
                message.getSender().getLastName(),
                message.getContent(),
                message.getCreatedAt(),
                attachments,
                type.name(),
                bookingProposal
        );
    }
}
