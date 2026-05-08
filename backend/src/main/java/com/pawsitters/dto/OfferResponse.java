package com.pawsitters.dto;

import com.pawsitters.model.Offer;
import com.pawsitters.model.OfferStatus;
import com.pawsitters.model.PetChoice;

import java.math.BigDecimal;
import java.util.List;
import java.util.Set;

public record OfferResponse(
        Long id,
        Long hostId,
        String hostFirstName,
        String hostLastName,
        String title,
        String description,
        BigDecimal pricePerDay,
        Set<PetChoice> acceptedPetSpecies,
        List<String> services,
        OfferStatus status
) {
    public static OfferResponse from(Offer offer) {
        return new OfferResponse(
                offer.getId(),
                offer.getHost().getId(),
                offer.getHost().getFirstName(),
                offer.getHost().getLastName(),
                offer.getTitle(),
                offer.getDescription(),
                offer.getPricePerDay(),
                offer.getAcceptedPetSpecies(),
                offer.getServices(),
                offer.getStatus()
        );
    }
}
