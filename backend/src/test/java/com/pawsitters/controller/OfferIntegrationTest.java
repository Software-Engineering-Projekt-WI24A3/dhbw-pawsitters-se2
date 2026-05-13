package com.pawsitters.controller;

import com.pawsitters.security.JwtService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;
import org.springframework.test.web.servlet.request.MockHttpServletRequestBuilder;
import tools.jackson.databind.JsonNode;
import tools.jackson.databind.ObjectMapper;

import java.math.BigDecimal;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

import static org.hamcrest.Matchers.hasItem;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.junit.jupiter.api.Assertions.fail;
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
                .andExpect(jsonPath("$.data.availableFrom").value("2026-07-01"))
                .andExpect(jsonPath("$.data.availableTo").value("2026-07-05"))
                .andExpect(jsonPath("$.data.status").value("DRAFT"))
                .andReturn();

        Long offerId = objectMapper.readTree(createResult.getResponse().getContentAsString())
                .get("data")
                .get("id")
                .asLong();

        mockMvc.perform(get("/api/offers/{id}", offerId)
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.message").value("Offer retrieved successfully."))
                .andExpect(jsonPath("$.data.id").value(offerId))
                .andExpect(jsonPath("$.data.title").value(title))
                .andExpect(jsonPath("$.data.status").value("DRAFT"));
        assertOwnOfferStatus(token, offerId, "DRAFT");

        assertMarketplaceDoesNotContain(token, title);

        mockMvc.perform(patch("/api/offers/{id}/publish", offerId)
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.message").value("Offer published successfully."))
                .andExpect(jsonPath("$.data.status").value("PUBLISHED"));
        assertOwnOfferStatus(token, offerId, "PUBLISHED");

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
        assertOwnOfferStatus(token, offerId, "DRAFT");

        assertMarketplaceDoesNotContain(token, title);
    }

    @Test
    void hostCanUpdateDraftOfferButNotPublishedOffer() throws Exception {
        String token = jwtService.generateToken("lukas.schmidt@example.com", "HOST");
        String originalTitle = "Entwurf zum Bearbeiten " + UUID.randomUUID();
        String updatedTitle = "Aktualisierter Entwurf " + UUID.randomUUID();

        MvcResult createResult = mockMvc.perform(post("/api/offers")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(buildOfferPayload(originalTitle))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.status").value("DRAFT"))
                .andReturn();

        Long offerId = objectMapper.readTree(createResult.getResponse().getContentAsString())
                .get("data")
                .get("id")
                .asLong();

        Map<String, Object> updatePayload = buildOfferPayload(updatedTitle);
        updatePayload.put("description", "Aktualisierter Ablauf mit neuer Tagesstruktur.");
        updatePayload.put("pricePerDay", BigDecimal.valueOf(55));
        updatePayload.put("availableFrom", "2026-08-10");
        updatePayload.put("availableTo", "2026-08-12");

        mockMvc.perform(patch("/api/offers/{id}", offerId)
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(updatePayload)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.message").value("Offer updated successfully."))
                .andExpect(jsonPath("$.data.id").value(offerId))
                .andExpect(jsonPath("$.data.title").value(updatedTitle))
                .andExpect(jsonPath("$.data.availableFrom").value("2026-08-10"))
                .andExpect(jsonPath("$.data.availableTo").value("2026-08-12"))
                .andExpect(jsonPath("$.data.status").value("DRAFT"));

        mockMvc.perform(patch("/api/offers/{id}/publish", offerId)
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.status").value("PUBLISHED"));

        mockMvc.perform(patch("/api/offers/{id}", offerId)
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(updatePayload)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.error.code").value("BAD_REQUEST"));
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

    @Test
    void profileOffersEndpointShowsDraftOnlyToOwnerAndPublishedToOthers() throws Exception {
        String hostToken = jwtService.generateToken("lukas.schmidt@example.com", "HOST");
        String viewerToken = jwtService.generateToken("anna.meier@example.com", "PET_OWNER");
        String title = "Profilangebot " + UUID.randomUUID();

        MvcResult createResult = mockMvc.perform(post("/api/offers")
                        .header("Authorization", "Bearer " + hostToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(buildOfferPayload(title))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.title").value(title))
                .andExpect(jsonPath("$.data.status").value("DRAFT"))
                .andReturn();

        JsonNode createdOffer = objectMapper.readTree(createResult.getResponse().getContentAsString()).get("data");
        Long offerId = createdOffer.get("id").asLong();
        Long hostId = createdOffer.get("hostId").asLong();

        JsonNode ownProfileOffers = getProfileOffers(hostToken, hostId);
        assertTrue(hasOfferTitle(ownProfileOffers, title), "Owner should see own draft offer in profile offers.");

        JsonNode otherProfileOffers = getProfileOffers(viewerToken, hostId);
        assertFalse(hasOfferTitle(otherProfileOffers, title), "Other users must not see draft offers in profile offers.");

        JsonNode anonymousProfileOffers = getProfileOffers(null, hostId);
        assertFalse(hasOfferTitle(anonymousProfileOffers, title), "Anonymous users must not see draft offers in profile offers.");

        mockMvc.perform(patch("/api/offers/{id}/publish", offerId)
                        .header("Authorization", "Bearer " + hostToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.status").value("PUBLISHED"));

        JsonNode publishedForOtherUsers = getProfileOffers(viewerToken, hostId);
        assertTrue(hasOfferTitle(publishedForOtherUsers, title), "Published offers should be visible in profile offers.");

        JsonNode publishedForAnonymousUsers = getProfileOffers(null, hostId);
        assertTrue(hasOfferTitle(publishedForAnonymousUsers, title), "Published offers should be visible anonymously.");
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

    private void assertOwnOfferStatus(String token, Long offerId, String expectedStatus) throws Exception {
        MvcResult result = mockMvc.perform(get("/api/offers")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andReturn();

        JsonNode offers = objectMapper.readTree(result.getResponse().getContentAsString()).get("data");
        for (JsonNode offer : offers) {
            if (offerId.equals(offer.get("id").asLong())) {
                assertEquals(expectedStatus, offer.get("status").asText());
                return;
            }
        }

        fail("Offer " + offerId + " was not returned by GET /api/offers");
    }

    private JsonNode getProfileOffers(String token, Long hostId) throws Exception {
        MockHttpServletRequestBuilder request = get("/api/offers/host/{hostId}", hostId);
        if (token != null && !token.isBlank()) {
            request.header("Authorization", "Bearer " + token);
        }

        MvcResult result = mockMvc.perform(request)
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andReturn();
        return objectMapper.readTree(result.getResponse().getContentAsString()).get("data");
    }

    private boolean hasOfferTitle(JsonNode offers, String title) {
        if (offers == null || !offers.isArray()) {
            return false;
        }

        for (JsonNode offer : offers) {
            if (title.equals(offer.path("title").asText())) {
                return true;
            }
        }
        return false;
    }

    private Map<String, Object> buildOfferPayload(String title) {
        Map<String, Object> payload = new HashMap<>();
        payload.put("title", title);
        payload.put("description", "Tagesbetreuung inklusive Spaziergang, Fuetterung und Ruhezeiten.");
        payload.put("pricePerDay", BigDecimal.valueOf(39.90));
        payload.put("acceptedPetSpecies", List.of("DOG"));
        payload.put("services", List.of("Spaziergang", "Fuetterung", "Tagesbetreuung"));
        payload.put("availableFrom", "2026-07-01");
        payload.put("availableTo", "2026-07-05");
        return payload;
    }
}
