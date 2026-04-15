package com.pawsitters.model;

import jakarta.persistence.*;

import java.util.ArrayList;
import java.util.List;

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
    private String birthDate;

    @Column(nullable = false)
    private String emergencyContact;

    @Column(nullable = false)
    private String profilePicture;

    @Column(nullable = false)
    private String bio;

    @Enumerated(EnumType.STRING)
    private UserRole role;

    @OneToMany(mappedBy = "owner", cascade = CascadeType.ALL)
    private List<Pet> pets = new ArrayList<>();

    // ===== GETTER =====

    public Long getId() { return id; }

    public String getEmail() { return email; }

    public String getPasswordHash() { return passwordHash; }

    public String getFirstName() { return firstName; }

    public String getLastName() { return lastName; }

    public String getPhone() { return phone; }

    public String getBirthDate() { return birthDate; }

    public String getEmergencyContact() { return emergencyContact; }

    public String getProfilePicture() { return profilePicture; }

    public String getBio() { return bio; }

    public UserRole getRole() { return role; }

    public List<Pet> getPets() { return pets; }

    // ===== SETTER =====

    public void setId(Long id) { this.id = id; }

    public void setEmail(String email) { this.email = email; }

    public void setPasswordHash(String passwordHash) { this.passwordHash = passwordHash; }

    public void setFirstName(String firstName) { this.firstName = firstName; }

    public void setLastName(String lastName) { this.lastName = lastName; }

    public void setPhone(String phone) { this.phone = phone; }

    public void setBirthDate(String birthDate) { this.birthDate = birthDate; }

    public void setEmergencyContact(String emergencyContact) { this.emergencyContact = emergencyContact; }

    public void setProfilePicture(String profilePicture) { this.profilePicture = profilePicture; }

    public void setBio(String bio) { this.bio = bio; }

    public void setRole(UserRole role) { this.role = role; }

    public void setPets(List<Pet> pets) { this.pets = pets; }

    public User() {};

}