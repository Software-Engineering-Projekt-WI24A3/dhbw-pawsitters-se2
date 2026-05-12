package com.pawsitters.dto;

import com.pawsitters.model.PetChoice;
import com.pawsitters.model.UserRole;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.Past;
import jakarta.validation.constraints.Pattern;

import java.time.LocalDate;
import java.util.Set;

public record UserPatchRequest(
        @Email String email,
        String password,
        String firstName,
        String lastName,
        String phone,
        @Past LocalDate birthDate,
        String emergencyContact,
        String profilePicture,
        String bio,
        UserRole role,
        @Pattern(regexp = "\\d{5}", message = "postalCode muss aus 5 Ziffern bestehen") String postalCode,
        String city,
        Set<PetChoice> acceptedPetSpecies
) {}
