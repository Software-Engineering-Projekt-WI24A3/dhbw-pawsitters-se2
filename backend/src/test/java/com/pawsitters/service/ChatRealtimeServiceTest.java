package com.pawsitters.service;

import com.pawsitters.dto.ChatEventResponse;
import com.pawsitters.dto.ChatListEventResponse;
import com.pawsitters.dto.ChatMessageResponse;
import com.pawsitters.dto.ChatResponse;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.messaging.simp.SimpMessagingTemplate;

import java.time.Instant;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;

@ExtendWith(MockitoExtension.class)
class ChatRealtimeServiceTest {

    @Mock
    private SimpMessagingTemplate messagingTemplate;

    @Test
    void publishesMessageCreatedToChatTopicAndParticipantQueues() {
        ChatRealtimeService service = new ChatRealtimeService(messagingTemplate);
        ChatMessageResponse message = new ChatMessageResponse(
                11L,
                7L,
                3L,
                "Anna",
                "Meier",
                "Hallo!",
                Instant.parse("2026-05-13T10:15:30Z"),
                List.of()
        );
        ChatResponse chat = new ChatResponse(
                7L,
                19L,
                "Hundebetreuung",
                2L,
                "Lukas",
                "Schmidt",
                3L,
                "Anna",
                "Meier",
                Instant.parse("2026-05-13T10:00:00Z"),
                Instant.parse("2026-05-13T10:15:30Z"),
                "Hallo!"
        );

        service.publishMessageCreated(message, chat, "lukas.schmidt@example.com", "anna.meier@example.com");

        ArgumentCaptor<ChatEventResponse> chatEventCaptor = ArgumentCaptor.forClass(ChatEventResponse.class);
        verify(messagingTemplate).convertAndSend(eq("/topic/chats/7/messages"), chatEventCaptor.capture());
        assertEquals("message.created", chatEventCaptor.getValue().type());
        assertEquals(message, chatEventCaptor.getValue().message());

        ArgumentCaptor<ChatListEventResponse> listEventCaptor = ArgumentCaptor.forClass(ChatListEventResponse.class);
        verify(messagingTemplate).convertAndSendToUser(eq("lukas.schmidt@example.com"), eq("/queue/chats"), listEventCaptor.capture());
        verify(messagingTemplate).convertAndSendToUser(eq("anna.meier@example.com"), eq("/queue/chats"), listEventCaptor.capture());
        assertEquals("chat.updated", listEventCaptor.getAllValues().get(0).type());
        assertEquals(chat, listEventCaptor.getAllValues().get(0).chat());
    }

    @Test
    void publishesAttachmentAddedWithUpdatedMessagePayload() {
        ChatRealtimeService service = new ChatRealtimeService(messagingTemplate);
        ChatMessageResponse message = new ChatMessageResponse(
                12L,
                8L,
                4L,
                "Lukas",
                "Schmidt",
                "",
                Instant.parse("2026-05-13T10:20:30Z"),
                List.of()
        );
        ChatResponse chat = new ChatResponse(
                8L,
                20L,
                "Katzenbetreuung",
                4L,
                "Lukas",
                "Schmidt",
                5L,
                "Sara",
                "Wagner",
                Instant.parse("2026-05-13T10:00:00Z"),
                Instant.parse("2026-05-13T10:20:30Z"),
                ""
        );

        service.publishAttachmentAdded(message, chat, "lukas.schmidt@example.com", "sara.wagner@example.com");

        ArgumentCaptor<ChatEventResponse> chatEventCaptor = ArgumentCaptor.forClass(ChatEventResponse.class);
        verify(messagingTemplate).convertAndSend(eq("/topic/chats/8/messages"), chatEventCaptor.capture());
        assertEquals("message.attachment_added", chatEventCaptor.getValue().type());
        assertEquals(message, chatEventCaptor.getValue().message());
    }
}
