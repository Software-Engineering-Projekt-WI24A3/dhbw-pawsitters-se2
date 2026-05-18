package com.pawsitters.dto;

import com.pawsitters.model.HostReview;
import com.pawsitters.model.User;

import java.time.Instant;

public record HostReviewResponse(
        Long id,
        Long bookingId,
        Long hostId,
        String hostFirstName,
        String hostLastName,
        Long petOwnerId,
        String petOwnerFirstName,
        String petOwnerLastName,
        Integer rating,
        Integer communicationRating,
        Integer reliabilityRating,
        Integer careRating,
        String comment,
        Instant createdAt
) {
    public static HostReviewResponse from(HostReview review) {
        User host = review.getHost();
        User petOwner = review.getPetOwner();

        return new HostReviewResponse(
                review.getId(),
                review.getBooking() == null ? null : review.getBooking().getId(),
                host == null ? null : host.getId(),
                host == null ? null : host.getFirstName(),
                host == null ? null : host.getLastName(),
                petOwner == null ? null : petOwner.getId(),
                petOwner == null ? null : petOwner.getFirstName(),
                petOwner == null ? null : petOwner.getLastName(),
                review.getRating(),
                review.getCommunicationRating(),
                review.getReliabilityRating(),
                review.getCareRating(),
                review.getComment(),
                review.getCreatedAt()
        );
    }
}
