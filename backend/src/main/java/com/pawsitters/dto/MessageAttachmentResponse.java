package com.pawsitters.dto;

import com.pawsitters.model.MessageAttachment;

import java.time.Instant;

public record MessageAttachmentResponse(
        Long id,
        Long messageId,
        String url,
        String originalFilename,
        String contentType,
        Long sizeBytes,
        Instant createdAt
) {
    public static MessageAttachmentResponse from(MessageAttachment attachment) {
        return new MessageAttachmentResponse(
                attachment.getId(),
                attachment.getMessage().getId(),
                attachment.getUrl(),
                attachment.getOriginalFilename(),
                attachment.getContentType(),
                attachment.getSizeBytes(),
                attachment.getCreatedAt()
        );
    }
}
