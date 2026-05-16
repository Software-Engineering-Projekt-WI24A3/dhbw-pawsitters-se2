package com.pawsitters.service;

import com.pawsitters.dto.BookingProposalResponse;
import com.pawsitters.dto.ChatMessageResponse;
import com.pawsitters.dto.ChatResponse;
import com.pawsitters.exception.ForbiddenException;
import com.pawsitters.exception.NotFoundException;
import com.pawsitters.model.BookingProposal;
import com.pawsitters.model.BookingProposalDeclineReason;
import com.pawsitters.model.BookingProposalStatus;
import com.pawsitters.model.Chat;
import com.pawsitters.model.ChatMessage;
import com.pawsitters.model.ChatMessageType;
import com.pawsitters.model.Offer;
import com.pawsitters.model.OfferStatus;
import com.pawsitters.model.PetChoice;
import com.pawsitters.model.User;
import com.pawsitters.repository.BookingProposalRepository;
import com.pawsitters.repository.ChatMessageRepository;
import com.pawsitters.repository.ChatRepository;
import com.pawsitters.repository.UserRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import java.util.Locale;
import java.util.Set;

@Service
public class BookingProposalService {

    private static final String DEFAULT_CURRENCY = "EUR";
    private static final int MAX_NOTE_LENGTH = 1000;

    private final BookingProposalRepository bookingProposalRepository;
    private final ChatRepository chatRepository;
    private final ChatMessageRepository chatMessageRepository;
    private final UserRepository userRepository;
    private final ChatRealtimeService chatRealtimeService;

    public BookingProposalService(BookingProposalRepository bookingProposalRepository,
                                  ChatRepository chatRepository,
                                  ChatMessageRepository chatMessageRepository,
                                  UserRepository userRepository,
                                  ChatRealtimeService chatRealtimeService) {
        this.bookingProposalRepository = bookingProposalRepository;
        this.chatRepository = chatRepository;
        this.chatMessageRepository = chatMessageRepository;
        this.userRepository = userRepository;
        this.chatRealtimeService = chatRealtimeService;
    }

    @Transactional
    public BookingProposalResponse createProposal(Long chatId,
                                                  String senderEmail,
                                                  LocalDate startDate,
                                                  LocalDate endDate,
                                                  BigDecimal priceTotal,
                                                  Set<PetChoice> petSpecies,
                                                  Integer petCount,
                                                  String note) {
        Chat chat = getChatForParticipant(chatId, senderEmail);
        User sender = getUserByEmail(senderEmail);
        User recipient = resolveRecipient(chat, sender);

        assertOfferPublished(chat.getOffer());
        validateProposalDetails(chat.getOffer(), startDate, endDate, priceTotal, petSpecies, petCount, note);
        declinePendingProposals(chat, Instant.now());

        BookingProposal proposal = new BookingProposal();
        proposal.setChat(chat);
        proposal.setOffer(chat.getOffer());
        proposal.setSender(sender);
        proposal.setRecipient(recipient);
        proposal.setStartDate(startDate);
        proposal.setEndDate(endDate);
        proposal.setPriceTotal(priceTotal);
        proposal.setCurrency(DEFAULT_CURRENCY);
        proposal.setPetSpecies(petSpecies);
        proposal.setPetCount(petCount);
        proposal.setNote(normalizeNote(note));
        proposal.setStatus(BookingProposalStatus.PENDING);

        BookingProposal savedProposal = bookingProposalRepository.save(proposal);
        ChatMessageResponse message = createBookingMessage(
                chat,
                sender,
                savedProposal,
                ChatMessageType.BOOKING_PROPOSAL,
                "Buchungsangebot gesendet."
        );
        publishBookingEvent("booking.proposal_created", message, chat);
        return BookingProposalResponse.from(savedProposal);
    }

    @Transactional
    public BookingProposalResponse acceptProposal(Long proposalId, String actorEmail) {
        BookingProposal proposal = getProposalForParticipant(proposalId, actorEmail);
        assertPending(proposal);
        User actor = getUserByEmail(actorEmail);
        assertRecipient(proposal, actor);
        assertOfferPublished(proposal.getOffer());

        if (bookingProposalRepository.existsByOfferIdAndStatusAndStartDateLessThanEqualAndEndDateGreaterThanEqual(
                proposal.getOffer().getId(),
                BookingProposalStatus.ACCEPTED,
                proposal.getEndDate(),
                proposal.getStartDate()
        )) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Das Angebot ist fuer diesen Zeitraum bereits gebucht.");
        }

        proposal.setStatus(BookingProposalStatus.ACCEPTED);
        proposal.setDeclineReason(null);
        proposal.setRespondedAt(Instant.now());

        BookingProposal savedProposal = bookingProposalRepository.save(proposal);
        ChatMessageResponse message = createBookingMessage(
                savedProposal.getChat(),
                actor,
                savedProposal,
                ChatMessageType.BOOKING_EVENT,
                "Buchungsangebot angenommen."
        );
        publishBookingEvent("booking.proposal_accepted", message, savedProposal.getChat());
        return BookingProposalResponse.from(savedProposal);
    }

    @Transactional
    public BookingProposalResponse declineProposal(Long proposalId, String actorEmail) {
        BookingProposal proposal = getProposalForParticipant(proposalId, actorEmail);
        assertPending(proposal);
        User actor = getUserByEmail(actorEmail);
        assertRecipient(proposal, actor);

        proposal.setStatus(BookingProposalStatus.DECLINED);
        proposal.setDeclineReason(BookingProposalDeclineReason.MANUAL);
        proposal.setRespondedAt(Instant.now());

        BookingProposal savedProposal = bookingProposalRepository.save(proposal);
        ChatMessageResponse message = createBookingMessage(
                savedProposal.getChat(),
                actor,
                savedProposal,
                ChatMessageType.BOOKING_EVENT,
                "Buchungsangebot abgelehnt."
        );
        publishBookingEvent("booking.proposal_declined", message, savedProposal.getChat());
        return BookingProposalResponse.from(savedProposal);
    }

    @Transactional
    public BookingProposalResponse withdrawProposal(Long proposalId, String actorEmail) {
        BookingProposal proposal = getProposalForParticipant(proposalId, actorEmail);
        assertPending(proposal);
        User actor = getUserByEmail(actorEmail);
        assertSender(proposal, actor);

        proposal.setStatus(BookingProposalStatus.WITHDRAWN);
        proposal.setDeclineReason(null);
        proposal.setRespondedAt(Instant.now());

        BookingProposal savedProposal = bookingProposalRepository.save(proposal);
        ChatMessageResponse message = createBookingMessage(
                savedProposal.getChat(),
                actor,
                savedProposal,
                ChatMessageType.BOOKING_EVENT,
                "Buchungsangebot zurueckgezogen."
        );
        publishBookingEvent("booking.proposal_withdrawn", message, savedProposal.getChat());
        return BookingProposalResponse.from(savedProposal);
    }

    @Transactional(readOnly = true)
    public List<BookingProposalResponse> getAcceptedBookingsForUser(String email) {
        return getActiveBookingsForUser(email);
    }

    @Transactional(readOnly = true)
    public List<BookingProposalResponse> getActiveBookingsForUser(String email) {
        User user = getUserByEmail(email);
        return bookingProposalRepository.findByStatusForParticipant(BookingProposalStatus.ACCEPTED, user.getId()).stream()
                .map(BookingProposalResponse::from)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<BookingProposalResponse> getCompletedBookingsForUser(String email) {
        User user = getUserByEmail(email);
        return bookingProposalRepository.findByStatusForParticipantOrderByEndDateDesc(BookingProposalStatus.COMPLETED, user.getId()).stream()
                .map(BookingProposalResponse::from)
                .toList();
    }

    @Transactional
    public BookingProposalResponse completeBooking(Long bookingId, String actorEmail) {
        BookingProposal proposal = getProposalForParticipant(bookingId, actorEmail);
        if (proposal.getStatus() != BookingProposalStatus.ACCEPTED) {
            throw new IllegalArgumentException("Nur angenommene Buchungen koennen abgeschlossen werden.");
        }

        User actor = getUserByEmail(actorEmail);
        proposal.setStatus(BookingProposalStatus.COMPLETED);

        BookingProposal savedProposal = bookingProposalRepository.save(proposal);
        ChatMessageResponse message = createBookingMessage(
                savedProposal.getChat(),
                actor,
                savedProposal,
                ChatMessageType.BOOKING_EVENT,
                "Buchung abgeschlossen."
        );
        publishBookingEvent("booking.completed", message, savedProposal.getChat());
        return BookingProposalResponse.from(savedProposal);
    }

    private void declinePendingProposals(Chat chat, Instant respondedAt) {
        bookingProposalRepository.findByChatIdAndStatus(chat.getId(), BookingProposalStatus.PENDING)
                .forEach(proposal -> {
                    proposal.setStatus(BookingProposalStatus.DECLINED);
                    proposal.setDeclineReason(BookingProposalDeclineReason.REPLACED_BY_NEW_PROPOSAL);
                    proposal.setRespondedAt(respondedAt);
                    bookingProposalRepository.save(proposal);
                });
    }

    private ChatMessageResponse createBookingMessage(Chat chat,
                                                     User sender,
                                                     BookingProposal proposal,
                                                     ChatMessageType type,
                                                     String content) {
        ChatMessage message = new ChatMessage();
        message.setChat(chat);
        message.setSender(sender);
        message.setType(type);
        message.setContent(content);
        message.setBookingProposal(proposal);

        ChatMessage savedMessage = chatMessageRepository.save(message);
        chat.setLastMessageAt(savedMessage.getCreatedAt());
        return ChatMessageResponse.from(savedMessage);
    }

    private void publishBookingEvent(String eventType, ChatMessageResponse message, Chat chat) {
        ChatResponse chatResponse = ChatResponse.from(chat, message.content());
        chatRealtimeService.publishBookingEvent(message, chatResponse, eventType, chat.getHost().getEmail(), chat.getRequester().getEmail());
    }

    private BookingProposal getProposalForParticipant(Long proposalId, String email) {
        BookingProposal proposal = bookingProposalRepository.findById(proposalId)
                .orElseThrow(() -> new NotFoundException("Buchungsangebot nicht gefunden."));
        assertParticipant(proposal.getChat(), email);
        return proposal;
    }

    private Chat getChatForParticipant(Long chatId, String email) {
        Chat chat = chatRepository.findById(chatId)
                .orElseThrow(() -> new NotFoundException("Chat nicht gefunden."));
        assertParticipant(chat, email);
        return chat;
    }

    private void assertParticipant(Chat chat, String email) {
        String normalizedEmail = normalizeEmail(email);
        if (!chat.getHost().getEmail().equalsIgnoreCase(normalizedEmail)
                && !chat.getRequester().getEmail().equalsIgnoreCase(normalizedEmail)) {
            throw new ForbiddenException("Kein Zugriff auf diesen Chat.");
        }
    }

    private void assertPending(BookingProposal proposal) {
        if (proposal.getStatus() != BookingProposalStatus.PENDING) {
            throw new IllegalArgumentException("Nur offene Buchungsangebote koennen beantwortet werden.");
        }
    }

    private void assertOfferPublished(Offer offer) {
        if (offer.getStatus() != OfferStatus.PUBLISHED) {
            throw new IllegalArgumentException("Buchungsangebote sind nur fuer veroeffentlichte Angebote moeglich.");
        }
    }

    private void assertRecipient(BookingProposal proposal, User actor) {
        if (!proposal.getRecipient().getId().equals(actor.getId())) {
            throw new ForbiddenException("Nur der Empfaenger darf dieses Buchungsangebot beantworten.");
        }
    }

    private void assertSender(BookingProposal proposal, User actor) {
        if (!proposal.getSender().getId().equals(actor.getId())) {
            throw new ForbiddenException("Nur der Sender darf dieses Buchungsangebot zurueckziehen.");
        }
    }

    private User resolveRecipient(Chat chat, User sender) {
        if (chat.getHost().getId().equals(sender.getId())) {
            return chat.getRequester();
        }
        if (chat.getRequester().getId().equals(sender.getId())) {
            return chat.getHost();
        }
        throw new ForbiddenException("Kein Zugriff auf diesen Chat.");
    }

    private void validateProposalDetails(Offer offer,
                                         LocalDate startDate,
                                         LocalDate endDate,
                                         BigDecimal priceTotal,
                                         Set<PetChoice> petSpecies,
                                         Integer petCount,
                                         String note) {
        if (startDate == null || endDate == null) {
            throw new IllegalArgumentException("Bitte gib einen gueltigen Betreuungszeitraum an.");
        }
        if (endDate.isBefore(startDate)) {
            throw new IllegalArgumentException("Der Zeitraum ist ungueltig: Enddatum liegt vor dem Startdatum.");
        }
        if (offer.getAvailableFrom() == null || offer.getAvailableTo() == null
                || startDate.isBefore(offer.getAvailableFrom())
                || endDate.isAfter(offer.getAvailableTo())) {
            throw new IllegalArgumentException("Der Zeitraum liegt ausserhalb der Angebotsverfuegbarkeit ("
                    + offer.getAvailableFrom() + " bis " + offer.getAvailableTo() + ").");
        }
        if (priceTotal == null || priceTotal.compareTo(BigDecimal.ZERO) <= 0) {
            throw new IllegalArgumentException("Der Gesamtpreis muss groesser als 0 sein.");
        }
        if (petSpecies == null || petSpecies.isEmpty() || !offer.getAcceptedPetSpecies().containsAll(petSpecies)) {
            throw new IllegalArgumentException("Mindestens eine Tierart wird vom Angebot nicht unterstuetzt.");
        }
        if (petCount == null || petCount < 1) {
            throw new IllegalArgumentException("Die Anzahl der Tiere muss mindestens 1 sein.");
        }
        if (petCount < petSpecies.size()) {
            throw new IllegalArgumentException("Die Anzahl der Tiere muss mindestens der Anzahl der Tierarten entsprechen.");
        }
        if (note != null && note.length() > MAX_NOTE_LENGTH) {
            throw new IllegalArgumentException("Die Notiz darf hoechstens 1000 Zeichen lang sein.");
        }
    }

    private User getUserByEmail(String email) {
        return userRepository.findByEmailIgnoreCase(email)
                .orElseThrow(() -> new NotFoundException("User nicht gefunden."));
    }

    private String normalizeEmail(String email) {
        return email == null ? "" : email.trim().toLowerCase(Locale.ROOT);
    }

    private String normalizeNote(String rawNote) {
        if (rawNote == null) {
            return null;
        }
        String note = rawNote.trim();
        return note.isEmpty() ? null : note;
    }
}
