package com.pawsitters.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;

import java.time.Instant;

@Entity
@Table(
        name = "chats",
        uniqueConstraints = @UniqueConstraint(
                name = "uk_chats_offer_requester",
                columnNames = {"offer_id", "requester_id"}
        )
)
public class Chat {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "offer_id", nullable = false)
    private Offer offer;

    @ManyToOne
    @JoinColumn(name = "host_id", nullable = false)
    private User host;

    @ManyToOne
    @JoinColumn(name = "requester_id", nullable = false)
    private User requester;

    @Column(nullable = false, updatable = false)
    private Instant createdAt;

    private Instant lastMessageAt;

    @PrePersist
    void prePersist() {
        if (createdAt == null) {
            createdAt = Instant.now();
        }
    }

    public Long getId() { return id; }

    public Offer getOffer() { return offer; }

    public User getHost() { return host; }

    public User getRequester() { return requester; }

    public Instant getCreatedAt() { return createdAt; }

    public Instant getLastMessageAt() { return lastMessageAt; }

    public void setId(Long id) { this.id = id; }

    public void setOffer(Offer offer) { this.offer = offer; }

    public void setHost(User host) { this.host = host; }

    public void setRequester(User requester) { this.requester = requester; }

    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }

    public void setLastMessageAt(Instant lastMessageAt) { this.lastMessageAt = lastMessageAt; }

    public Chat() {}
}
