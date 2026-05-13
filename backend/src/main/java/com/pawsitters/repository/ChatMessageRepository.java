package com.pawsitters.repository;

import com.pawsitters.model.ChatMessage;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface ChatMessageRepository extends JpaRepository<ChatMessage, Long> {

    @EntityGraph(attributePaths = {"sender", "attachments"})
    List<ChatMessage> findByChatIdOrderByCreatedAtAscIdAsc(Long chatId);

    Optional<ChatMessage> findFirstByChatIdOrderByCreatedAtDescIdDesc(Long chatId);

    @EntityGraph(attributePaths = {"chat", "chat.offer", "chat.host", "chat.requester", "sender", "attachments"})
    @Query("select message from ChatMessage message where message.id = :id")
    Optional<ChatMessage> findByIdWithDetails(@Param("id") Long id);
}
