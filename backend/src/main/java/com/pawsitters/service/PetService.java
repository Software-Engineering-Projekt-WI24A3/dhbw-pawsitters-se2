package com.pawsitters.service;

import com.pawsitters.model.Pet;
import com.pawsitters.model.PetChoice;
import com.pawsitters.model.User;
import com.pawsitters.repository.PetRepository;
import com.pawsitters.repository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;

import java.util.List;
import java.util.UUID;

@Service
public class PetService {

    private final PetRepository petRepository;
    private final UserRepository userRepository;

    public PetService(PetRepository petRepository, UserRepository userRepository) {
        this.petRepository = petRepository;
        this.userRepository = userRepository;
    }

    @Transactional
    public Pet createPet(Long ownerId, String name, PetChoice species,
                         String breed, int age, String specialNeeds) {

        User owner = userRepository.findById(ownerId)
                .orElseThrow(() -> new IllegalArgumentException(
                        "User mit ID " + ownerId + " nicht gefunden."));

        Pet pet = new Pet();
        pet.setName(name);
        pet.setSpecies(species);
        pet.setBreed(breed);
        pet.setAge(age);
        pet.setSpecialNeeds(specialNeeds);
        pet.setOwner(owner);

        return petRepository.save(pet);
    }

    @Transactional
    public Pet createPetForOwnerEmail(String ownerEmail, String name, PetChoice species,
                                      String breed, int age, String specialNeeds) {
        User owner = getOwnerByEmail(ownerEmail);
        return createPet(owner.getId(), name, species, breed, age, specialNeeds);
    }


    public List<Pet> getPetsByOwner(Long ownerId) {
        return petRepository.findByOwnerId(ownerId);
    }

    public List<Pet> getPetsByOwnerEmail(String ownerEmail) {
        User owner = getOwnerByEmail(ownerEmail);
        return petRepository.findByOwnerId(owner.getId());
    }

    @Transactional
    public Pet updatePetForOwnerEmail(Long petId,
                                      String ownerEmail,
                                      String name,
                                      PetChoice species,
                                      String breed,
                                      int age,
                                      String specialNeeds) {
        User owner = getOwnerByEmail(ownerEmail);
        Pet pet = petRepository.findByIdAndOwnerId(petId, owner.getId())
                .orElseThrow(() -> new IllegalArgumentException("Tier nicht gefunden oder kein Zugriff."));

        pet.setName(name);
        pet.setSpecies(species);
        pet.setBreed(breed);
        pet.setAge(age);
        pet.setSpecialNeeds(specialNeeds);

        return petRepository.save(pet);
    }

    @Transactional
    public Pet uploadImageForOwnerEmail(Long petId, String ownerEmail, MultipartFile image) {
        if (image == null || image.isEmpty()) {
            throw new IllegalArgumentException("Bitte ein Bild hochladen.");
        }
        if (image.getContentType() == null || !image.getContentType().startsWith("image/")) {
            throw new IllegalArgumentException("Nur Bilddateien sind erlaubt.");
        }

        User owner = getOwnerByEmail(ownerEmail);
        Pet pet = petRepository.findByIdAndOwnerId(petId, owner.getId())
                .orElseThrow(() -> new IllegalArgumentException("Tier nicht gefunden oder kein Zugriff."));

        byte[] imageBytes;
        try {
            imageBytes = image.getBytes();
        } catch (IOException e) {
            throw new IllegalArgumentException("Bild konnte nicht gelesen werden.");
        }

        String imageHash = sha256(imageBytes);

        if (imageHash.equals(pet.getImageHash())) {
            return pet;
        }

        if (petRepository.existsByImageHash(imageHash)) {
            throw new IllegalArgumentException("Dieses Foto ist bereits einem anderen Tier zugeordnet.");
        }

        Path uploadDir = Paths.get("uploads", "pets");
        try {
            Files.createDirectories(uploadDir);
            String extension = extractExtension(image.getOriginalFilename());
            Path target = uploadDir.resolve("pet-" + pet.getId() + "-" + UUID.randomUUID() + extension);
            Files.write(target, imageBytes);

            deleteOldImageIfPresent(pet.getImagePath());

            pet.setImagePath(target.toString().replace("\\", "/"));
            pet.setImageHash(imageHash);
            return petRepository.save(pet);
        } catch (IOException e) {
            throw new IllegalArgumentException("Bild konnte nicht gespeichert werden.");
        }
    }


    public void deletePet(Long petId, Long ownerId) {
        Pet pet = petRepository.findById(petId)
                .orElseThrow(() -> new IllegalArgumentException(
                        "Tier mit ID " + petId + " nicht gefunden."));

        if (!pet.getOwner().getId().equals(ownerId)) {
            throw new IllegalArgumentException(
                    "Dieses Tier gehört nicht dem angegebenen User.");
        }

        deleteOldImageIfPresent(pet.getImagePath());
        pet.setImagePath(null);
        pet.setImageHash(null);
        petRepository.delete(pet);
    }

    private User getOwnerByEmail(String ownerEmail) {
        return userRepository.findByEmailIgnoreCase(ownerEmail)
                .orElseThrow(() -> new IllegalArgumentException("User mit E-Mail " + ownerEmail + " nicht gefunden."));
    }

    private String sha256(byte[] bytes) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hash = digest.digest(bytes);
            StringBuilder builder = new StringBuilder();
            for (byte b : hash) {
                builder.append(String.format("%02x", b));
            }
            return builder.toString();
        } catch (NoSuchAlgorithmException e) {
            throw new IllegalStateException("SHA-256 nicht verfuegbar.", e);
        }
    }

    private String extractExtension(String originalFilename) {
        if (originalFilename == null || originalFilename.isBlank()) {
            return ".bin";
        }
        int index = originalFilename.lastIndexOf('.');
        if (index < 0 || index == originalFilename.length() - 1) {
            return ".bin";
        }
        String raw = originalFilename.substring(index).toLowerCase();
        if (raw.length() > 10) {
            return ".bin";
        }
        return raw;
    }

    private void deleteOldImageIfPresent(String oldImagePath) {
        if (oldImagePath == null || oldImagePath.isBlank()) {
            return;
        }
        try {
            Files.deleteIfExists(Paths.get(oldImagePath));
        } catch (IOException ignored) {
            // Alte Dateien sind optionales Cleanup und sollen den Upload nicht blockieren.
        }
    }
}