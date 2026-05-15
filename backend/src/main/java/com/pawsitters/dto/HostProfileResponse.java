package com.pawsitters.dto;

import com.pawsitters.model.HostProfile;
import com.pawsitters.model.PetChoice;

import java.util.List;
import java.util.Set;

public record HostProfileResponse(
        Long id,
        Long hostProfileId,
        String firstName,
        String lastName,
        String profilePicture,
        String bio,
        String postalCode,
        String city,
        Set<PetChoice> acceptedPetSpecies,
        String experience,
        List<String> experiences,
        String accommodationDescription,
        List<HostGalleryImageResponse> gallery,
        HostStatsResponse stats
) {
    public static HostProfileResponse from(HostProfile profile, HostStatsResponse stats) {
        var host = profile.getHost();
        List<HostGalleryImageResponse> gallery = profile.getGalleryImages() == null
                ? List.of()
                : profile.getGalleryImages().stream()
                .map(HostGalleryImageResponse::from)
                .toList();

        return new HostProfileResponse(
                host.getId(),
                profile.getId(),
                host.getFirstName(),
                host.getLastName(),
                host.getProfilePicture(),
                host.getBio(),
                host.getPostalCode(),
                host.getCity(),
                host.getAcceptedPetSpecies(),
                profile.getExperience(),
                profile.getExperiences(),
                profile.getAccommodationDescription(),
                gallery,
                stats
        );
    }
}
