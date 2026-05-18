package com.pawsitters.dto;

import com.pawsitters.model.PetChoice;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.Set;

public record BookingProposalCreateRequest(
        LocalDate startDate,
        LocalDate endDate,
        @DecimalMin(value = "0.01") BigDecimal priceTotal,
        Set<PetChoice> petSpecies,
        @Min(1) Integer petCount,
        @Size(max = 1000) String note
) {
}
