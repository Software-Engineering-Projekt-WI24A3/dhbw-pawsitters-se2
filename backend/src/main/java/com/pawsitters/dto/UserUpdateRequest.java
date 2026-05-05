package com.pawsitters.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Past;

import java.time.LocalDate;

public record UserUpdateRequest(
        @NotNull String firstName,
        @NotNull String lastName,
        @NotNull String phone,
        @NotNull @Past LocalDate birthDate,
        @NotNull String emergencyContact,
        @NotNull String profilePicture,
        @NotNull String bio
) {}

