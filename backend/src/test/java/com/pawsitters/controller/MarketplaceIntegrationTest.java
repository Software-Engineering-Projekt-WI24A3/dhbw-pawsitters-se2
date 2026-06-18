package com.pawsitters.controller;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;
import tools.jackson.databind.JsonNode;
import tools.jackson.databind.ObjectMapper;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.Collections;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

import static org.hamcrest.Matchers.everyItem;
import static org.hamcrest.Matchers.greaterThanOrEqualTo;
import static org.hamcrest.Matchers.hasItem;
import static org.hamcrest.Matchers.hasSize;
import static org.hamcrest.Matchers.is;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
class MarketplaceIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Test
    void getHostsReturnsHostOverviewEnvelope() throws Exception {
        String token = registerUser("marketplace.hosts." + UUID.randomUUID() + "@test.de");

        mockMvc.perform(get("/api/marketplace/hosts")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.message").value("Hosts retrieved successfully."))
                .andExpect(jsonPath("$.meta.total", greaterThanOrEqualTo(3)))
                .andExpect(jsonPath("$.data.length()", greaterThanOrEqualTo(3)))
                .andExpect(jsonPath("$.data[*].firstName", hasItem("Lukas")))
                .andExpect(jsonPath("$.data[*].acceptedPetSpecies").isArray())
                .andExpect(jsonPath("$.data[*].passwordHash").doesNotExist());
    }

    @Test
    void searchHostsBySpeciesAndPostalCodeReturnsMatchingHostsOnly() throws Exception {
        String token = registerUser("marketplace.search." + UUID.randomUUID() + "@test.de");

        mockMvc.perform(get("/api/marketplace/hosts/search")
                        .param("species", "DOG")
                        .param("postalCode", "68159")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.meta.total").value(2))
                .andExpect(jsonPath("$.data", hasSize(2)))
                .andExpect(jsonPath("$.data[*].postalCode", everyItem(is("68159"))))
                .andExpect(jsonPath("$.data[*].acceptedPetSpecies[*]", hasItem("DOG")));
    }

    @Test
    void filtersReturnAvailableMarketplaceOptionsDynamically() throws Exception {
        String token = registerUser("marketplace.filters." + UUID.randomUUID() + "@test.de");

        mockMvc.perform(get("/api/marketplace/filters")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.species", hasItem("DOG")))
                .andExpect(jsonPath("$.data.species", hasItem("CAT")))
                .andExpect(jsonPath("$.data.postalCodes", hasItem("68159")))
                .andExpect(jsonPath("$.data.cities", hasItem("Mannheim")));
    }

    @Test
    void getOffersIsAccessibleWithoutAuthentication() throws Exception {
        mockMvc.perform(get("/api/marketplace/offers"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.message").value("Marketplace offers retrieved successfully."))
                .andExpect(jsonPath("$.data").isArray());
    }

    @Test
    void searchOffersIsAccessibleWithoutAuthentication() throws Exception {
        mockMvc.perform(get("/api/marketplace/offers/search"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.message").value("Marketplace offers searched successfully."))
                .andExpect(jsonPath("$.data.matchingOffers").isArray())
                .andExpect(jsonPath("$.data.alternativeDateOffers").isArray());
    }

    @Test
    void latestOffersReturnsNewestTenByDefaultAndSortedDescendingById() throws Exception {
        String token = registerUser("marketplace.latest." + UUID.randomUUID() + "@test.de");
        List<Long> createdPublishedOfferIds = new ArrayList<>();

        for (int index = 1; index <= 12; index += 1) {
            createdPublishedOfferIds.add(createAndPublishOffer(token, "Neueste Betreuung " + index));
        }

        List<Long> expectedLatestIds = new ArrayList<>(createdPublishedOfferIds.subList(createdPublishedOfferIds.size() - 10, createdPublishedOfferIds.size()));
        Collections.reverse(expectedLatestIds);

        MvcResult latestResult = mockMvc.perform(get("/api/marketplace/offers/latest"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.message").value("Latest marketplace offers retrieved successfully."))
                .andExpect(jsonPath("$.data", hasSize(10)))
                .andReturn();

        JsonNode offers = objectMapper.readTree(latestResult.getResponse().getContentAsString()).get("data");
        List<Long> receivedIds = new ArrayList<>();
        for (JsonNode offer : offers) {
            receivedIds.add(offer.path("id").asLong());
        }

        org.junit.jupiter.api.Assertions.assertEquals(expectedLatestIds, receivedIds);
    }

    @Test
    void latestOffersCanExcludeHostIdAndStillReturnRequestedLimit() throws Exception {
        String visibleHostToken = registerUser("marketplace.latest.visible." + UUID.randomUUID() + "@test.de");
        String excludedHostToken = registerUser("marketplace.latest.excluded." + UUID.randomUUID() + "@test.de");
        Long excludedHostId = resolveCurrentUserId(excludedHostToken);

        for (int index = 1; index <= 12; index += 1) {
            createAndPublishOffer(visibleHostToken, "Sichtbare Betreuung " + index);
        }
        for (int index = 1; index <= 5; index += 1) {
            createAndPublishOffer(excludedHostToken, "Ausgeblendete Betreuung " + index);
        }

        MvcResult latestResult = mockMvc.perform(get("/api/marketplace/offers/latest")
                        .param("limit", "10")
                        .param("excludeHostId", String.valueOf(excludedHostId)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data", hasSize(10)))
                .andReturn();

        JsonNode offers = objectMapper.readTree(latestResult.getResponse().getContentAsString()).get("data");
        long previousId = Long.MAX_VALUE;
        for (JsonNode offer : offers) {
            long currentId = offer.path("id").asLong();
            long currentHostId = offer.path("hostId").asLong();
            org.junit.jupiter.api.Assertions.assertNotEquals(excludedHostId.longValue(), currentHostId);
            org.junit.jupiter.api.Assertions.assertTrue(currentId <= previousId);
            previousId = currentId;
        }
    }

    @Test
    void searchOffersSplitsMatchingAndAlternativeDatesByFilters() throws Exception {
        String matchingToken = registerUser(
                "marketplace.search.match." + UUID.randomUUID() + "@test.de",
                "Bielefeld",
                "33602"
        );
        String alternativeToken = registerUser(
                "marketplace.search.alt." + UUID.randomUUID() + "@test.de",
                "Bielefeld",
                "33602"
        );
        String differentCityToken = registerUser(
                "marketplace.search.other." + UUID.randomUUID() + "@test.de",
                "Hamburg",
                "20095"
        );
        LocalDate searchStart = LocalDate.now().plusDays(30);
        LocalDate searchEnd = searchStart.plusDays(3);
        LocalDate matchingStart = searchStart.minusDays(1);
        LocalDate matchingEnd = searchEnd.plusDays(1);
        LocalDate alternativeStart = searchStart.plusDays(30);
        LocalDate alternativeEnd = alternativeStart.plusDays(6);

        createAndPublishOffer(
                matchingToken,
                "Bielefeld Hund passend",
                "Bielefeld Mitte",
                matchingStart.toString(),
                matchingEnd.toString(),
                List.of("DOG")
        );
        createAndPublishOffer(
                alternativeToken,
                "Bielefeld Hund alternativ",
                "Bielefeld Mitte",
                alternativeStart.toString(),
                alternativeEnd.toString(),
                List.of("DOG")
        );
        createAndPublishOffer(
                differentCityToken,
                "Hamburg Hund passend",
                "Hamburg Zentrum",
                matchingStart.toString(),
                matchingEnd.toString(),
                List.of("DOG")
        );

        mockMvc.perform(get("/api/marketplace/offers/search")
                        .param("species", "DOG")
                        .param("city", "Bielefeld")
                        .param("postalCode", "33602")
                        .param("fromDate", searchStart.toString())
                        .param("toDate", searchEnd.toString())
                        .param("limit", "10"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.matchingOffers", hasSize(1)))
                .andExpect(jsonPath("$.data.matchingOffers[0].title").value("Bielefeld Hund passend"))
                .andExpect(jsonPath("$.data.alternativeDateOffers", hasSize(1)))
                .andExpect(jsonPath("$.data.alternativeDateOffers[0].title").value("Bielefeld Hund alternativ"));
    }

    private String registerUser(String email) throws Exception {
        return registerUser(email, "Mannheim", "68159");
    }

    private String registerUser(String email, String city, String postalCode) throws Exception {
        String response = mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(buildRegisterPayload(email, city, postalCode))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.token").isString())
                .andReturn()
                .getResponse()
                .getContentAsString();

        return objectMapper.readTree(response).get("data").get("token").asText();
    }

    private Long createAndPublishOffer(String token, String title) throws Exception {
        return createAndPublishOffer(
                token,
                title,
                "Mannheim",
                "2026-07-01",
                "2026-07-03",
                List.of("DOG")
        );
    }

    private Long createAndPublishOffer(String token,
                                       String title,
                                       String location,
                                       String availableFrom,
                                       String availableTo,
                                       List<String> acceptedPetSpecies) throws Exception {
        Map<String, Object> payload = new HashMap<>();
        payload.put("title", title);
        payload.put("location", location);
        payload.put("description", "Ruhige Betreuung mit festen Spaziergaengen.");
        payload.put("pricePerDay", 44.5);
        payload.put("acceptedPetSpecies", acceptedPetSpecies);
        payload.put("services", List.of("Spaziergang", "Fuetterung"));
        payload.put("availableFrom", availableFrom);
        payload.put("availableTo", availableTo);

        MvcResult createResult = mockMvc.perform(post("/api/offers")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(payload)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.status").value("DRAFT"))
                .andReturn();

        Long offerId = objectMapper.readTree(createResult.getResponse().getContentAsString())
                .get("data")
                .get("id")
                .asLong();

        mockMvc.perform(patch("/api/offers/{id}/publish", offerId)
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.status").value("PUBLISHED"));

        return offerId;
    }

    private Long resolveCurrentUserId(String token) throws Exception {
        MvcResult meResult = mockMvc.perform(get("/api/users/me")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andReturn();

        return objectMapper.readTree(meResult.getResponse().getContentAsString())
                .get("data")
                .get("id")
                .asLong();
    }

    private Map<String, Object> buildRegisterPayload(String email, String city, String postalCode) {
        Map<String, Object> payload = new HashMap<>();
        payload.put("email", email);
        payload.put("password", "StrongPhrase123!");
        payload.put("firstName", "Max");
        payload.put("lastName", "Muster");
        payload.put("phone", "0123456789");
        payload.put("birthDate", LocalDate.of(2000, 1, 1).toString());
        payload.put("emergencyContact", "Notfallkontakt");
        payload.put("profilePicture", "max.png");
        payload.put("bio", "Test user");
        payload.put("role", "PET_OWNER");
        payload.put("postalCode", postalCode);
        payload.put("city", city);
        payload.put("acceptedPetSpecies", List.of());
        return payload;
    }
}
