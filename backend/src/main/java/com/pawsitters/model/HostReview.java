package com.pawsitters.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;

import java.time.Instant;

@Entity
@Table(name = "host_reviews")
public class HostReview {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "host_id", nullable = false)
    private User host;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "pet_owner_id")
    private User petOwner;

    @Column(nullable = false)
    private Integer rating;

    @Column(nullable = false)
    private Integer communicationRating;

    @Column(nullable = false)
    private Integer reliabilityRating;

    @Column(nullable = false)
    private Integer careRating;

    @Column(length = 1000)
    private String comment;

    @Column(nullable = false)
    private Instant createdAt;

    @PrePersist
    void prePersist() {
        if (createdAt == null) {
            createdAt = Instant.now();
        }
    }

    public Long getId() { return id; }

    public User getHost() { return host; }

    public User getPetOwner() { return petOwner; }

    public Integer getRating() { return rating; }

    public Integer getCommunicationRating() { return communicationRating; }

    public Integer getReliabilityRating() { return reliabilityRating; }

    public Integer getCareRating() { return careRating; }

    public String getComment() { return comment; }

    public Instant getCreatedAt() { return createdAt; }

    public void setId(Long id) { this.id = id; }

    public void setHost(User host) { this.host = host; }

    public void setPetOwner(User petOwner) { this.petOwner = petOwner; }

    public void setRating(Integer rating) { this.rating = rating; }

    public void setCommunicationRating(Integer communicationRating) { this.communicationRating = communicationRating; }

    public void setReliabilityRating(Integer reliabilityRating) { this.reliabilityRating = reliabilityRating; }

    public void setCareRating(Integer careRating) { this.careRating = careRating; }

    public void setComment(String comment) { this.comment = comment; }

    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }

    public HostReview() {}
}
