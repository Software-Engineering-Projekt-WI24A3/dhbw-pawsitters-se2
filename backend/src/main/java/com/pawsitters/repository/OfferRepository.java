package com.pawsitters.repository;

import com.pawsitters.model.Offer;
import com.pawsitters.model.OfferStatus;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface OfferRepository extends JpaRepository<Offer, Long> {

    @EntityGraph(attributePaths = {"host", "acceptedPetSpecies", "services"})
    @Query("""
            select offer
            from Offer offer
            where offer.id = :id
              and lower(offer.host.email) = lower(:hostEmail)
            """)
    Optional<Offer> findByIdAndHostEmail(@Param("id") Long id, @Param("hostEmail") String hostEmail);

    @EntityGraph(attributePaths = {"host", "acceptedPetSpecies", "services"})
    List<Offer> findByStatus(OfferStatus status);
}
