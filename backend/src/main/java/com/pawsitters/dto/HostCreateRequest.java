package com.pawsitters.dto;

import com.pawsitters.model.PetChoice;
import jakarta.validation.constraints.NotBlank;

import java.util.List;
import java.util.Set;

public record HostCreateRequest(
        String bio,
        String experience,
        List<@NotBlank String> experiences,
        String accommodationDescription,
        Set<PetChoice> acceptedPetSpecies
) {}
