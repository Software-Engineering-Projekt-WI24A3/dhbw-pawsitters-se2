package com.pawsitters.controller;

import com.pawsitters.security.JwtService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;
import org.springframework.transaction.annotation.Transactional;
import tools.jackson.databind.ObjectMapper;

import java.math.BigDecimal;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

import static org.hamcrest.Matchers.containsInAnyOrder;
import static org.hamcrest.Matchers.containsString;
import static org.hamcrest.Matchers.hasSize;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@Transactional
class AvailabilityIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private JwtService jwtService;

    @Test
    void hostCanManageSingleAndRecurringAvailabilityWithOverlapValidation() throws Exception {
        String hostToken = jwtService.generateToken("mia.fischer@example.com", "HOST");

        MvcResult singleResult = mockMvc.perform(post("/api/availability")
                        .header("Authorization", "Bearer " + hostToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of(
                                "startDate", "2026-09-01",
                                "endDate", "2026-09-03"
                        ))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.recurring").value(false))
                .andExpect(jsonPath("$.data.startDate").value("2026-09-01"))
                .andExpect(jsonPath("$.data.endDate").value("2026-09-03"))
                .andReturn();

        Long singleId = objectMapper.readTree(singleResult.getResponse().getContentAsString())
                .get("data")
                .get("id")
                .asLong();

        mockMvc.perform(post("/api/availability")
                        .header("Authorization", "Bearer " + hostToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of(
                                "startDate", "2026-09-03",
                                "endDate", "2026-09-04"
                        ))))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.error.code").value("CONFLICT"));

        mockMvc.perform(post("/api/availability/recurring")
                        .header("Authorization", "Bearer " + hostToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of(
                                "startDate", "2026-09-05",
                                "endDate", "2026-09-20",
                                "daysOfWeek", List.of("SATURDAY", "SUNDAY")
                        ))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.recurring").value(true))
                .andExpect(jsonPath("$.data.daysOfWeek", containsInAnyOrder("SATURDAY", "SUNDAY")));

        mockMvc.perform(post("/api/availability")
                        .header("Authorization", "Bearer " + hostToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of(
                                "startDate", "2026-09-06",
                                "endDate", "2026-09-06"
                        ))))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.error.code").value("CONFLICT"));

        mockMvc.perform(get("/api/availability")
                        .header("Authorization", "Bearer " + hostToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data", hasSize(2)));

        mockMvc.perform(delete("/api/availability/{id}", singleId)
                        .header("Authorization", "Bearer " + hostToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.deleted").value(true));

        mockMvc.perform(get("/api/availability")
                        .header("Authorization", "Bearer " + hostToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data", hasSize(1)));
    }

    @Test
    void petOwnerCannotCreateAvailability() throws Exception {
        String petOwnerToken = jwtService.generateToken("anna.meier@example.com", "PET_OWNER");

        mockMvc.perform(post("/api/availability")
                        .header("Authorization", "Bearer " + petOwnerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of(
                                "startDate", "2026-10-01",
                                "endDate", "2026-10-02"
                        ))))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.error.code").value("FORBIDDEN"));
    }

    @Test
    void bookingProposalOutsideHostCalendarReturnsFeedback() throws Exception {
        String hostToken = jwtService.generateToken("noah.becker@example.com", "HOST");
        String requesterToken = jwtService.generateToken("anna.meier@example.com", "PET_OWNER");

        mockMvc.perform(post("/api/availability")
                        .header("Authorization", "Bearer " + hostToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of(
                                "startDate", "2026-10-01",
                                "endDate", "2026-10-01"
                        ))))
                .andExpect(status().isOk());

        Long offerId = createPublishedOffer(hostToken, "2026-10-01", "2026-10-05");
        Long chatId = createChat(requesterToken, offerId);

        mockMvc.perform(post("/api/chats/{id}/booking-proposals", chatId)
                        .header("Authorization", "Bearer " + requesterToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(buildBookingProposalPayload(
                                "2026-10-01",
                                "2026-10-02"
                        ))))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.message", containsString("nicht verfuegbar")))
                .andExpect(jsonPath("$.message", containsString("nicht buchen")));

        mockMvc.perform(post("/api/chats/{id}/booking-proposals", chatId)
                        .header("Authorization", "Bearer " + requesterToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(buildBookingProposalPayload(
                                "2026-10-01",
                                "2026-10-01"
                        ))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.status").value("PENDING"));
    }

    @Test
    void bookingProposalHonorsRecurringAvailability() throws Exception {
        String hostToken = jwtService.generateToken("lukas.schmidt@example.com", "HOST");
        String requesterToken = jwtService.generateToken("anna.meier@example.com", "PET_OWNER");

        mockMvc.perform(post("/api/availability/recurring")
                        .header("Authorization", "Bearer " + hostToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of(
                                "startDate", "2026-11-01",
                                "endDate", "2026-11-30",
                                "daysOfWeek", List.of("SATURDAY", "SUNDAY")
                        ))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.recurring").value(true));

        Long offerId = createPublishedOffer(hostToken, "2026-11-01", "2026-11-30");
        Long chatId = createChat(requesterToken, offerId);

        mockMvc.perform(post("/api/chats/{id}/booking-proposals", chatId)
                        .header("Authorization", "Bearer " + requesterToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(buildBookingProposalPayload(
                                "2026-11-09",
                                "2026-11-09"
                        ))))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.message", containsString("nicht verfuegbar")));

        mockMvc.perform(post("/api/chats/{id}/booking-proposals", chatId)
                        .header("Authorization", "Bearer " + requesterToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(buildBookingProposalPayload(
                                "2026-11-07",
                                "2026-11-08"
                        ))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.status").value("PENDING"));
    }

    private Long createPublishedOffer(String hostToken, String availableFrom, String availableTo) throws Exception {
        MvcResult createResult = mockMvc.perform(post("/api/offers")
                        .header("Authorization", "Bearer " + hostToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(buildOfferPayload(availableFrom, availableTo))))
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
        MvcResult result = mockMvc.perform(post("/api/chats")
                        .header("Authorization", "Bearer " + requesterToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of("offerId", offerId))))
                .andExpect(status().isOk())
                .andReturn();

        return objectMapper.readTree(result.getResponse().getContentAsString())
                .get("data")
                .get("id")
                .asLong();
    }

    private Map<String, Object> buildOfferPayload(String availableFrom, String availableTo) {
        Map<String, Object> payload = new HashMap<>();
        payload.put("title", "Kalender-Testangebot " + UUID.randomUUID());
        payload.put("description", "Betreuung mit Kalenderfreigabe und klaren Buchungsgrenzen.");
        payload.put("pricePerDay", BigDecimal.valueOf(49.90));
        payload.put("availableFrom", availableFrom);
        payload.put("availableTo", availableTo);
        payload.put("acceptedPetSpecies", List.of("DOG"));
        payload.put("services", List.of("Fuetterung", "Spielzeit"));
        return payload;
    }

    private Map<String, Object> buildBookingProposalPayload(String startDate, String endDate) {
        Map<String, Object> payload = new HashMap<>();
        payload.put("startDate", startDate);
        payload.put("endDate", endDate);
        payload.put("priceTotal", BigDecimal.valueOf(80.00));
        payload.put("petSpecies", List.of("DOG"));
        payload.put("petCount", 1);
        payload.put("note", "Bitte vorher Kalender pruefen.");
        return payload;
    }
}
