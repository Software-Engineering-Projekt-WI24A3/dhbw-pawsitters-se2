package com.pawsitters.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Index;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;

import java.time.Instant;

@Entity
@Table(
        name = "user_reviews",
        uniqueConstraints = @UniqueConstraint(
                name = "uk_user_reviews_reviewer_reviewed",
                columnNames = {"reviewer_id", "reviewed_user_id"}
        ),
        indexes = {
                @Index(name = "idx_user_reviews_reviewed_user", columnList = "reviewed_user_id"),
                @Index(name = "idx_user_reviews_reviewer", columnList = "reviewer_id")
        }
)
public class UserReview {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "reviewed_user_id", nullable = false)
    private User reviewedUser;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "reviewer_id", nullable = false)
    private User reviewer;

    @Column(nullable = false)
    private Integer rating;

    @Column(nullable = false)
    private Instant createdAt;

    @Column(nullable = false)
    private Instant updatedAt;

    @PrePersist
    void prePersist() {
        Instant now = Instant.now();
        if (createdAt == null) {
            createdAt = now;
        }
        if (updatedAt == null) {
            updatedAt = now;
        }
    }

    @PreUpdate
    void preUpdate() {
        updatedAt = Instant.now();
    }

    public Long getId() { return id; }

    public User getReviewedUser() { return reviewedUser; }

    public User getReviewer() { return reviewer; }

    public Integer getRating() { return rating; }

    public Instant getCreatedAt() { return createdAt; }

    public Instant getUpdatedAt() { return updatedAt; }

    public void setId(Long id) { this.id = id; }

    public void setReviewedUser(User reviewedUser) { this.reviewedUser = reviewedUser; }

    public void setReviewer(User reviewer) { this.reviewer = reviewer; }

    public void setRating(Integer rating) { this.rating = rating; }

    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }

    public void setUpdatedAt(Instant updatedAt) { this.updatedAt = updatedAt; }

    public UserReview() {}
}
