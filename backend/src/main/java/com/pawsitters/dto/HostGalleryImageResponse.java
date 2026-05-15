package com.pawsitters.dto;

import com.pawsitters.model.HostGalleryImage;

import java.time.Instant;

public record HostGalleryImageResponse(
        Long id,
        Long hostId,
        String imagePath,
        String filename,
        String contentType,
        Long sizeBytes,
        Instant createdAt
) {
    public static HostGalleryImageResponse from(HostGalleryImage image) {
        Long hostId = image.getHostProfile() == null || image.getHostProfile().getHost() == null
                ? null
                : image.getHostProfile().getHost().getId();
        return new HostGalleryImageResponse(
                image.getId(),
                hostId,
                image.getImagePath(),
                image.getFilename(),
                image.getContentType(),
                image.getSizeBytes(),
                image.getCreatedAt()
        );
    }
}
