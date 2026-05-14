package com.pawsitters.service;

import com.pawsitters.repository.ChatRepository;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;

import java.util.Locale;

@Service
public class ChatAuthorizationService {

    private final ChatRepository chatRepository;

    public ChatAuthorizationService(ChatRepository chatRepository) {
        this.chatRepository = chatRepository;
    }

    public void assertParticipant(Long chatId, String email) {
        String normalizedEmail = normalizeEmail(email);
        boolean hasAccess = chatRepository.findById(chatId)
                .map(chat -> chat.getHost().getEmail().equalsIgnoreCase(normalizedEmail)
                        || chat.getRequester().getEmail().equalsIgnoreCase(normalizedEmail))
                .orElse(false);

        if (!hasAccess) {
            throw new AccessDeniedException("Kein Zugriff auf diesen Chat.");
        }
    }

    private String normalizeEmail(String email) {
        return email == null ? "" : email.trim().toLowerCase(Locale.ROOT);
    }
}
