package com.pawsitters.model;

import jakarta.persistence.CascadeType;
import jakarta.persistence.CollectionTable;
import jakarta.persistence.Column;
import jakarta.persistence.ElementCollection;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.OneToMany;
import jakarta.persistence.OneToOne;
import jakarta.persistence.OrderBy;
import jakarta.persistence.OrderColumn;
import jakarta.persistence.Table;

import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "host_profiles")
public class HostProfile {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "host_id", nullable = false, unique = true)
    private User host;

    @Column(nullable = false, length = 2000)
    private String experience;

    @ElementCollection
    @CollectionTable(name = "host_profile_experiences", joinColumns = @JoinColumn(name = "host_profile_id"))
    @OrderColumn(name = "position")
    @Column(name = "experience", nullable = false, length = 1000)
    private List<String> experiences = new ArrayList<>();

    @Column(name = "accommodation_description", nullable = false, length = 2000)
    private String accommodationDescription;

    @OneToMany(mappedBy = "hostProfile", cascade = CascadeType.ALL, orphanRemoval = true)
    @OrderBy("createdAt ASC")
    private List<HostGalleryImage> galleryImages = new ArrayList<>();

    public Long getId() { return id; }

    public User getHost() { return host; }

    public String getExperience() { return experience; }

    public List<String> getExperiences() { return experiences; }

    public String getAccommodationDescription() { return accommodationDescription; }

    public List<HostGalleryImage> getGalleryImages() { return galleryImages; }

    public void setId(Long id) { this.id = id; }

    public void setHost(User host) { this.host = host; }

    public void setExperience(String experience) { this.experience = experience; }

    public void setExperiences(List<String> experiences) {
        this.experiences = experiences == null ? new ArrayList<>() : experiences;
    }

    public void setAccommodationDescription(String accommodationDescription) {
        this.accommodationDescription = accommodationDescription;
    }

    public void setGalleryImages(List<HostGalleryImage> galleryImages) {
        this.galleryImages = galleryImages == null ? new ArrayList<>() : galleryImages;
    }

    public void addGalleryImage(HostGalleryImage image) {
        galleryImages.add(image);
        image.setHostProfile(this);
    }

    public HostProfile() {}
}
