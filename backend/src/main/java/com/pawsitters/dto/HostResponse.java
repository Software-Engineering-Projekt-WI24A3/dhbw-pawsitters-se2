package com.pawsitters.dto;

import com.pawsitters.model.PetChoice;
import com.pawsitters.model.User;

import java.util.Set;

public record HostResponse(
        Long id,
        String firstName,
        String lastName,
        String profilePicture,
        String bio,
        Float rating,
        Integer numberOfRatings,
        String postalCode,
        String city,
        Set<PetChoice> acceptedPetSpecies
) {
    public static HostResponse from(User user) {
        return new HostResponse(
                user.getId(),
                user.getFirstName(),
                user.getLastName(),
                user.getProfilePicture(),
                user.getBio(),
                user.getRating(),
                user.getNumberOfRatings(),
                user.getPostalCode(),
                user.getCity(),
                user.getAcceptedPetSpecies()
        );
    }
}
