package com.pawsitters.repository;

import com.pawsitters.model.HostProfile;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface HostProfileRepository extends JpaRepository<HostProfile, Long> {

    @EntityGraph(attributePaths = {"host", "host.acceptedPetSpecies"})
    Optional<HostProfile> findByHostId(Long hostId);
}
