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
@Table(name = "host_gallery_images")
public class HostGalleryImage {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "host_profile_id", nullable = false)
    private HostProfile hostProfile;

    @Column(nullable = false)
    private String imagePath;

    @Column(nullable = false)
    private String filename;

    @Column(nullable = false)
    private String contentType;

    @Column(nullable = false)
    private Long sizeBytes;

    @Column(nullable = false)
    private Instant createdAt;

    @PrePersist
    void prePersist() {
        if (createdAt == null) {
            createdAt = Instant.now();
        }
    }

    public Long getId() { return id; }

    public HostProfile getHostProfile() { return hostProfile; }

    public String getImagePath() { return imagePath; }

    public String getFilename() { return filename; }

    public String getContentType() { return contentType; }

    public Long getSizeBytes() { return sizeBytes; }

    public Instant getCreatedAt() { return createdAt; }

    public void setId(Long id) { this.id = id; }

    public void setHostProfile(HostProfile hostProfile) { this.hostProfile = hostProfile; }

    public void setImagePath(String imagePath) { this.imagePath = imagePath; }

    public void setFilename(String filename) { this.filename = filename; }

    public void setContentType(String contentType) { this.contentType = contentType; }

    public void setSizeBytes(Long sizeBytes) { this.sizeBytes = sizeBytes; }

    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }

    public HostGalleryImage() {}
}
