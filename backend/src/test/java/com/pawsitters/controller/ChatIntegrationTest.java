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
import static org.hamcrest.Matchers.endsWith;
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

    private Long createPublishedOffer(String hostToken) throws Exception {
        MvcResult createResult = mockMvc.perform(post("/api/offers")
                        .header("Authorization", "Bearer " + hostToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(buildOfferPayload())))
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

    private Map<String, Object> buildOfferPayload() {
        Map<String, Object> payload = new HashMap<>();
        payload.put("title", "Live-Chat Testangebot " + UUID.randomUUID());
        payload.put("description", "Betreuung mit Updates, Bildern und persoenlicher Abstimmung.");
        payload.put("pricePerDay", BigDecimal.valueOf(42.50));
        payload.put("availableFrom", "2026-07-01");
        payload.put("availableTo", "2026-07-05");
        payload.put("acceptedPetSpecies", List.of("DOG"));
        payload.put("services", List.of("Fuetterung", "Spaziergang"));
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
