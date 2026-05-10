package com.pawsitters.model;

import jakarta.persistence.*;
import com.fasterxml.jackson.annotation.JsonManagedReference;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Set;

@Entity
@Table(name = "users") // "user" ist ein reserviertes SQL-Wort!
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(unique = true, nullable = false)
    private String email;

    @Column(nullable = false)
    private String passwordHash; // NIEMALS Klartext speichern

    @Column(nullable = false)
    private String firstName;

    @Column(nullable = false)
    private String lastName;

    @Column(nullable = false)
    private String phone;

    @Column(nullable = false)
    private LocalDate birthDate;

    @Column(nullable = false)
    private String emergencyContact;

    @Column(nullable = false)
    private String profilePicture;

    @Column(nullable = false)
    private String bio;

    @Column(nullable = false)
    private Float rating;

    @Column(nullable = false)
    private Integer numberOfRatings;

    @Enumerated(EnumType.STRING)
    private UserRole role;

    @Column(nullable = false)
    private Boolean passwordChangeRequired = false;

    private String postalCode;

    private String city;

    @ElementCollection(targetClass = PetChoice.class)
    @CollectionTable(name = "user_accepted_pet_species", joinColumns = @JoinColumn(name = "user_id"))
    @Enumerated(EnumType.STRING)
    @Column(name = "species", nullable = false)
    private Set<PetChoice> acceptedPetSpecies = new LinkedHashSet<>();

    @OneToMany(mappedBy = "owner", cascade = CascadeType.ALL)
    @JsonManagedReference
    private List<Pet> pets = new ArrayList<>();

    // ===== GETTER =====

    public Long getId() { return id; }

    public String getEmail() { return email; }

    public String getPasswordHash() { return passwordHash; }

    public String getFirstName() { return firstName; }

    public String getLastName() { return lastName; }

    public String getPhone() { return phone; }

    public LocalDate getBirthDate() { return birthDate; }

    public String getEmergencyContact() { return emergencyContact; }

    public String getProfilePicture() { return profilePicture; }

    public String getBio() { return bio; }

    public Float getRating() { return rating; }

    public Integer getNumberOfRatings() { return numberOfRatings; }

    public UserRole getRole() { return role; }

    public boolean isPasswordChangeRequired() { return Boolean.TRUE.equals(passwordChangeRequired); }

    public String getPostalCode() { return postalCode; }

    public String getCity() { return city; }

    public Set<PetChoice> getAcceptedPetSpecies() { return acceptedPetSpecies; }

    public List<Pet> getPets() { return pets; }

    // ===== SETTER =====

    public void setId(Long id) { this.id = id; }

    public void setEmail(String email) { this.email = email; }

    public void setPasswordHash(String passwordHash) { this.passwordHash = passwordHash; }

    public void setFirstName(String firstName) { this.firstName = firstName; }

    public void setLastName(String lastName) { this.lastName = lastName; }

    public void setPhone(String phone) { this.phone = phone; }

    public void setBirthDate(LocalDate birthDate) { this.birthDate = birthDate; }

    public void setEmergencyContact(String emergencyContact) { this.emergencyContact = emergencyContact; }

    public void setProfilePicture(String profilePicture) { this.profilePicture = profilePicture; }

    public void setBio(String bio) { this.bio = bio; }

    public void setRating(Float rating) { this.rating = rating; }

    public void setNumberOfRatings(Integer numberOfRatings) { this.numberOfRatings = numberOfRatings; }

    public void setRole(UserRole role) { this.role = role; }

    public void setPasswordChangeRequired(Boolean passwordChangeRequired) { this.passwordChangeRequired = passwordChangeRequired; }

    public void setPostalCode(String postalCode) { this.postalCode = postalCode; }

    public void setCity(String city) { this.city = city; }

    public void setAcceptedPetSpecies(Set<PetChoice> acceptedPetSpecies) {
        this.acceptedPetSpecies = acceptedPetSpecies == null ? new LinkedHashSet<>() : acceptedPetSpecies;
    }

    public void setPets(List<Pet> pets) { this.pets = pets; }

    public User() {};

}
