package com.pawsitters.model;

import jakarta.persistence.*;

@Entity
public class Pet {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String name;

    @Enumerated(EnumType.STRING)
    private PetChoice species;

    @Column(nullable = false)
    private String breed;

    @Column(nullable = false)
    private int age;

    @Column(nullable = false)
    private String specialNeeds;

    @ManyToOne
    @JoinColumn(name = "owner_id", nullable = false)
    private User owner; // Jedes Tier gehört genau einem User

    // ===== GETTER & SETTER =====

    public Long getId() {
        return id;
    }

    public String getName() {
        return name;
    }

    public PetChoice getSpecies() {
        return species;
    }

    public String getBreed() {
        return breed;
    }

    public int getAge() {
        return age;
    }

    public String getSpecialNeeds() {
        return specialNeeds;
    }

    public User getOwner() {
        return owner;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public void setName(String name) {
        this.name = name;
    }

    public void setSpecies(PetChoice species) {
        this.species = species;
    }

    public void setBreed(String breed) {
        this.breed = breed;
    }

    public void setAge(int age) {
        this.age = age;
    }

    public void setSpecialNeeds(String specialNeeds) {
        this.specialNeeds = specialNeeds;
    }

    public void setOwner(User owner) {
        this.owner = owner;
    }

    public Pet() {
    }
}
