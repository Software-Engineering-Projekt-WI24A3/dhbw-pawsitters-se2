package com.pawsitters.controller;

import com.pawsitters.dto.ApiResponse;
import com.pawsitters.dto.DeleteResponse;
import com.pawsitters.dto.PetResponse;
import com.pawsitters.model.PetChoice;
import com.pawsitters.service.PetService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import org.springframework.http.HttpStatus;
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
    public ResponseEntity<ApiResponse<List<PetResponse>>> getPets(Authentication authentication,
                                                                  HttpServletRequest servletRequest) {
        List<PetResponse> pets = petService.getPetsByOwnerEmail(authentication.getName())
                .stream()
                .map(PetResponse::from)
                .toList();
        return ResponseEntity.ok(ApiResponse.success(
                HttpStatus.OK,
                "Pets retrieved successfully.",
                pets,
                servletRequest.getRequestURI(),
                pets.size()
        ));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<PetResponse>> createPet(@Valid @RequestBody PetRequest request,
                                                              Authentication authentication,
                                                              HttpServletRequest servletRequest) {
        PetResponse pet = PetResponse.from(petService.createPetForOwnerEmail(
                authentication.getName(),
                request.name(),
                request.species(),
                request.breed(),
                request.age(),
                request.specialNeeds()
        ));
        return ResponseEntity.ok(ApiResponse.success(
                HttpStatus.OK,
                "Pet created successfully.",
                pet,
                servletRequest.getRequestURI()
        ));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<PetResponse>> updatePet(@PathVariable Long id,
                                                              @Valid @RequestBody PetRequest request,
                                                              Authentication authentication,
                                                              HttpServletRequest servletRequest) {
        PetResponse pet = PetResponse.from(petService.updatePetForOwnerEmail(
                id,
                authentication.getName(),
                request.name(),
                request.species(),
                request.breed(),
                request.age(),
                request.specialNeeds()
        ));
        return ResponseEntity.ok(ApiResponse.success(
                HttpStatus.OK,
                "Pet updated successfully.",
                pet,
                servletRequest.getRequestURI()
        ));
    }

    @PostMapping(value = "/{id}/image", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<ApiResponse<PetResponse>> uploadPetImage(@PathVariable Long id,
                                                                   @RequestPart("image") MultipartFile image,
                                                                   Authentication authentication,
                                                                   HttpServletRequest servletRequest) {
        PetResponse pet = PetResponse.from(petService.uploadImageForOwnerEmail(id, authentication.getName(), image));
        return ResponseEntity.ok(ApiResponse.success(
                HttpStatus.OK,
                "Pet image uploaded successfully.",
                pet,
                servletRequest.getRequestURI()
        ));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<DeleteResponse>> deletePet(@PathVariable Long id,
                                                                 Authentication authentication,
                                                                 HttpServletRequest servletRequest) {
        petService.deletePetForOwnerEmail(id, authentication.getName());
        DeleteResponse deleted = new DeleteResponse(true, id, "Pet deleted successfully.");
        return ResponseEntity.ok(ApiResponse.success(
                HttpStatus.OK,
                "Pet deleted successfully.",
                deleted,
                servletRequest.getRequestURI()
        ));
    }

    public record PetRequest(
            @NotBlank String name,
            @NotNull PetChoice species,
            @NotBlank String breed,
            @Min(0) int age,
            @NotBlank String specialNeeds
    ) {}
}
