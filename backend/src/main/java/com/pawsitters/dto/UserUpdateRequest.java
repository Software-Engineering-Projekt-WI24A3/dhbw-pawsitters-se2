package com.pawsitters.dto;

import com.pawsitters.model.PetChoice;
import com.pawsitters.model.UserRole;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Past;
import jakarta.validation.constraints.Pattern;

import java.time.LocalDate;
import java.util.Set;

public record UserUpdateRequest(
        @NotBlank @Email String email,
        @NotBlank String password,
        @NotBlank String firstName,
        @NotBlank String lastName,
        @NotBlank String phone,
        @NotNull @Past LocalDate birthDate,
        @NotBlank String emergencyContact,
        @NotBlank String profilePicture,
        @NotBlank String bio,
        @NotNull UserRole role,
        @Pattern(regexp = "\\d{5}", message = "postalCode muss aus 5 Ziffern bestehen") String postalCode,
        String city,
        Set<PetChoice> acceptedPetSpecies
) {}
