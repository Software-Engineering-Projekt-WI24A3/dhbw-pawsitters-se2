package com.pawsitters.repository;

import com.pawsitters.model.Chat;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface ChatRepository extends JpaRepository<Chat, Long> {

    @Override
    @EntityGraph(attributePaths = {"offer", "host", "requester"})
    Optional<Chat> findById(Long id);

    @EntityGraph(attributePaths = {"offer", "host", "requester"})
    Optional<Chat> findByOfferIdAndRequesterId(Long offerId, Long requesterId);

    @EntityGraph(attributePaths = {"offer", "host", "requester"})
    List<Chat> findByHostIdOrRequesterId(Long hostId, Long requesterId);
}
