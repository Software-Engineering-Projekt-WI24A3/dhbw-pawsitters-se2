package com.pawsitters.controller;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.pawsitters.security.JwtService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import java.math.BigDecimal;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

import static org.hamcrest.Matchers.hasItem;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
class OfferIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private JwtService jwtService;

    @Test
    void offerCanMoveBetweenDraftAndPublishedAndMarketplaceShowsOnlyPublishedOffers() throws Exception {
        String token = jwtService.generateToken("lukas.schmidt@example.com", "HOST");
        String title = "Hundebetreuung Deluxe " + UUID.randomUUID();

        MvcResult createResult = mockMvc.perform(post("/api/offers")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(buildOfferPayload(title))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.message").value("Offer created successfully."))
                .andExpect(jsonPath("$.data.title").value(title))
                .andExpect(jsonPath("$.data.status").value("DRAFT"))
                .andReturn();

        Long offerId = objectMapper.readTree(createResult.getResponse().getContentAsString())
                .get("data")
                .get("id")
                .asLong();

        assertMarketplaceDoesNotContain(token, title);

        mockMvc.perform(patch("/api/offers/{id}/publish", offerId)
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.message").value("Offer published successfully."))
                .andExpect(jsonPath("$.data.status").value("PUBLISHED"));

        mockMvc.perform(get("/api/marketplace/offers")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data[*].title", hasItem(title)))
                .andExpect(jsonPath("$.data[*].status", hasItem("PUBLISHED")));

        mockMvc.perform(patch("/api/offers/{id}/withdraw", offerId)
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.message").value("Offer withdrawn successfully."))
                .andExpect(jsonPath("$.data.status").value("DRAFT"));

        assertMarketplaceDoesNotContain(token, title);
    }

    @Test
    void petOwnerCannotCreateOffer() throws Exception {
        String token = jwtService.generateToken("anna.meier@example.com", "PET_OWNER");

        mockMvc.perform(post("/api/offers")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(buildOfferPayload("Katzenbetreuung Basis"))))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.error.code").value("FORBIDDEN"));
    }

    private void assertMarketplaceDoesNotContain(String token, String title) throws Exception {
        MvcResult result = mockMvc.perform(get("/api/marketplace/offers")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andReturn();

        JsonNode offers = objectMapper.readTree(result.getResponse().getContentAsString()).get("data");
        for (JsonNode offer : offers) {
            if (title.equals(offer.get("title").asText())) {
                throw new AssertionError("Marketplace should not contain draft offer " + title);
            }
        }
    }

    private Map<String, Object> buildOfferPayload(String title) {
        Map<String, Object> payload = new HashMap<>();
        payload.put("title", title);
        payload.put("description", "Tagesbetreuung inklusive Spaziergang, Fuetterung und Ruhezeiten.");
        payload.put("pricePerDay", BigDecimal.valueOf(39.90));
        payload.put("acceptedPetSpecies", List.of("DOG"));
        payload.put("services", List.of("Spaziergang", "Fuetterung", "Tagesbetreuung"));
        return payload;
    }
}
