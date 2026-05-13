package com.pawsitters.service;

import com.pawsitters.model.Chat;
import com.pawsitters.model.User;
import com.pawsitters.repository.ChatRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.access.AccessDeniedException;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class ChatAuthorizationServiceTest {

    @Mock
    private ChatRepository chatRepository;

    @Test
    void allowsHostAndRequesterCaseInsensitively() {
        ChatAuthorizationService service = new ChatAuthorizationService(chatRepository);
        when(chatRepository.findById(7L)).thenReturn(Optional.of(chat()));

        assertDoesNotThrow(() -> service.assertParticipant(7L, "HOST@EXAMPLE.COM"));
        assertDoesNotThrow(() -> service.assertParticipant(7L, "requester@example.com"));
    }

    @Test
    void rejectsStrangersAndMissingChats() {
        ChatAuthorizationService service = new ChatAuthorizationService(chatRepository);
        when(chatRepository.findById(7L)).thenReturn(Optional.of(chat()));
        when(chatRepository.findById(99L)).thenReturn(Optional.empty());

        assertThrows(AccessDeniedException.class, () -> service.assertParticipant(7L, "stranger@example.com"));
        assertThrows(AccessDeniedException.class, () -> service.assertParticipant(99L, "host@example.com"));
    }

    private Chat chat() {
        User host = new User();
        host.setEmail("host@example.com");

        User requester = new User();
        requester.setEmail("requester@example.com");

        Chat chat = new Chat();
        chat.setHost(host);
        chat.setRequester(requester);
        return chat;
    }
}
