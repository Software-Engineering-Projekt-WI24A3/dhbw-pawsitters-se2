package com.pawsitters.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import java.time.LocalDate;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

import static org.hamcrest.Matchers.everyItem;
import static org.hamcrest.Matchers.hasItem;
import static org.hamcrest.Matchers.hasSize;
import static org.hamcrest.Matchers.is;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
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
                .andExpect(jsonPath("$.meta.total").value(3))
                .andExpect(jsonPath("$.data", hasSize(3)))
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

    private String registerUser(String email) throws Exception {
        String response = mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(buildRegisterPayload(email))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.token").isString())
                .andReturn()
                .getResponse()
                .getContentAsString();

        return objectMapper.readTree(response).get("data").get("token").asText();
    }

    private Map<String, Object> buildRegisterPayload(String email) {
        Map<String, Object> payload = new HashMap<>();
        payload.put("email", email);
        payload.put("password", "StrongPass123!");
        payload.put("firstName", "Max");
        payload.put("lastName", "Muster");
        payload.put("phone", "0123456789");
        payload.put("birthDate", LocalDate.of(2000, 1, 1).toString());
        payload.put("emergencyContact", "Notfallkontakt");
        payload.put("profilePicture", "max.png");
        payload.put("bio", "Test user");
        payload.put("role", "PET_OWNER");
        payload.put("postalCode", "68159");
        payload.put("city", "Mannheim");
        payload.put("acceptedPetSpecies", List.of());
        return payload;
    }
}
