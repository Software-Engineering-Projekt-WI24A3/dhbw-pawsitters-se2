package com.pawsitters.dto;

import com.pawsitters.model.Pet;
import com.pawsitters.model.PetChoice;

public record PetResponse(
        Long id,
        String name,
        PetChoice species,
        String breed,
        int age,
        String specialNeeds,
        String imagePath,
        String defaultImagePath
) {
    public static PetResponse from(Pet pet) {
        return new PetResponse(
                pet.getId(),
                pet.getName(),
                pet.getSpecies(),
                pet.getBreed(),
                pet.getAge(),
                pet.getSpecialNeeds(),
                pet.getImagePath(),
                pet.getSpecies() != null ? pet.getSpecies().getFallbackImagePath() : null
        );
    }
}
