package com.pawsitters.dto;

import java.util.List;

public record MarketplaceOfferSearchResponse(
        List<OfferResponse> matchingOffers,
        List<OfferResponse> alternativeDateOffers
) {
}
