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

import java.time.Instant;

@Entity
@Table(name = "message_attachments")
public class MessageAttachment {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "message_id", nullable = false)
    private ChatMessage message;

    @Column(nullable = false)
    private String url;

    @Column(nullable = false)
    private String originalFilename;

    @Column(nullable = false)
    private String contentType;

    @Column(nullable = false)
    private Long sizeBytes;

    @Column(nullable = false, updatable = false)
    private Instant createdAt;

    @PrePersist
    void prePersist() {
        if (createdAt == null) {
            createdAt = Instant.now();
        }
    }

    public Long getId() { return id; }

    public ChatMessage getMessage() { return message; }

    public String getUrl() { return url; }

    public String getOriginalFilename() { return originalFilename; }

    public String getContentType() { return contentType; }

    public Long getSizeBytes() { return sizeBytes; }

    public Instant getCreatedAt() { return createdAt; }

    public void setId(Long id) { this.id = id; }

    public void setMessage(ChatMessage message) { this.message = message; }

    public void setUrl(String url) { this.url = url; }

    public void setOriginalFilename(String originalFilename) { this.originalFilename = originalFilename; }

    public void setContentType(String contentType) { this.contentType = contentType; }

    public void setSizeBytes(Long sizeBytes) { this.sizeBytes = sizeBytes; }

    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }

    public MessageAttachment() {}
}
