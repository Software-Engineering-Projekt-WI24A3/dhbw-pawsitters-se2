package com.pawsitters.controller;

import com.pawsitters.security.JwtService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;
import tools.jackson.databind.JsonNode;
import tools.jackson.databind.ObjectMapper;

import javax.imageio.ImageIO;
import java.awt.image.BufferedImage;
import java.io.ByteArrayOutputStream;
import java.math.BigDecimal;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

import static org.hamcrest.MatcherAssert.assertThat;
import static org.hamcrest.Matchers.containsInAnyOrder;
import static org.hamcrest.Matchers.endsWith;
import static org.hamcrest.Matchers.hasItem;
import static org.hamcrest.Matchers.not;
import static org.hamcrest.Matchers.startsWith;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.multipart;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
class ChatIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private JwtService jwtService;

    @Test
    void messagesAreReturnedChronologicallyAndOnlyParticipantsCanReadThem() throws Exception {
        String hostToken = jwtService.generateToken("lukas.schmidt@example.com", "HOST");
        String requesterToken = jwtService.generateToken("anna.meier@example.com", "PET_OWNER");
        String strangerToken = jwtService.generateToken("sara.wagner@example.com", "PET_OWNER");

        Long offerId = createPublishedOffer(hostToken);
        Long chatId = createChat(requesterToken, offerId);

        Long repeatedChatId = createChat(requesterToken, offerId);
        assertEquals(chatId, repeatedChatId, "Creating the same offer chat twice should return the existing chat.");

        createMessage(requesterToken, chatId, "Erste Nachricht");
        createMessage(hostToken, chatId, "Zweite Nachricht");
        createMessage(requesterToken, chatId, "Dritte Nachricht");

        mockMvc.perform(get("/api/chats/{id}/messages", chatId)
                        .header("Authorization", "Bearer " + hostToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.meta.total").value(3))
                .andExpect(jsonPath("$.data[0].content").value("Erste Nachricht"))
                .andExpect(jsonPath("$.data[1].content").value("Zweite Nachricht"))
                .andExpect(jsonPath("$.data[2].content").value("Dritte Nachricht"));

        mockMvc.perform(get("/api/chats/{id}/messages", chatId)
                        .header("Authorization", "Bearer " + strangerToken))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.error.code").value("ACCESS_DENIED"));
    }

    @Test
    void imageAttachmentUploadReturnsFetchableUrlAndRejectsInvalidFiles() throws Exception {
        String hostToken = jwtService.generateToken("lukas.schmidt@example.com", "HOST");
        String requesterToken = jwtService.generateToken("anna.meier@example.com", "PET_OWNER");

        Long offerId = createPublishedOffer(hostToken);
        Long chatId = createChat(requesterToken, offerId);
        Long messageId = createMessage(requesterToken, chatId, "Hier ist ein Bild.");

        MockMultipartFile image = new MockMultipartFile(
                "image",
                "chat.png",
                "image/png",
                createMinimalPng(0x2E7D32)
        );

        MvcResult uploadResult = mockMvc.perform(multipart("/api/messages/{id}/attachments", messageId)
                        .file(image)
                        .header("Authorization", "Bearer " + hostToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.url").isString())
                .andExpect(jsonPath("$.data.contentType").value("image/png"))
                .andReturn();

        String attachmentUrl = objectMapper.readTree(uploadResult.getResponse().getContentAsString())
                .get("data")
                .get("url")
                .asText();
        assertThat(attachmentUrl, startsWith("/uploads/messages/message-" + messageId + "-"));
        assertThat(attachmentUrl, endsWith(".png"));

        mockMvc.perform(get(attachmentUrl))
                .andExpect(status().isOk());

        MockMultipartFile textFile = new MockMultipartFile(
                "image",
                "note.txt",
                "text/plain",
                "not an image".getBytes()
        );

        mockMvc.perform(multipart("/api/messages/{id}/attachments", messageId)
                        .file(textFile)
                        .header("Authorization", "Bearer " + requesterToken))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.error.code").value("BAD_REQUEST"));
    }

    @Test
    void attachmentUploadIsRestrictedToChatParticipants() throws Exception {
        String hostToken = jwtService.generateToken("lukas.schmidt@example.com", "HOST");
        String requesterToken = jwtService.generateToken("anna.meier@example.com", "PET_OWNER");
        String strangerToken = jwtService.generateToken("sara.wagner@example.com", "PET_OWNER");

        Long offerId = createPublishedOffer(hostToken);
        Long chatId = createChat(requesterToken, offerId);
        Long messageId = createMessage(requesterToken, chatId, "Privates Bild.");

        MockMultipartFile image = new MockMultipartFile(
                "image",
                "private.png",
                "image/png",
                createMinimalPng(0x1565C0)
        );

        mockMvc.perform(multipart("/api/messages/{id}/attachments", messageId)
                        .file(image)
                        .header("Authorization", "Bearer " + strangerToken))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.error.code").value("ACCESS_DENIED"));
    }

    @Test
    void bookingProposalFromPetOwnerCanBeAcceptedByHostAndAppearsInChat() throws Exception {
        String hostToken = jwtService.generateToken("lukas.schmidt@example.com", "HOST");
        String requesterToken = jwtService.generateToken("anna.meier@example.com", "PET_OWNER");

        Long offerId = createPublishedOffer(hostToken, List.of("DOG", "CAT"));
        Long chatId = createChat(requesterToken, offerId);
        Long proposalId = createBookingProposal(
                requesterToken,
                chatId,
                "2026-07-01",
                "2026-07-02",
                "120.00",
                2,
                "DOG",
                "CAT"
        );

        mockMvc.perform(patch("/api/booking-proposals/{id}/accept", proposalId)
                        .header("Authorization", "Bearer " + hostToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.status").value("ACCEPTED"))
                .andExpect(jsonPath("$.data.petSpecies", containsInAnyOrder("DOG", "CAT")))
                .andExpect(jsonPath("$.data.petCount").value(2))
                .andExpect(jsonPath("$.data.priceTotal").value(120.00));

        mockMvc.perform(get("/api/chats/{id}/messages", chatId)
                        .header("Authorization", "Bearer " + requesterToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.meta.total").value(2))
                .andExpect(jsonPath("$.data[0].type").value("BOOKING_PROPOSAL"))
                .andExpect(jsonPath("$.data[0].bookingProposal.id").value(proposalId))
                .andExpect(jsonPath("$.data[0].bookingProposal.status").value("ACCEPTED"))
                .andExpect(jsonPath("$.data[1].type").value("BOOKING_EVENT"))
                .andExpect(jsonPath("$.data[1].bookingProposal.status").value("ACCEPTED"));

        mockMvc.perform(get("/api/bookings")
                        .header("Authorization", "Bearer " + hostToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data[*].id", hasItem(proposalId.intValue())));

        mockMvc.perform(get("/api/bookings")
                        .header("Authorization", "Bearer " + requesterToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data[*].id", hasItem(proposalId.intValue())));
    }

    @Test
    void acceptedBookingCanBeCompletedAndMovesFromActiveToHistory() throws Exception {
        String hostToken = jwtService.generateToken("lukas.schmidt@example.com", "HOST");
        String requesterToken = jwtService.generateToken("anna.meier@example.com", "PET_OWNER");
        String strangerToken = jwtService.generateToken("sara.wagner@example.com", "PET_OWNER");

        Long offerId = createPublishedOffer(hostToken);
        Long chatId = createChat(requesterToken, offerId);
        Long proposalId = createBookingProposal(
                requesterToken,
                chatId,
                "2026-07-04",
                "2026-07-05",
                "120.00",
                1,
                "DOG"
        );

        mockMvc.perform(patch("/api/booking-proposals/{id}/accept", proposalId)
                        .header("Authorization", "Bearer " + hostToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.status").value("ACCEPTED"));

        mockMvc.perform(get("/api/bookings/active")
                        .header("Authorization", "Bearer " + requesterToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data[*].id", hasItem(proposalId.intValue())));

        mockMvc.perform(patch("/api/bookings/{id}/complete", proposalId)
                        .header("Authorization", "Bearer " + strangerToken))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.error.code").value("ACCESS_DENIED"));

        mockMvc.perform(patch("/api/bookings/{id}/complete", proposalId)
                        .header("Authorization", "Bearer " + requesterToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.status").value("COMPLETED"));

        mockMvc.perform(get("/api/bookings/active")
                        .header("Authorization", "Bearer " + hostToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data[*].id", not(hasItem(proposalId.intValue()))));

        mockMvc.perform(get("/api/bookings/history")
                        .header("Authorization", "Bearer " + hostToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data[*].id", hasItem(proposalId.intValue())));

        mockMvc.perform(patch("/api/bookings/{id}/complete", proposalId)
                        .header("Authorization", "Bearer " + hostToken))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error.code").value("BAD_REQUEST"));
    }

    @Test
    void bookingProposalAllowsSingleDayAtOfferAvailabilityStart() throws Exception {
        String hostToken = jwtService.generateToken("lukas.schmidt@example.com", "HOST");
        String requesterToken = jwtService.generateToken("anna.meier@example.com", "PET_OWNER");

        Long offerId = createPublishedOffer(hostToken, List.of("DOG"), "2026-07-01", "2026-07-02");
        Long chatId = createChat(requesterToken, offerId);

        mockMvc.perform(post("/api/chats/{id}/booking-proposals", chatId)
                        .header("Authorization", "Bearer " + requesterToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(buildBookingProposalPayload(
                                "2026-07-01",
                                "2026-07-01",
                                "39.90",
                                1,
                                "DOG"
                        ))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.startDate").value("2026-07-01"))
                .andExpect(jsonPath("$.data.endDate").value("2026-07-01"))
                .andExpect(jsonPath("$.data.status").value("PENDING"));
    }

    @Test
    void bookingProposalFromHostCanBeAcceptedOnlyByPetOwner() throws Exception {
        String hostToken = jwtService.generateToken("lukas.schmidt@example.com", "HOST");
        String requesterToken = jwtService.generateToken("anna.meier@example.com", "PET_OWNER");

        Long offerId = createPublishedOffer(hostToken);
        Long chatId = createChat(requesterToken, offerId);
        Long proposalId = createBookingProposal(
                hostToken,
                chatId,
                "2026-07-03",
                "2026-07-04",
                "98.50",
                1,
                "DOG"
        );

        mockMvc.perform(patch("/api/booking-proposals/{id}/accept", proposalId)
                        .header("Authorization", "Bearer " + hostToken))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.error.code").value("ACCESS_DENIED"));

        mockMvc.perform(patch("/api/booking-proposals/{id}/accept", proposalId)
                        .header("Authorization", "Bearer " + requesterToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.status").value("ACCEPTED"));
    }

    @Test
    void newBookingProposalAutomaticallyDeclinesPreviousPendingProposal() throws Exception {
        String hostToken = jwtService.generateToken("lukas.schmidt@example.com", "HOST");
        String requesterToken = jwtService.generateToken("anna.meier@example.com", "PET_OWNER");

        Long offerId = createPublishedOffer(hostToken);
        Long chatId = createChat(requesterToken, offerId);
        Long firstProposalId = createBookingProposal(
                requesterToken,
                chatId,
                "2026-07-01",
                "2026-07-02",
                "80.00",
                1,
                "DOG"
        );
        Long secondProposalId = createBookingProposal(
                hostToken,
                chatId,
                "2026-07-01",
                "2026-07-02",
                "90.00",
                1,
                "DOG"
        );

        mockMvc.perform(get("/api/chats/{id}/messages", chatId)
                        .header("Authorization", "Bearer " + hostToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.meta.total").value(2))
                .andExpect(jsonPath("$.data[0].bookingProposal.id").value(firstProposalId))
                .andExpect(jsonPath("$.data[0].bookingProposal.status").value("DECLINED"))
                .andExpect(jsonPath("$.data[0].bookingProposal.declineReason").value("REPLACED_BY_NEW_PROPOSAL"))
                .andExpect(jsonPath("$.data[1].bookingProposal.id").value(secondProposalId))
                .andExpect(jsonPath("$.data[1].bookingProposal.status").value("PENDING"));
    }

    @Test
    void manualDeclineSetsManualReasonAndInvalidProposalRequestsAreRejected() throws Exception {
        String hostToken = jwtService.generateToken("lukas.schmidt@example.com", "HOST");
        String requesterToken = jwtService.generateToken("anna.meier@example.com", "PET_OWNER");
        String strangerToken = jwtService.generateToken("sara.wagner@example.com", "PET_OWNER");

        Long offerId = createPublishedOffer(hostToken);
        Long chatId = createChat(requesterToken, offerId);

        mockMvc.perform(post("/api/chats/{id}/booking-proposals", chatId)
                        .header("Authorization", "Bearer " + requesterToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(buildBookingProposalPayload(
                                "2026-07-01",
                                "2026-07-02",
                                "75.00",
                                1,
                                "CAT"
                        ))))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.success").value(false));

        mockMvc.perform(post("/api/chats/{id}/booking-proposals", chatId)
                        .header("Authorization", "Bearer " + requesterToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(buildBookingProposalPayload(
                                "2026-07-01",
                                "2026-07-02",
                                "75.00",
                                0,
                                "DOG"
                        ))))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.success").value(false));

        Long proposalId = createBookingProposal(
                requesterToken,
                chatId,
                "2026-07-01",
                "2026-07-02",
                "75.00",
                1,
                "DOG"
        );

        mockMvc.perform(patch("/api/booking-proposals/{id}/decline", proposalId)
                        .header("Authorization", "Bearer " + requesterToken))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.error.code").value("ACCESS_DENIED"));

        mockMvc.perform(patch("/api/booking-proposals/{id}/decline", proposalId)
                        .header("Authorization", "Bearer " + strangerToken))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.error.code").value("ACCESS_DENIED"));

        mockMvc.perform(patch("/api/booking-proposals/{id}/decline", proposalId)
                        .header("Authorization", "Bearer " + hostToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.status").value("DECLINED"))
                .andExpect(jsonPath("$.data.declineReason").value("MANUAL"));
    }

    @Test
    void bookingProposalRequiresPetCountAtLeastPetSpeciesCount() throws Exception {
        String hostToken = jwtService.generateToken("lukas.schmidt@example.com", "HOST");
        String requesterToken = jwtService.generateToken("anna.meier@example.com", "PET_OWNER");

        Long offerId = createPublishedOffer(hostToken, List.of("DOG", "CAT"));
        Long chatId = createChat(requesterToken, offerId);

        mockMvc.perform(post("/api/chats/{id}/booking-proposals", chatId)
                        .header("Authorization", "Bearer " + requesterToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(buildBookingProposalPayload(
                                "2026-07-01",
                                "2026-07-02",
                                "75.00",
                                1,
                                "DOG",
                                "CAT"
                        ))))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.success").value(false));
    }

    @Test
    void acceptingOverlappingAcceptedBookingReturnsConflict() throws Exception {
        String hostToken = jwtService.generateToken("lukas.schmidt@example.com", "HOST");
        String requesterToken = jwtService.generateToken("anna.meier@example.com", "PET_OWNER");

        Long offerId = createPublishedOffer(hostToken);
        Long chatId = createChat(requesterToken, offerId);
        Long acceptedProposalId = createBookingProposal(
                requesterToken,
                chatId,
                "2026-07-01",
                "2026-07-03",
                "180.00",
                1,
                "DOG"
        );
        mockMvc.perform(patch("/api/booking-proposals/{id}/accept", acceptedProposalId)
                        .header("Authorization", "Bearer " + hostToken))
                .andExpect(status().isOk());

        Long conflictingProposalId = createBookingProposal(
                requesterToken,
                chatId,
                "2026-07-02",
                "2026-07-04",
                "190.00",
                1,
                "DOG"
        );

        mockMvc.perform(patch("/api/booking-proposals/{id}/accept", conflictingProposalId)
                        .header("Authorization", "Bearer " + hostToken))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.error.code").value("CONFLICT"));
    }

    @Test
    void bookingProposalsCannotBeCreatedOrAcceptedAfterOfferIsWithdrawn() throws Exception {
        String hostToken = jwtService.generateToken("lukas.schmidt@example.com", "HOST");
        String requesterToken = jwtService.generateToken("anna.meier@example.com", "PET_OWNER");

        Long offerId = createPublishedOffer(hostToken);
        Long chatId = createChat(requesterToken, offerId);
        Long proposalId = createBookingProposal(
                requesterToken,
                chatId,
                "2026-07-01",
                "2026-07-02",
                "120.00",
                1,
                "DOG"
        );

        mockMvc.perform(patch("/api/offers/{id}/withdraw", offerId)
                        .header("Authorization", "Bearer " + hostToken))
                .andExpect(status().isOk());

        mockMvc.perform(post("/api/chats/{id}/booking-proposals", chatId)
                        .header("Authorization", "Bearer " + requesterToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(buildBookingProposalPayload(
                                "2026-07-03",
                                "2026-07-04",
                                "130.00",
                                1,
                                "DOG"
                        ))))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.success").value(false));

        mockMvc.perform(patch("/api/booking-proposals/{id}/accept", proposalId)
                        .header("Authorization", "Bearer " + hostToken))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.success").value(false));
    }

    @Test
    void participantsCanCloseChatAndClosedChatBlocksFurtherMutations() throws Exception {
        String hostToken = jwtService.generateToken("lukas.schmidt@example.com", "HOST");
        String requesterToken = jwtService.generateToken("anna.meier@example.com", "PET_OWNER");

        Long offerId = createPublishedOffer(hostToken);
        Long chatId = createChat(requesterToken, offerId);

        mockMvc.perform(patch("/api/chats/{id}/close", chatId)
                        .header("Authorization", "Bearer " + requesterToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.id").value(chatId))
                .andExpect(jsonPath("$.data.closedAt").isString())
                .andExpect(jsonPath("$.data.closedByUserId").isNumber());

        mockMvc.perform(post("/api/chats/{id}/messages", chatId)
                        .header("Authorization", "Bearer " + hostToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of("content", "Darf nicht mehr gesendet werden"))))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.error.code").value("BAD_REQUEST"));

        mockMvc.perform(post("/api/chats/{id}/booking-proposals", chatId)
                        .header("Authorization", "Bearer " + hostToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(buildBookingProposalPayload(
                                "2026-07-01",
                                "2026-07-02",
                                "130.00",
                                1,
                                "DOG"
                        ))))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.error.code").value("BAD_REQUEST"));
    }

    @Test
    void closingChatIsRestrictedToParticipants() throws Exception {
        String hostToken = jwtService.generateToken("lukas.schmidt@example.com", "HOST");
        String requesterToken = jwtService.generateToken("anna.meier@example.com", "PET_OWNER");
        String strangerToken = jwtService.generateToken("sara.wagner@example.com", "PET_OWNER");

        Long offerId = createPublishedOffer(hostToken);
        Long chatId = createChat(requesterToken, offerId);

        mockMvc.perform(patch("/api/chats/{id}/close", chatId)
                        .header("Authorization", "Bearer " + strangerToken))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.error.code").value("ACCESS_DENIED"));
    }

    private Long createPublishedOffer(String hostToken) throws Exception {
        return createPublishedOffer(hostToken, List.of("DOG"));
    }

    private Long createPublishedOffer(String hostToken, List<String> acceptedPetSpecies) throws Exception {
        return createPublishedOffer(hostToken, acceptedPetSpecies, "2026-07-01", "2026-07-05");
    }

    private Long createPublishedOffer(String hostToken,
                                      List<String> acceptedPetSpecies,
                                      String availableFrom,
                                      String availableTo) throws Exception {
        MvcResult createResult = mockMvc.perform(post("/api/offers")
                        .header("Authorization", "Bearer " + hostToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(buildOfferPayload(acceptedPetSpecies, availableFrom, availableTo))))
                .andExpect(status().isOk())
                .andReturn();

        Long offerId = objectMapper.readTree(createResult.getResponse().getContentAsString())
                .get("data")
                .get("id")
                .asLong();

        mockMvc.perform(patch("/api/offers/{id}/publish", offerId)
                        .header("Authorization", "Bearer " + hostToken))
                .andExpect(status().isOk());

        return offerId;
    }

    private Long createChat(String requesterToken, Long offerId) throws Exception {
        Map<String, Object> payload = Map.of("offerId", offerId);
        MvcResult result = mockMvc.perform(post("/api/chats")
                        .header("Authorization", "Bearer " + requesterToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(payload)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andReturn();

        return objectMapper.readTree(result.getResponse().getContentAsString())
                .get("data")
                .get("id")
                .asLong();
    }

    private Long createMessage(String token, Long chatId, String content) throws Exception {
        Map<String, Object> payload = Map.of("content", content);
        MvcResult result = mockMvc.perform(post("/api/chats/{id}/messages", chatId)
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(payload)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andReturn();

        JsonNode data = objectMapper.readTree(result.getResponse().getContentAsString()).get("data");
        return data.get("id").asLong();
    }

    private Long createBookingProposal(String token,
                                       Long chatId,
                                       String startDate,
                                       String endDate,
                                       String priceTotal,
                                       int petCount,
                                       String... petSpecies) throws Exception {
        MvcResult result = mockMvc.perform(post("/api/chats/{id}/booking-proposals", chatId)
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(buildBookingProposalPayload(
                                startDate,
                                endDate,
                                priceTotal,
                                petCount,
                                petSpecies
                        ))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.status").value("PENDING"))
                .andReturn();

        JsonNode data = objectMapper.readTree(result.getResponse().getContentAsString()).get("data");
        return data.get("id").asLong();
    }

    private Map<String, Object> buildOfferPayload() {
        return buildOfferPayload(List.of("DOG"));
    }

    private Map<String, Object> buildOfferPayload(List<String> acceptedPetSpecies) {
        return buildOfferPayload(acceptedPetSpecies, "2026-07-01", "2026-07-05");
    }

    private Map<String, Object> buildOfferPayload(List<String> acceptedPetSpecies,
                                                  String availableFrom,
                                                  String availableTo) {
        Map<String, Object> payload = new HashMap<>();
        payload.put("title", "Live-Chat Testangebot " + UUID.randomUUID());
        payload.put("description", "Betreuung mit Updates, Bildern und persoenlicher Abstimmung.");
        payload.put("pricePerDay", BigDecimal.valueOf(42.50));
        payload.put("availableFrom", availableFrom);
        payload.put("availableTo", availableTo);
        payload.put("acceptedPetSpecies", acceptedPetSpecies);
        payload.put("services", List.of("Fuetterung", "Spaziergang"));
        return payload;
    }

    private Map<String, Object> buildBookingProposalPayload(String startDate,
                                                            String endDate,
                                                            String priceTotal,
                                                            int petCount,
                                                            String... petSpecies) {
        Map<String, Object> payload = new HashMap<>();
        payload.put("startDate", startDate);
        payload.put("endDate", endDate);
        payload.put("priceTotal", new BigDecimal(priceTotal));
        payload.put("petSpecies", List.of(petSpecies));
        payload.put("petCount", petCount);
        payload.put("note", "Bitte mit taeglichen Updates.");
        return payload;
    }

    private byte[] createMinimalPng(int rgb) throws Exception {
        BufferedImage image = new BufferedImage(1, 1, BufferedImage.TYPE_INT_RGB);
        image.setRGB(0, 0, rgb);
        ByteArrayOutputStream output = new ByteArrayOutputStream();
        ImageIO.write(image, "png", output);
        return output.toByteArray();
    }
}
