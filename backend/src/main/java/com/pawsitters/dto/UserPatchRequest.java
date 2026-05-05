package com.pawsitters.dto;

import jakarta.validation.constraints.Past;

import java.time.LocalDate;

public record UserPatchRequest(
        String firstName,
        String lastName,
        String phone,
        @Past LocalDate birthDate,
        String emergencyContact,
        String profilePicture,
        String bio
) {}

