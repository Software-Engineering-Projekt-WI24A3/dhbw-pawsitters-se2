package com.pawsitters.controller;

import com.pawsitters.model.Pet;
import com.pawsitters.model.PetChoice;
import com.pawsitters.service.PetService;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@RestController
@Validated
@RequestMapping("/api/pets")
public class PetController {

    private final PetService petService;

    public PetController(PetService petService) {
        this.petService = petService;
    }

    @GetMapping
    public ResponseEntity<List<PetResponse>> getPets(Authentication authentication) {
        List<PetResponse> pets = petService.getPetsByOwnerEmail(authentication.getName())
                .stream()
                .map(PetResponse::from)
                .toList();
        return ResponseEntity.ok(pets);
    }

    @PostMapping
    public ResponseEntity<?> createPet(@Valid @RequestBody PetRequest request, Authentication authentication) {
        try {
            Pet pet = petService.createPetForOwnerEmail(
                    authentication.getName(),
                    request.name(),
                    request.species(),
                    request.breed(),
                    request.age(),
                    request.specialNeeds()
            );
            return ResponseEntity.ok(PetResponse.from(pet));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> updatePet(@PathVariable Long id,
                                       @Valid @RequestBody PetRequest request,
                                       Authentication authentication) {
        try {
            Pet pet = petService.updatePetForOwnerEmail(
                    id,
                    authentication.getName(),
                    request.name(),
                    request.species(),
                    request.breed(),
                    request.age(),
                    request.specialNeeds()
            );
            return ResponseEntity.ok(PetResponse.from(pet));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @PostMapping(value = "/{id}/image", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<?> uploadPetImage(@PathVariable Long id,
                                            @RequestPart("image") MultipartFile image,
                                            Authentication authentication) {
        try {
            Pet pet = petService.uploadImageForOwnerEmail(id, authentication.getName(), image);
            return ResponseEntity.ok(PetResponse.from(pet));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    public record PetRequest(
            @NotBlank String name,
            @NotNull PetChoice species,
            @NotBlank String breed,
            @Min(0) int age,
            @NotBlank String specialNeeds
    ) {}

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
        static PetResponse from(Pet pet) {
            String defaultImagePath = "/images/pet_images/default/";
            if (pet.getSpecies() != null) {
                defaultImagePath = pet.getSpecies().getFallbackImagePath();
            }
            
            return new PetResponse(
                    pet.getId(),
                    pet.getName(),
                    pet.getSpecies(),
                    pet.getBreed(),
                    pet.getAge(),
                    pet.getSpecialNeeds(),
                    pet.getImagePath(),
                    defaultImagePath
            );
        }
    }
}
