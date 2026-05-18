package com.pawsitters.repository;

import com.pawsitters.model.MessageAttachment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface MessageAttachmentRepository extends JpaRepository<MessageAttachment, Long> {

    @Query("""
            select attachment.url
            from MessageAttachment attachment
            where attachment.message.chat.id = :chatId
            """)
    List<String> findUrlsByChatId(@Param("chatId") Long chatId);
}
