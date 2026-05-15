package com.pawsitters.dto;

public record HostStatsResponse(
        Long hostId,
        Long reviewCount,
        Double averageRating,
        Double averageCommunicationRating,
        Double averageReliabilityRating,
        Double averageCareRating
) {}
