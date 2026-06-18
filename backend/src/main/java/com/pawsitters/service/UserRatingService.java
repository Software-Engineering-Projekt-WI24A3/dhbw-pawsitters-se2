package com.pawsitters.service;

import com.pawsitters.dto.UserRatingResponse;
import com.pawsitters.exception.ForbiddenException;
import com.pawsitters.exception.NotFoundException;
import com.pawsitters.model.User;
import com.pawsitters.model.UserReview;
import com.pawsitters.repository.UserRepository;
import com.pawsitters.repository.UserReviewRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Locale;

@Service
public class UserRatingService {

    private final UserReviewRepository userReviewRepository;
    private final UserRepository userRepository;

    public UserRatingService(UserReviewRepository userReviewRepository,
                             UserRepository userRepository) {
        this.userReviewRepository = userReviewRepository;
        this.userRepository = userRepository;
    }

    @Transactional
    public UserRatingResponse rateUser(String actorEmail, Long reviewedUserId, Integer rating) {
        User reviewer = getUserByEmail(actorEmail);
        User reviewedUser = getUserById(reviewedUserId);
        return upsertRating(reviewer, reviewedUser, rating);
    }

    @Transactional
    public UserRatingResponse upsertRating(User reviewer, User reviewedUser, Integer rating) {
        validateRatingTarget(reviewer, reviewedUser);
        int normalizedRating = normalizeRating(rating);

        UserReview review = userReviewRepository
                .findByReviewedUserIdAndReviewerId(reviewedUser.getId(), reviewer.getId())
                .orElseGet(UserReview::new);
        review.setReviewedUser(reviewedUser);
        review.setReviewer(reviewer);
        review.setRating(normalizedRating);

        UserReview savedReview = userReviewRepository.save(review);
        recalculateReviewedUserRating(reviewedUser);
        return UserRatingResponse.from(savedReview, reviewedUser);
    }

    @Transactional(readOnly = true)
    public UserRatingResponse getOwnRatingForUser(String actorEmail, Long reviewedUserId) {
        User reviewer = getUserByEmail(actorEmail);
        User reviewedUser = getUserById(reviewedUserId);

        return userReviewRepository
                .findByReviewedUserIdAndReviewerId(reviewedUser.getId(), reviewer.getId())
                .map(review -> UserRatingResponse.from(review, reviewedUser))
                .orElseGet(() -> UserRatingResponse.empty(reviewedUser, reviewer));
    }

    private void validateRatingTarget(User reviewer, User reviewedUser) {
        if (reviewer == null || reviewer.getId() == null) {
            throw new NotFoundException("Bewertender User nicht gefunden.");
        }
        if (reviewedUser == null || reviewedUser.getId() == null) {
            throw new NotFoundException("Bewerteter User nicht gefunden.");
        }
        if (reviewer.getId().equals(reviewedUser.getId())) {
            throw new ForbiddenException("Du kannst dein eigenes Profil nicht bewerten.");
        }
    }

    private int normalizeRating(Integer rating) {
        if (rating == null || rating < 1 || rating > 5) {
            throw new IllegalArgumentException("Bewertung muss zwischen 1 und 5 liegen.");
        }
        return rating;
    }

    private User getUserByEmail(String email) {
        return userRepository.findByEmailIgnoreCase(normalizeEmail(email))
                .orElseThrow(() -> new NotFoundException("User nicht gefunden."));
    }

    private User getUserById(Long userId) {
        return userRepository.findById(userId)
                .orElseThrow(() -> new NotFoundException("User nicht gefunden."));
    }

    private String normalizeEmail(String email) {
        return email == null ? "" : email.trim().toLowerCase(Locale.ROOT);
    }

    private void recalculateReviewedUserRating(User reviewedUser) {
        UserReviewRepository.UserReviewStatsProjection stats =
                userReviewRepository.calculateStatsByReviewedUserId(reviewedUser.getId());
        long reviewCount = stats == null || stats.getReviewCount() == null ? 0L : stats.getReviewCount();
        double averageRating = stats == null || stats.getAverageRating() == null ? 0.0 : stats.getAverageRating();

        reviewedUser.setNumberOfRatings(Math.toIntExact(reviewCount));
        reviewedUser.setRating((float) averageRating);
        userRepository.save(reviewedUser);
    }
}
