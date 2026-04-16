package com.pawsitters.repository;

import com.pawsitters.model.Pet;
import com.pawsitters.model.PetChoice;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface PetRepository extends JpaRepository<Pet, Long> {

    // Alle Tiere eines Besitzers
    List<Pet> findByOwnerId(Long ownerId);

    // Tiere nach Art filtern (z.B. alle Hunde)
    List<Pet> findBySpecies(PetChoice species);
}