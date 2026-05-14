package com.pawsitters.repository;

import com.pawsitters.model.MessageAttachment;
import org.springframework.data.jpa.repository.JpaRepository;

public interface MessageAttachmentRepository extends JpaRepository<MessageAttachment, Long> {
}
