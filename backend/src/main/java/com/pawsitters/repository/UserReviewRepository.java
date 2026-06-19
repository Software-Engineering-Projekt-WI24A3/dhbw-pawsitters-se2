package com.pawsitters.repository;

import com.pawsitters.model.UserReview;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;

public interface UserReviewRepository extends JpaRepository<UserReview, Long> {

    @EntityGraph(attributePaths = {"reviewedUser", "reviewer"})
    Optional<UserReview> findByReviewedUserIdAndReviewerId(Long reviewedUserId, Long reviewerId);

    @Query("""
            select count(review) as reviewCount,
                   avg(review.rating) as averageRating
            from UserReview review
            where review.reviewedUser.id = :reviewedUserId
            """)
    UserReviewStatsProjection calculateStatsByReviewedUserId(@Param("reviewedUserId") Long reviewedUserId);

    interface UserReviewStatsProjection {
        Long getReviewCount();

        Double getAverageRating();
    }
}
