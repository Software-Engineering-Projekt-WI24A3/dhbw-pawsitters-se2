package com.pawsitters.service;

import com.pawsitters.model.Pet;
import com.pawsitters.model.PetChoice;
import com.pawsitters.model.User;
import com.pawsitters.repository.PetRepository;
import com.pawsitters.repository.UserRepository;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class PetService {

    private final PetRepository petRepository;
    private final UserRepository userRepository;

    public PetService(PetRepository petRepository, UserRepository userRepository) {
        this.petRepository = petRepository;
        this.userRepository = userRepository;
    }

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


    public List<Pet> getPetsByOwner(Long ownerId) {
        return petRepository.findByOwnerId(ownerId);
    }


    public void deletePet(Long petId, Long ownerId) {
        Pet pet = petRepository.findById(petId)
                .orElseThrow(() -> new IllegalArgumentException(
                        "Tier mit ID " + petId + " nicht gefunden."));

        if (!pet.getOwner().getId().equals(ownerId)) {
            throw new IllegalArgumentException(
                    "Dieses Tier gehört nicht dem angegebenen User.");
        }

        petRepository.delete(pet);
    }
}