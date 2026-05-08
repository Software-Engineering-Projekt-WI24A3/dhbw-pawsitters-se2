package com.pawsitters.dto;

import com.pawsitters.model.PetChoice;
import com.pawsitters.model.User;
import com.pawsitters.model.UserRole;

import java.time.LocalDate;
import java.util.List;
import java.util.Set;

public record UserResponse(
        Long id,
        String email,
        String firstName,
        String lastName,
        String phone,
        LocalDate birthDate,
        String emergencyContact,
        String profilePicture,
        String bio,
        Float rating,
        Integer numberOfRatings,
        UserRole role,
        String postalCode,
        String city,
        Set<PetChoice> acceptedPetSpecies,
        List<PetResponse> pets
) {
    public static UserResponse from(User user) {
        List<PetResponse> pets = user.getPets() == null
                ? List.of()
                : user.getPets().stream().map(PetResponse::from).toList();

        return new UserResponse(
                user.getId(),
                user.getEmail(),
                user.getFirstName(),
                user.getLastName(),
                user.getPhone(),
                user.getBirthDate(),
                user.getEmergencyContact(),
                user.getProfilePicture(),
                user.getBio(),
                user.getRating(),
                user.getNumberOfRatings(),
                user.getRole(),
                user.getPostalCode(),
                user.getCity(),
                user.getAcceptedPetSpecies(),
                pets
        );
    }
}
