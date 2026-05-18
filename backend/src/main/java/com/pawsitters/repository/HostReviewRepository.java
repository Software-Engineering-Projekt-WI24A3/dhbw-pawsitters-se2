package com.pawsitters.repository;

import com.pawsitters.model.HostReview;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface HostReviewRepository extends JpaRepository<HostReview, Long> {

    @Query("""
            select count(review) as reviewCount,
                   avg(review.rating) as averageRating,
                   avg(review.communicationRating) as averageCommunicationRating,
                   avg(review.reliabilityRating) as averageReliabilityRating,
                   avg(review.careRating) as averageCareRating
            from HostReview review
            where review.host.id = :hostId
            """)
    HostReviewStatsProjection calculateStatsByHostId(@Param("hostId") Long hostId);

    interface HostReviewStatsProjection {
        Long getReviewCount();

        Double getAverageRating();

        Double getAverageCommunicationRating();

        Double getAverageReliabilityRating();

        Double getAverageCareRating();
    }
}
