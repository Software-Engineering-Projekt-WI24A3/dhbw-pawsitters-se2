package com.pawsitters.dto;

import com.pawsitters.model.Offer;
import com.pawsitters.model.OfferStatus;
import com.pawsitters.model.PetChoice;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Set;

public record OfferResponse(
        Long id,
        Long hostId,
        String hostFirstName,
        String hostLastName,
        String title,
        String location,
        String description,
        String imagePath,
        BigDecimal pricePerDay,
        Set<PetChoice> acceptedPetSpecies,
        List<String> services,
        LocalDate availableFrom,
        LocalDate availableTo,
        OfferStatus status
) {
    public static OfferResponse from(Offer offer) {
        return new OfferResponse(
                offer.getId(),
                offer.getHost().getId(),
                offer.getHost().getFirstName(),
                offer.getHost().getLastName(),
                offer.getTitle(),
                offer.getLocation(),
                offer.getDescription(),
                offer.getImagePath(),
                offer.getPricePerDay(),
                offer.getAcceptedPetSpecies(),
                offer.getServices(),
                offer.getAvailableFrom(),
                offer.getAvailableTo(),
                offer.getStatus()
        );
    }
}
