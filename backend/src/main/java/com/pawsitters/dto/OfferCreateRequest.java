package com.pawsitters.dto;

import com.pawsitters.model.PetChoice;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;
import java.util.List;
import java.util.Set;

public record OfferCreateRequest(
        @NotBlank String title,
        @NotBlank @Size(max = 1000) String description,
        @NotNull @DecimalMin(value = "0.01") BigDecimal pricePerDay,
        @NotEmpty Set<@NotNull PetChoice> acceptedPetSpecies,
        @NotEmpty List<@NotBlank String> services
) {}
