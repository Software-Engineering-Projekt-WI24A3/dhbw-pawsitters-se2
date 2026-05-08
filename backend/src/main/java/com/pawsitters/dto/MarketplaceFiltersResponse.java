package com.pawsitters.dto;

import com.pawsitters.model.PetChoice;

import java.util.List;

public record MarketplaceFiltersResponse(
        List<PetChoice> species,
        List<String> postalCodes,
        List<String> cities
) {}
