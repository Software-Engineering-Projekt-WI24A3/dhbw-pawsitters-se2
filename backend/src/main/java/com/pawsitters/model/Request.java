package com.pawsitters.model;

import jakarta.persistence.*;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

@Entity
public class Request {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "pet_owner_id", nullable = false)
    private User petOwner;

    @ManyToOne
    @JoinColumn(name = "pet_id", nullable = false)
    private Pet pet;

    @Column(nullable = false)
    private LocalDate startDate;

    @Column(nullable = false)
    private LocalDate endDate;

    @Column(nullable = false)
    private String description;

    @Column(nullable = false)
    private String location;

    @Column(nullable = false)
    private String housingType; // z.B. "Haus", "Wohnung"

    @Column(nullable = false)
    private String extras; // z.B. "Gassi gehen, Medikamente geben"

    @Column(nullable = false)
    private String specialNeeds;

    @Column(nullable = false)
    private String price;

    @Enumerated(EnumType.STRING)
    private RequestStatus status;

    // Getter & Setter
    public Long getId() { return id; }
    public User getPetOwner() { return petOwner; }
    public Pet getPet() { return pet; }
    public LocalDate getStartDate() { return startDate; }
    public LocalDate getEndDate() { return endDate; }
    public String getDescription() { return description; }
    public String getLocation() { return location; }
    public String getHousingType() { return housingType; }
    public String getExtras() { return extras; }
    public String getSpecialNeeds() { return specialNeeds; }
    public String getPrice() { return price; }
    public RequestStatus getStatus() { return status; }

    public void setId(Long id) { this.id = id; }
    public void setPetOwner(User petOwner) { this.petOwner = petOwner; }
    public void setPet(Pet pet) { this.pet = pet; }
    public void setStartDate(LocalDate startDate) { this.startDate = startDate; }
    public void setEndDate(LocalDate endDate) { this.endDate = endDate; }
    public void setDescription(String description) { this.description = description; }
    public void setLocation(String location) { this.location = location; }
    public void setHousingType(String housingType) { this.housingType = housingType; }
    public void setExtras(String extras) { this.extras = extras; }
    public void setSpecialNeeds(String specialNeeds) { this.specialNeeds = specialNeeds; }
    public void setPrice(String price) { this.price = price; }
    public void setStatus(RequestStatus status) { this.status = status; }
    public void setStatus(RequestStatus status) { this.status = status; }

    public Request() {};

    // zeitraum, preis, haustier, wohnform(haus,wohnung), extras, zusatzmöglichkeiten

}
