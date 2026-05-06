package com.pawsitters.controller;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.pawsitters.model.PetChoice;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import javax.imageio.ImageIO;
import java.awt.image.BufferedImage;
import java.io.ByteArrayOutputStream;
import java.time.LocalDate;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

import static org.hamcrest.Matchers.hasSize;
import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.multipart;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
class PetIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Test
    void petProfileCanBeCreatedReadAndUpdated() throws Exception {
        String email = "pet." + UUID.randomUUID() + "@test.de";
        String token = registerUser(email, "StrongPass123!");

        Long petId = createPet(token, "Milo", PetChoice.DOG, "Labrador", 4, "Braucht taeglich Bewegung");

        mockMvc.perform(get("/api/pets")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(1)))
                .andExpect(jsonPath("$[0].id").value(petId))
                .andExpect(jsonPath("$[0].breed").value("Labrador"))
                .andExpect(jsonPath("$[0].age").value(4))
                .andExpect(jsonPath("$[0].specialNeeds").value("Braucht taeglich Bewegung"))
                .andExpect(jsonPath("$[0].defaultImagePath").value("/images/pet_images/dog/"));

        Map<String, Object> updatePayload = buildPetPayload("Milo", PetChoice.DOG, "Golden Retriever", 5, "Vertraegt nur Spezialfutter");

        mockMvc.perform(put("/api/pets/{id}", petId)
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(updatePayload)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(petId))
                .andExpect(jsonPath("$.breed").value("Golden Retriever"))
                .andExpect(jsonPath("$.age").value(5))
                .andExpect(jsonPath("$.specialNeeds").value("Vertraegt nur Spezialfutter"))
                .andExpect(jsonPath("$.defaultImagePath").value("/images/pet_images/dog/"));
    }

    @Test
    void imageMustBeUniqueAcrossPets() throws Exception {
        String email = "img." + UUID.randomUUID() + "@test.de";
        String token = registerUser(email, "StrongPass123!");

        Long firstPetId = createPet(token, "Luna", PetChoice.CAT, "British Shorthair", 2, "Keine");
        Long secondPetId = createPet(token, "Balu", PetChoice.DOG, "Mischling", 3, "Wenig Treppen steigen");

        byte[] sharedImageBytes = createMinimalPng(0xFF0000);

        MockMultipartFile firstImage = new MockMultipartFile(
                "image",
                "cat.png",
                "image/png",
                sharedImageBytes
        );

        mockMvc.perform(multipart("/api/pets/{id}/image", firstPetId)
                        .file(firstImage)
                        .with(request -> {
                            request.setMethod("POST");
                            return request;
                        })
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.imagePath").isString());

        MockMultipartFile duplicateImage = new MockMultipartFile(
                "image",
                "duplicate.png",
                "image/png",
                sharedImageBytes
        );

        mockMvc.perform(multipart("/api/pets/{id}/image", secondPetId)
                        .file(duplicateImage)
                        .with(request -> {
                            request.setMethod("POST");
                            return request;
                        })
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isBadRequest());

        MockMultipartFile uniqueImage = new MockMultipartFile(
                "image",
                "dog.png",
                "image/png",
                createMinimalPng(0x0000FF)
        );

        mockMvc.perform(multipart("/api/pets/{id}/image", secondPetId)
                        .file(uniqueImage)
                        .with(request -> {
                            request.setMethod("POST");
                            return request;
                        })
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(secondPetId))
                .andExpect(jsonPath("$.imagePath").isString());
    }

    @Test
    void petResponseIncludesFallbackImagePath() throws Exception {
        String email = "fallback." + UUID.randomUUID() + "@test.de";
        String token = registerUser(email, "StrongPass123!");

        createPet(token, "Fluffy", PetChoice.CAT, "Persian", 3, "Keine");
        createPet(token, "Tweety", PetChoice.BUDGIE, "Wellensittich", 1, "Käfig nachts abdecken");

        MvcResult result = mockMvc.perform(get("/api/pets")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andReturn();

        String responseBody = result.getResponse().getContentAsString();
        JsonNode pets = objectMapper.readTree(responseBody);

        boolean foundCat = false;
        boolean foundBudgie = false;

        for (JsonNode pet : pets) {
            String species = pet.get("species").asText();
            JsonNode defaultPathNode = pet.get("defaultImagePath");
            
            // Überprüfe dass defaultImagePath vorhanden und nicht null ist
            assertNotNull(defaultPathNode, "defaultImagePath should not be null");
            assertFalse(defaultPathNode.isNull(), "defaultImagePath should not be null node");
            
            String defaultPath = defaultPathNode.asText();
            
            // Überprüfe dass defaultImagePath nicht leer ist
            assertFalse(defaultPath.isBlank(), "defaultImagePath should not be empty");

            if ("CAT".equals(species)) {
                foundCat = true;
                assertEquals("/images/pet_images/cat/", defaultPath,
                    "CAT pet should have correct fallback image path");
            } else if ("BUDGIE".equals(species)) {
                foundBudgie = true;
                assertEquals("/images/pet_images/budgie/", defaultPath,
                    "BUDGIE pet should have correct fallback image path");
            }
        }

        assertTrue(foundCat, "CAT pet should be found in response");
        assertTrue(foundBudgie, "BUDGIE pet should be found in response");
    }

    private Long createPet(String token,
                           String name,
                           PetChoice species,
                           String breed,
                           int age,
                           String specialNeeds) throws Exception {
        Map<String, Object> payload = buildPetPayload(name, species, breed, age, specialNeeds);

        MvcResult result = mockMvc.perform(post("/api/pets")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(payload)))
                .andExpect(status().isOk())
                .andReturn();

        JsonNode json = objectMapper.readTree(result.getResponse().getContentAsString());
        return json.get("id").asLong();
    }

    private String registerUser(String email, String password) throws Exception {
        Map<String, Object> payload = new HashMap<>();
        payload.put("email", email);
        payload.put("password", password);
        payload.put("firstName", "Max");
        payload.put("lastName", "Muster");
        payload.put("phone", "0123456789");
        payload.put("birthDate", LocalDate.of(2000, 1, 1).toString());
        payload.put("emergencyContact", "Notfallkontakt");
        payload.put("profilePicture", "max.png");
        payload.put("bio", "Test user");
        payload.put("role", "PET_OWNER");

        String response = mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(payload)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.token").isString())
                .andReturn()
                .getResponse()
                .getContentAsString();

        return objectMapper.readTree(response).get("token").asText();
    }

    private Map<String, Object> buildPetPayload(String name,
                                                PetChoice species,
                                                String breed,
                                                int age,
                                                String specialNeeds) {
        Map<String, Object> payload = new HashMap<>();
        payload.put("name", name);
        payload.put("species", species.name());
        payload.put("breed", breed);
        payload.put("age", age);
        payload.put("specialNeeds", specialNeeds);
        return payload;
    }

    /**
     * Creates a minimal 1x1 PNG image as a byte array with the given RGB color.
     * Using distinct colors ensures each call with a different color produces a unique hash.
     */
    private byte[] createMinimalPng(int rgbColor) throws Exception {
        BufferedImage img = new BufferedImage(1, 1, BufferedImage.TYPE_INT_RGB);
        img.setRGB(0, 0, rgbColor);
        ByteArrayOutputStream baos = new ByteArrayOutputStream();
        ImageIO.write(img, "png", baos);
        return baos.toByteArray();
    }
}




