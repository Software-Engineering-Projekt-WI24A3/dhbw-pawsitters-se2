package com.pawsitters.model;

import jakarta.persistence.CollectionTable;
import jakarta.persistence.Column;
import jakarta.persistence.ElementCollection;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OrderColumn;
import jakarta.persistence.Table;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Set;

@Entity
@Table(name = "offers")
public class Offer {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "host_id", nullable = false)
    private User host;

    @Column(nullable = false)
    private String title;

    @Column(nullable = false, length = 1000)
    private String description;

    @Column(nullable = false)
    private BigDecimal pricePerDay;

    @ElementCollection(targetClass = PetChoice.class)
    @CollectionTable(name = "offer_accepted_pet_species", joinColumns = @JoinColumn(name = "offer_id"))
    @Enumerated(EnumType.STRING)
    @Column(name = "species", nullable = false)
    private Set<PetChoice> acceptedPetSpecies = new LinkedHashSet<>();

    @ElementCollection
    @CollectionTable(name = "offer_services", joinColumns = @JoinColumn(name = "offer_id"))
    @OrderColumn(name = "position")
    @Column(name = "service_name", nullable = false)
    private List<String> services = new ArrayList<>();

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private OfferStatus status = OfferStatus.DRAFT;

    public Long getId() { return id; }

    public User getHost() { return host; }

    public String getTitle() { return title; }

    public String getDescription() { return description; }

    public BigDecimal getPricePerDay() { return pricePerDay; }

    public Set<PetChoice> getAcceptedPetSpecies() { return acceptedPetSpecies; }

    public List<String> getServices() { return services; }

    public OfferStatus getStatus() { return status; }

    public void setId(Long id) { this.id = id; }

    public void setHost(User host) { this.host = host; }

    public void setTitle(String title) { this.title = title; }

    public void setDescription(String description) { this.description = description; }

    public void setPricePerDay(BigDecimal pricePerDay) { this.pricePerDay = pricePerDay; }

    public void setAcceptedPetSpecies(Set<PetChoice> acceptedPetSpecies) {
        this.acceptedPetSpecies = acceptedPetSpecies == null ? new LinkedHashSet<>() : acceptedPetSpecies;
    }

    public void setServices(List<String> services) {
        this.services = services == null ? new ArrayList<>() : services;
    }

    public void setStatus(OfferStatus status) { this.status = status; }

    public Offer() {}
}
