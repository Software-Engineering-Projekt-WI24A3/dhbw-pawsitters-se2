package com.pawsitters.service;

import com.pawsitters.dto.ChatMessageResponse;
import com.pawsitters.dto.ChatResponse;
import com.pawsitters.dto.MessageAttachmentResponse;
import com.pawsitters.exception.ForbiddenException;
import com.pawsitters.exception.NotFoundException;
import com.pawsitters.model.Chat;
import com.pawsitters.model.ChatMessage;
import com.pawsitters.model.MessageAttachment;
import com.pawsitters.model.Offer;
import com.pawsitters.model.OfferStatus;
import com.pawsitters.model.User;
import com.pawsitters.repository.ChatMessageRepository;
import com.pawsitters.repository.ChatRepository;
import com.pawsitters.repository.MessageAttachmentRepository;
import com.pawsitters.repository.OfferRepository;
import com.pawsitters.repository.UserRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import javax.imageio.ImageIO;
import java.awt.image.BufferedImage;
import java.io.ByteArrayInputStream;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.Instant;
import java.util.Comparator;
import java.util.List;
import java.util.Locale;
import java.util.Set;
import java.util.UUID;

@Service
public class ChatService {

    private static final int MAX_MESSAGE_LENGTH = 2000;
    private static final String ATTACHMENT_UPLOAD_DIRECTORY = "messages";
    private static final String ATTACHMENT_PUBLIC_PREFIX = "/uploads/messages/";
    private static final Set<String> ALLOWED_IMAGE_EXTENSIONS = Set.of(".jpg", ".jpeg", ".png", ".gif", ".webp", ".bmp");

    private final ChatRepository chatRepository;
    private final ChatMessageRepository chatMessageRepository;
    private final MessageAttachmentRepository messageAttachmentRepository;
    private final OfferRepository offerRepository;
    private final UserRepository userRepository;
    private final ChatRealtimeService chatRealtimeService;
    private final Path uploadRoot;
    private final long maxAttachmentSizeBytes;

    public ChatService(ChatRepository chatRepository,
                       ChatMessageRepository chatMessageRepository,
                       MessageAttachmentRepository messageAttachmentRepository,
                       OfferRepository offerRepository,
                       UserRepository userRepository,
                       ChatRealtimeService chatRealtimeService,
                       @Value("${app.upload.dir:uploads}") String uploadDir,
                       @Value("${app.chat.attachment.max-size-bytes:5242880}") long maxAttachmentSizeBytes) {
        this.chatRepository = chatRepository;
        this.chatMessageRepository = chatMessageRepository;
        this.messageAttachmentRepository = messageAttachmentRepository;
        this.offerRepository = offerRepository;
        this.userRepository = userRepository;
        this.chatRealtimeService = chatRealtimeService;
        this.uploadRoot = Paths.get(uploadDir == null || uploadDir.isBlank() ? "uploads" : uploadDir)
                .toAbsolutePath()
                .normalize();
        this.maxAttachmentSizeBytes = Math.max(1, maxAttachmentSizeBytes);
    }

    @Transactional
    public ChatResponse createOrGetChat(Long offerId, String requesterEmail) {
        User requester = getUserByEmail(requesterEmail);
        Offer offer = offerRepository.findById(offerId)
                .orElseThrow(() -> new NotFoundException("Angebot nicht gefunden."));

        if (offer.getStatus() != OfferStatus.PUBLISHED) {
            throw new IllegalArgumentException("Chats koennen nur fuer veroeffentlichte Angebote erstellt werden.");
        }
        if (offer.getHost().getId().equals(requester.getId())) {
            throw new IllegalArgumentException("Gastgeber koennen keinen Chat mit dem eigenen Angebot starten.");
        }

        Chat chat = chatRepository.findByOfferIdAndRequesterId(offer.getId(), requester.getId())
                .orElseGet(() -> {
                    Chat nextChat = new Chat();
                    nextChat.setOffer(offer);
                    nextChat.setHost(offer.getHost());
                    nextChat.setRequester(requester);
                    return chatRepository.save(nextChat);
                });

        return toChatResponse(chat);
    }

    @Transactional(readOnly = true)
    public List<ChatResponse> getChats(String email) {
        User user = getUserByEmail(email);
        return chatRepository.findByHostIdOrRequesterId(user.getId(), user.getId()).stream()
                .sorted(Comparator
                        .comparing((Chat chat) -> chat.getLastMessageAt() == null ? chat.getCreatedAt() : chat.getLastMessageAt())
                        .reversed()
                        .thenComparing(Chat::getId, Comparator.reverseOrder()))
                .map(this::toChatResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<ChatMessageResponse> getMessages(Long chatId, String email) {
        assertChatParticipant(chatId, email);
        return chatMessageRepository.findByChatIdOrderByCreatedAtAscIdAsc(chatId).stream()
                .map(ChatMessageResponse::from)
                .toList();
    }

    @Transactional
    public ChatMessageResponse createMessage(Long chatId, String senderEmail, String rawContent) {
        Chat chat = getChatForParticipant(chatId, senderEmail);
        User sender = getUserByEmail(senderEmail);
        String content = normalizeMessageContent(rawContent);

        ChatMessage message = new ChatMessage();
        message.setChat(chat);
        message.setSender(sender);
        message.setContent(content);
        ChatMessage savedMessage = chatMessageRepository.save(message);

        chat.setLastMessageAt(savedMessage.getCreatedAt());
        ChatResponse chatResponse = toChatResponse(chat, savedMessage.getContent());
        ChatMessageResponse response = ChatMessageResponse.from(savedMessage);
        chatRealtimeService.publishMessageCreated(response, chatResponse, chat.getHost().getEmail(), chat.getRequester().getEmail());
        return response;
    }

    @Transactional
    public MessageAttachmentResponse uploadAttachment(Long messageId, String uploaderEmail, MultipartFile image) {
        ChatMessage message = chatMessageRepository.findByIdWithDetails(messageId)
                .orElseThrow(() -> new NotFoundException("Nachricht nicht gefunden."));
        Chat chat = message.getChat();
        assertParticipant(chat, uploaderEmail);

        byte[] imageBytes = validateAndReadImage(image);
        String extension = extractExtension(image.getOriginalFilename());
        if (!ALLOWED_IMAGE_EXTENSIONS.contains(extension)) {
            throw new IllegalArgumentException("Nur JPEG, PNG, GIF, WebP und BMP Dateien sind erlaubt.");
        }

        Path uploadDirectory = attachmentUploadDirectory();
        String filename = "message-" + message.getId() + "-" + UUID.randomUUID() + extension;
        Path target = uploadDirectory.resolve(filename).normalize();
        if (!target.startsWith(uploadDirectory)) {
            throw new IllegalArgumentException("Ungueltiger Dateiname.");
        }

        try {
            Files.createDirectories(uploadDirectory);
            Files.write(target, imageBytes);
        } catch (IOException e) {
            throw new IllegalArgumentException("Bild konnte nicht gespeichert werden.");
        }

        MessageAttachment attachment = new MessageAttachment();
        attachment.setMessage(message);
        attachment.setUrl(ATTACHMENT_PUBLIC_PREFIX + filename);
        attachment.setOriginalFilename(sanitizeOriginalFilename(image.getOriginalFilename()));
        attachment.setContentType(normalizeContentType(image.getContentType()));
        attachment.setSizeBytes((long) imageBytes.length);

        try {
            MessageAttachment savedAttachment = messageAttachmentRepository.save(attachment);
            message.getAttachments().add(savedAttachment);
            chat.setLastMessageAt(savedAttachment.getCreatedAt());

            ChatResponse chatResponse = toChatResponse(chat, message.getContent());
            ChatMessageResponse messageResponse = ChatMessageResponse.from(message);
            chatRealtimeService.publishAttachmentAdded(messageResponse, chatResponse, chat.getHost().getEmail(), chat.getRequester().getEmail());
            return MessageAttachmentResponse.from(savedAttachment);
        } catch (RuntimeException e) {
            deleteFileBestEffort(target);
            throw e;
        }
    }

    private Chat getChatForParticipant(Long chatId, String email) {
        Chat chat = chatRepository.findById(chatId)
                .orElseThrow(() -> new NotFoundException("Chat nicht gefunden."));
        assertParticipant(chat, email);
        return chat;
    }

    private void assertChatParticipant(Long chatId, String email) {
        getChatForParticipant(chatId, email);
    }

    private void assertParticipant(Chat chat, String email) {
        String normalizedEmail = normalizeEmail(email);
        if (!chat.getHost().getEmail().equalsIgnoreCase(normalizedEmail)
                && !chat.getRequester().getEmail().equalsIgnoreCase(normalizedEmail)) {
            throw new ForbiddenException("Kein Zugriff auf diesen Chat.");
        }
    }

    private User getUserByEmail(String email) {
        return userRepository.findByEmailIgnoreCase(email)
                .orElseThrow(() -> new NotFoundException("User nicht gefunden."));
    }

    private String normalizeEmail(String email) {
        return email == null ? "" : email.trim().toLowerCase(Locale.ROOT);
    }

    private String normalizeMessageContent(String rawContent) {
        String content = rawContent == null ? "" : rawContent.trim();
        if (content.length() > MAX_MESSAGE_LENGTH) {
            throw new IllegalArgumentException("Nachrichten duerfen hoechstens 2000 Zeichen lang sein.");
        }
        return content;
    }

    private byte[] validateAndReadImage(MultipartFile image) {
        if (image == null || image.isEmpty()) {
            throw new IllegalArgumentException("Bitte ein Bild hochladen.");
        }
        if (image.getSize() > maxAttachmentSizeBytes) {
            throw new IllegalArgumentException("Bild darf hoechstens 5 MB gross sein.");
        }

        String contentType = image.getContentType();
        if (contentType == null || !contentType.toLowerCase(Locale.ROOT).startsWith("image/")) {
            throw new IllegalArgumentException("Nur Bilddateien sind erlaubt.");
        }

        byte[] imageBytes;
        try {
            imageBytes = image.getBytes();
        } catch (IOException e) {
            throw new IllegalArgumentException("Bild konnte nicht gelesen werden.");
        }

        try (ByteArrayInputStream inputStream = new ByteArrayInputStream(imageBytes)) {
            BufferedImage bufferedImage = ImageIO.read(inputStream);
            if (bufferedImage == null) {
                throw new IllegalArgumentException("Die Datei ist kein gueltiges Bild.");
            }
        } catch (IOException e) {
            throw new IllegalArgumentException("Die Datei ist kein gueltiges Bild.");
        }

        return imageBytes;
    }

    private String extractExtension(String originalFilename) {
        if (originalFilename == null || originalFilename.isBlank()) {
            return ".bin";
        }
        int index = originalFilename.lastIndexOf('.');
        if (index < 0 || index == originalFilename.length() - 1) {
            return ".bin";
        }
        String raw = originalFilename.substring(index).toLowerCase(Locale.ROOT);
        if (raw.length() > 10 || !raw.matches("\\.[a-z0-9]+")) {
            return ".bin";
        }
        return raw;
    }

    private String sanitizeOriginalFilename(String originalFilename) {
        if (originalFilename == null || originalFilename.isBlank()) {
            return "image";
        }
        String normalized = originalFilename.trim().replace('\\', '/');
        int lastSlash = normalized.lastIndexOf('/');
        String filename = lastSlash >= 0 ? normalized.substring(lastSlash + 1) : normalized;
        return filename.isBlank() ? "image" : filename;
    }

    private String normalizeContentType(String contentType) {
        return contentType == null || contentType.isBlank()
                ? "application/octet-stream"
                : contentType.trim().toLowerCase(Locale.ROOT);
    }

    private Path attachmentUploadDirectory() {
        return uploadRoot.resolve(ATTACHMENT_UPLOAD_DIRECTORY).normalize();
    }

    private ChatResponse toChatResponse(Chat chat) {
        String preview = chatMessageRepository.findFirstByChatIdOrderByCreatedAtDescIdDesc(chat.getId())
                .map(ChatMessage::getContent)
                .orElse("");
        return toChatResponse(chat, preview);
    }

    private ChatResponse toChatResponse(Chat chat, String lastMessagePreview) {
        return ChatResponse.from(chat, lastMessagePreview == null ? "" : lastMessagePreview);
    }

    private void deleteFileBestEffort(Path target) {
        try {
            Files.deleteIfExists(target);
        } catch (IOException ignored) {
            // Upload-Cleanup darf den API-Fehler nicht ueberdecken.
        }
    }
}
