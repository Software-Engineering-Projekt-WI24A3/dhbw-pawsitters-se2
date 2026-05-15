package com.pawsitters.service;

import com.pawsitters.dto.ChatEventResponse;
import com.pawsitters.dto.ChatListEventResponse;
import com.pawsitters.dto.ChatMessageResponse;
import com.pawsitters.dto.ChatResponse;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

@Service
public class ChatRealtimeService {

    private final SimpMessagingTemplate messagingTemplate;

    public ChatRealtimeService(SimpMessagingTemplate messagingTemplate) {
        this.messagingTemplate = messagingTemplate;
    }

    public void publishMessageCreated(ChatMessageResponse message,
                                      ChatResponse chat,
                                      String hostEmail,
                                      String requesterEmail) {
        publishChatMessageEvent("message.created", message);
        publishChatListEvent(chat, hostEmail, requesterEmail);
    }

    public void publishAttachmentAdded(ChatMessageResponse message,
                                       ChatResponse chat,
                                       String hostEmail,
                                       String requesterEmail) {
        publishChatMessageEvent("message.attachment_added", message);
        publishChatListEvent(chat, hostEmail, requesterEmail);
    }

    public void publishBookingEvent(ChatMessageResponse message,
                                    ChatResponse chat,
                                    String eventType,
                                    String hostEmail,
                                    String requesterEmail) {
        publishChatMessageEvent(eventType, message);
        publishChatListEvent(chat, hostEmail, requesterEmail);
    }

    private void publishChatMessageEvent(String type, ChatMessageResponse message) {
        messagingTemplate.convertAndSend(
                "/topic/chats/" + message.chatId() + "/messages",
                ChatEventResponse.of(type, message)
        );
    }

    private void publishChatListEvent(ChatResponse chat, String hostEmail, String requesterEmail) {
        ChatListEventResponse event = ChatListEventResponse.of("chat.updated", chat);
        messagingTemplate.convertAndSendToUser(hostEmail, "/queue/chats", event);
        messagingTemplate.convertAndSendToUser(requesterEmail, "/queue/chats", event);
    }
}
