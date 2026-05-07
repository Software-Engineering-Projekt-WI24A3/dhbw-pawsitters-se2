package com.pawsitters.repository;

import com.pawsitters.model.PetChoice;
import com.pawsitters.model.User;
import com.pawsitters.model.UserRole;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface UserRepository extends JpaRepository<User, Long> {
    boolean existsByEmailIgnoreCase(String email);

    Optional<User> findByEmailIgnoreCase(String email);

    @EntityGraph(attributePaths = "acceptedPetSpecies")
    @Query("""
            select distinct user
            from User user
            where user.role = :role
            """)
    List<User> findByRole(@Param("role") UserRole role);

    @EntityGraph(attributePaths = "acceptedPetSpecies")
    @Query("""
            select distinct user
            from User user
            left join user.acceptedPetSpecies species
            where user.role = com.pawsitters.model.UserRole.HOST
              and (:species is null or species = :species)
              and (:postalCode is null or lower(user.postalCode) = lower(:postalCode))
            """)
    List<User> searchHosts(@Param("species") PetChoice species,
                           @Param("postalCode") String postalCode);
}
