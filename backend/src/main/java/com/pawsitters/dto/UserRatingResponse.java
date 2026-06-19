package com.pawsitters.dto;

import com.pawsitters.model.User;
import com.pawsitters.model.UserReview;

import java.time.Instant;

public record UserRatingResponse(
        Long id,
        Long reviewedUserId,
        Long reviewerId,
        Integer rating,
        Float averageRating,
        Integer numberOfRatings,
        Instant createdAt,
        Instant updatedAt
) {
    public static UserRatingResponse from(UserReview review, User reviewedUser) {
        User reviewer = review == null ? null : review.getReviewer();
        User target = reviewedUser != null ? reviewedUser : review == null ? null : review.getReviewedUser();

        return new UserRatingResponse(
                review == null ? null : review.getId(),
                target == null ? null : target.getId(),
                reviewer == null ? null : reviewer.getId(),
                review == null ? null : review.getRating(),
                target == null ? 0f : target.getRating(),
                target == null ? 0 : target.getNumberOfRatings(),
                review == null ? null : review.getCreatedAt(),
                review == null ? null : review.getUpdatedAt()
        );
    }

    public static UserRatingResponse empty(User reviewedUser, User reviewer) {
        return new UserRatingResponse(
                null,
                reviewedUser == null ? null : reviewedUser.getId(),
                reviewer == null ? null : reviewer.getId(),
                null,
                reviewedUser == null ? 0f : reviewedUser.getRating(),
                reviewedUser == null ? 0 : reviewedUser.getNumberOfRatings(),
                null,
                null
        );
    }
}
