package com.pawsitters.dto;

import com.pawsitters.model.UserRole;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Past;
import jakarta.validation.constraints.Size;

import java.time.LocalDate;

public record RegisterRequest(
        @NotBlank @Email String email,
        @NotBlank @Size(min = 8, max = 100) String password,
        @NotBlank String firstName,
        @NotBlank String lastName,
        @NotBlank String phone,
        @NotNull @Past LocalDate birthDate,
        @NotBlank String emergencyContact,
        @NotBlank String profilePicture,
        @NotBlank String bio,
        @NotNull UserRole role
) {}
