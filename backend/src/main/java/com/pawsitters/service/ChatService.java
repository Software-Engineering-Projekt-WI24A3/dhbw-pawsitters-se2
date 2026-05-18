package com.pawsitters.service;

import com.pawsitters.dto.ChatMessageResponse;
import com.pawsitters.dto.ChatResponse;
import com.pawsitters.dto.MessageAttachmentResponse;
import com.pawsitters.exception.ForbiddenException;
import com.pawsitters.exception.NotFoundException;
import com.pawsitters.model.BookingProposal;
import com.pawsitters.model.Chat;
import com.pawsitters.model.ChatMessage;
import com.pawsitters.model.MessageAttachment;
import com.pawsitters.model.Offer;
import com.pawsitters.model.OfferStatus;
import com.pawsitters.model.User;
import com.pawsitters.repository.BookingProposalRepository;
import com.pawsitters.repository.ChatMessageRepository;
import com.pawsitters.repository.ChatRepository;
import com.pawsitters.repository.MessageAttachmentRepository;
import com.pawsitters.repository.OfferRepository;
import com.pawsitters.repository.UserRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
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
import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.util.Comparator;
import java.util.List;
import java.util.Locale;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;

@Service
public class ChatService {

    private static final int MAX_MESSAGE_LENGTH = 2000;
    private static final String ATTACHMENT_UPLOAD_DIRECTORY = "messages";
    private static final String ATTACHMENT_PUBLIC_PREFIX = "/uploads/messages/";
    private static final Set<String> ALLOWED_IMAGE_EXTENSIONS = Set.of(".jpg", ".jpeg", ".png", ".gif", ".webp", ".bmp");
    private static final Duration DEFAULT_CHAT_AUTO_DELETE_AFTER = Duration.ofHours(24);

    private final ChatRepository chatRepository;
    private final ChatMessageRepository chatMessageRepository;
    private final MessageAttachmentRepository messageAttachmentRepository;
    private final BookingProposalRepository bookingProposalRepository;
    private final OfferRepository offerRepository;
    private final UserRepository userRepository;
    private final ChatRealtimeService chatRealtimeService;
    private final Path uploadRoot;
    private final long maxAttachmentSizeBytes;
    private final Duration chatAutoDeleteAfter;
    private final Clock clock;

    public ChatService(ChatRepository chatRepository,
                       ChatMessageRepository chatMessageRepository,
                       MessageAttachmentRepository messageAttachmentRepository,
                       BookingProposalRepository bookingProposalRepository,
                       OfferRepository offerRepository,
                       UserRepository userRepository,
                       ChatRealtimeService chatRealtimeService,
                       @Value("${app.upload.dir:uploads}") String uploadDir,
                       @Value("${app.chat.attachment.max-size-bytes:5242880}") long maxAttachmentSizeBytes,
                       @Value("${app.chat.auto-delete-after:PT24H}") String chatAutoDeleteAfter) {
        this.chatRepository = chatRepository;
        this.chatMessageRepository = chatMessageRepository;
        this.messageAttachmentRepository = messageAttachmentRepository;
        this.bookingProposalRepository = bookingProposalRepository;
        this.offerRepository = offerRepository;
        this.userRepository = userRepository;
        this.chatRealtimeService = chatRealtimeService;
        this.uploadRoot = Paths.get(uploadDir == null || uploadDir.isBlank() ? "uploads" : uploadDir)
                .toAbsolutePath()
                .normalize();
        this.maxAttachmentSizeBytes = Math.max(1, maxAttachmentSizeBytes);
        this.chatAutoDeleteAfter = parseChatAutoDeleteAfter(chatAutoDeleteAfter);
        this.clock = Clock.systemUTC();
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

    @Transactional
    public List<ChatResponse> getChats(String email) {
        User user = getUserByEmail(email);
        Instant now = clock.instant();
        List<Chat> chats = chatRepository.findByHostIdOrRequesterId(user.getId(), user.getId());
        chats.stream()
                .filter((chat) -> isChatAutoDeleteExpired(chat, now))
                .forEach((chat) -> deleteChatWithRelations(chat, true));

        return chats.stream()
                .filter((chat) -> !isChatAutoDeleteExpired(chat, now))
                .sorted(Comparator
                        .comparing((Chat chat) -> chat.getLastMessageAt() == null ? chat.getCreatedAt() : chat.getLastMessageAt())
                        .reversed()
                        .thenComparing(Chat::getId, Comparator.reverseOrder()))
                .map(this::toChatResponse)
                .toList();
    }

    @Transactional
    public List<ChatMessageResponse> getMessages(Long chatId, String email) {
        assertChatParticipant(chatId, email);
        return chatMessageRepository.findByChatIdOrderByCreatedAtAscIdAsc(chatId).stream()
                .map(ChatMessageResponse::from)
                .toList();
    }

    @Transactional
    public ChatMessageResponse createMessage(Long chatId, String senderEmail, String rawContent) {
        Chat chat = getChatForParticipant(chatId, senderEmail);
        assertChatOpen(chat);
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
        assertChatOpen(chat);

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

    @Transactional
    public ChatResponse closeChat(Long chatId, String actorEmail) {
        Chat chat = getChatForParticipant(chatId, actorEmail);
        if (chat.isClosed()) {
            return toChatResponse(chat);
        }

        User actor = getUserByEmail(actorEmail);
        chat.setClosedAt(clock.instant());
        chat.setClosedByUser(actor);

        ChatMessage systemMessage = new ChatMessage();
        systemMessage.setChat(chat);
        systemMessage.setSender(actor);
        systemMessage.setContent(buildChatClosedMessage(actor));

        ChatMessage savedMessage = chatMessageRepository.save(systemMessage);
        chat.setLastMessageAt(savedMessage.getCreatedAt());

        ChatMessageResponse messageResponse = ChatMessageResponse.from(savedMessage);
        ChatResponse chatResponse = toChatResponse(chat, savedMessage.getContent());
        chatRealtimeService.publishChatClosed(
                messageResponse,
                chatResponse,
                chat.getHost().getEmail(),
                chat.getRequester().getEmail()
        );
        return chatResponse;
    }

    @Transactional
    public ChatResponse reopenChat(Long chatId, String actorEmail) {
        Chat chat = getChatForParticipant(chatId, actorEmail);
        if (!chat.isClosed()) {
            return toChatResponse(chat);
        }

        User actor = getUserByEmail(actorEmail);
        chat.setClosedAt(null);
        chat.setClosedByUser(null);

        ChatMessage systemMessage = new ChatMessage();
        systemMessage.setChat(chat);
        systemMessage.setSender(actor);
        systemMessage.setContent(buildChatReopenedMessage(actor));

        ChatMessage savedMessage = chatMessageRepository.save(systemMessage);
        chat.setLastMessageAt(savedMessage.getCreatedAt());

        ChatMessageResponse messageResponse = ChatMessageResponse.from(savedMessage);
        ChatResponse chatResponse = toChatResponse(chat, savedMessage.getContent());
        chatRealtimeService.publishChatReopened(
                messageResponse,
                chatResponse,
                chat.getHost().getEmail(),
                chat.getRequester().getEmail()
        );
        return chatResponse;
    }

    @Scheduled(fixedDelayString = "${app.chat.cleanup-fixed-delay-ms:30000}")
    @Transactional
    public void cleanupExpiredClosedChatsScheduled() {
        cleanupExpiredClosedChatsInternal();
    }

    @Transactional
    public int cleanupExpiredClosedChats() {
        return cleanupExpiredClosedChatsInternal();
    }

    private Chat getChatForParticipant(Long chatId, String email) {
        Chat chat = chatRepository.findById(chatId)
                .orElseThrow(() -> new NotFoundException("Chat nicht gefunden."));
        assertParticipant(chat, email);
        ensureChatNotExpired(chat);
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

    private void assertChatOpen(Chat chat) {
        if (chat != null && chat.isClosed()) {
            throw new IllegalArgumentException("Dieser Chat wurde bereits beendet.");
        }
    }

    private boolean isChatAutoDeleteExpired(Chat chat, Instant referenceTime) {
        if (chat == null || chat.getClosedAt() == null || referenceTime == null) {
            return false;
        }

        Instant autoDeleteAt = chat.getClosedAt().plus(chatAutoDeleteAfter);
        return !autoDeleteAt.isAfter(referenceTime);
    }

    private void ensureChatNotExpired(Chat chat) {
        if (!isChatAutoDeleteExpired(chat, clock.instant())) {
            return;
        }

        deleteChatWithRelations(chat, true);
        throw new NotFoundException("Chat nicht gefunden.");
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

    private String buildChatClosedMessage(User actor) {
        if (actor == null) {
            return "Chat wurde beendet.";
        }

        String firstName = actor.getFirstName() == null ? "" : actor.getFirstName().trim();
        String lastName = actor.getLastName() == null ? "" : actor.getLastName().trim();
        String displayName = (firstName + " " + lastName).trim();
        if (displayName.isBlank()) {
            displayName = actor.getEmail() == null ? "" : actor.getEmail().trim();
        }

        if (displayName.isBlank()) {
            return "Chat wurde beendet.";
        }

        return displayName + " hat den Chat beendet.";
    }

    private String buildChatReopenedMessage(User actor) {
        if (actor == null) {
            return "Chat wurde erneut geoeffnet.";
        }

        String firstName = actor.getFirstName() == null ? "" : actor.getFirstName().trim();
        String lastName = actor.getLastName() == null ? "" : actor.getLastName().trim();
        String displayName = (firstName + " " + lastName).trim();
        if (displayName.isBlank()) {
            displayName = actor.getEmail() == null ? "" : actor.getEmail().trim();
        }

        if (displayName.isBlank()) {
            return "Chat wurde erneut geoeffnet.";
        }

        return displayName + " hat den Chat erneut geoeffnet.";
    }

    private int cleanupExpiredClosedChatsInternal() {
        Instant expirationThreshold = clock.instant().minus(chatAutoDeleteAfter);
        List<Chat> expiredChats = chatRepository.findByClosedAtIsNotNullAndClosedAtLessThanEqual(expirationThreshold);

        int deletedCount = 0;
        for (Chat expiredChat : expiredChats) {
            Long chatId = expiredChat == null ? null : expiredChat.getId();
            if (chatId == null) {
                continue;
            }

            Optional<Chat> currentChatOptional = chatRepository.findById(chatId);
            if (currentChatOptional.isEmpty()) {
                continue;
            }

            Chat currentChat = currentChatOptional.get();
            Instant closedAt = currentChat.getClosedAt();
            if (closedAt == null || closedAt.isAfter(expirationThreshold)) {
                continue;
            }

            deleteChatWithRelations(currentChat, true);
            deletedCount += 1;
        }

        return deletedCount;
    }

    private void deleteChatWithRelations(Chat chat, boolean publishDeletionEvent) {
        if (chat == null || chat.getId() == null) {
            return;
        }

        Long chatId = chat.getId();
        ChatResponse chatSnapshot = toChatResponse(chat);
        String hostEmail = chat.getHost().getEmail();
        String requesterEmail = chat.getRequester().getEmail();

        List<String> attachmentUrls = messageAttachmentRepository.findUrlsByChatId(chatId);
        List<ChatMessage> messages = chatMessageRepository.findByChatIdOrderByCreatedAtAscIdAsc(chatId);
        List<BookingProposal> proposals = bookingProposalRepository.findByChatId(chatId);

        if (!messages.isEmpty()) {
            chatMessageRepository.deleteAll(messages);
        }
        if (!proposals.isEmpty()) {
            bookingProposalRepository.deleteAll(proposals);
        }
        chatRepository.delete(chat);

        deleteAttachmentFilesBestEffort(attachmentUrls);
        if (publishDeletionEvent) {
            chatRealtimeService.publishChatDeleted(chatSnapshot, hostEmail, requesterEmail);
        }
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

    private Duration parseChatAutoDeleteAfter(String rawValue) {
        if (rawValue == null || rawValue.isBlank()) {
            return DEFAULT_CHAT_AUTO_DELETE_AFTER;
        }

        try {
            Duration parsed = Duration.parse(rawValue.trim());
            if (parsed.isNegative() || parsed.isZero()) {
                return DEFAULT_CHAT_AUTO_DELETE_AFTER;
            }
            return parsed;
        } catch (RuntimeException ignored) {
            return DEFAULT_CHAT_AUTO_DELETE_AFTER;
        }
    }

    private void deleteAttachmentFilesBestEffort(List<String> urls) {
        if (urls == null || urls.isEmpty()) {
            return;
        }

        urls.stream()
                .map(this::resolveAttachmentFilePath)
                .flatMap(Optional::stream)
                .forEach(this::deleteFileBestEffort);
    }

    private Optional<Path> resolveAttachmentFilePath(String url) {
        if (url == null) {
            return Optional.empty();
        }

        String normalizedUrl = url.trim();
        if (!normalizedUrl.startsWith(ATTACHMENT_PUBLIC_PREFIX)) {
            return Optional.empty();
        }

        String filename = normalizedUrl.substring(ATTACHMENT_PUBLIC_PREFIX.length()).trim();
        if (filename.isEmpty()) {
            return Optional.empty();
        }

        Path attachmentDirectory = attachmentUploadDirectory();
        Path targetPath = attachmentDirectory.resolve(filename).normalize();
        if (!targetPath.startsWith(attachmentDirectory)) {
            return Optional.empty();
        }

        return Optional.of(targetPath);
    }
}
