package com.pawsitters.controller;

import com.pawsitters.service.UserService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.test.web.servlet.MockMvc;
import tools.jackson.databind.JsonNode;
import tools.jackson.databind.ObjectMapper;

import javax.imageio.ImageIO;
import java.awt.image.BufferedImage;
import java.io.ByteArrayOutputStream;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.LocalDate;
import java.util.Base64;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

import static org.hamcrest.MatcherAssert.assertThat;
import static org.hamcrest.Matchers.hasSize;
import static org.hamcrest.Matchers.startsWith;
import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.multipart;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
class UserIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Value("${app.upload.dir}")
    private String uploadRoot;

    @Test
    void currentUserResponseContainsPublicFieldsOnly() throws Exception {
        String email = "user.public." + UUID.randomUUID() + "@test.de";
        String token = registerUser(email, "StrongPhrase123!");

        mockMvc.perform(get("/api/users/me")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.email").value(email))
                .andExpect(jsonPath("$.data.firstName").value("Max"))
                .andExpect(jsonPath("$.data.lastName").value("Muster"))
                .andExpect(jsonPath("$.data.role").value("PET_OWNER"))
                .andExpect(jsonPath("$.data.pets", hasSize(0)))
                .andExpect(jsonPath("$.data.passwordHash").doesNotExist());
    }

    @Test
    void deleteUserReturnsEnvelopeWithDeleteResponse() throws Exception {
        String email = "user.delete." + UUID.randomUUID() + "@test.de";
        String token = registerUser(email, "StrongPhrase123!");
        Long userId = currentUserId(token);

        mockMvc.perform(delete("/api/users/{id}", userId)
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.deleted").value(true))
                .andExpect(jsonPath("$.data.id").value(userId));
    }

    @Test
    void protectedEndpointWithoutTokenReturnsAuthRequiredEnvelope() throws Exception {
        mockMvc.perform(get("/api/users/me"))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.status").value(401))
                .andExpect(jsonPath("$.error.code").value("AUTH_REQUIRED"));
    }

    @Test
    void invalidMailExistsQueryReturnsValidationEnvelope() throws Exception {
        mockMvc.perform(get("/api/users/mailExists")
                        .param("mail", "not-an-email"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.status").value(400))
                .andExpect(jsonPath("$.error.code").value("VALIDATION_FAILED"))
                .andExpect(jsonPath("$.error.details").isArray());
    }

    @Test
    void nonAdminCannotUpdateRoles() throws Exception {
        String email = "user.role." + UUID.randomUUID() + "@test.de";
        String token = registerUser(email, "StrongPhrase123!");
        Long userId = currentUserId(token);

        mockMvc.perform(patch("/api/users/{id}/roles", userId)
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"role\":\"HOST\"}"))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.error.code").value("ACCESS_DENIED"));
    }

    @Test
    void missingUserReturnsNotFoundEnvelope() throws Exception {
        String email = "user.missing." + UUID.randomUUID() + "@test.de";
        String token = registerUser(email, "StrongPhrase123!");

        mockMvc.perform(get("/api/users/{id}", 999999L)
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.status").value(404))
                .andExpect(jsonPath("$.error.code").value("NOT_FOUND"));
    }

    @Test
    void registrationWithoutProfilePictureUsesDefaultPlaceholder() throws Exception {
        String email = "user.placeholder." + UUID.randomUUID() + "@test.de";
        Map<String, Object> payload = buildRegisterPayload(email, "StrongPhrase123!");
        payload.remove("profilePicture");

        String response = mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(payload)))
                .andExpect(status().isOk())
                .andReturn()
                .getResponse()
                .getContentAsString();

        String token = objectMapper.readTree(response).get("data").get("token").asText();

        mockMvc.perform(get("/api/users/me")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.profilePicture").value(UserService.DEFAULT_PROFILE_PICTURE));
    }

    @Test
    void profileImageCanBeUploadedReplacedAndDeleted() throws Exception {
        String email = "user.image." + UUID.randomUUID() + "@test.de";
        String token = registerUser(email, "StrongPhrase123!");
        Long userId = currentUserId(token);

        String firstProfilePicture = uploadProfileImage(token, userId, "profile.png", "image/png", createMinimalPng(0xFF0000));
        assertThat(firstProfilePicture, startsWith("/uploads/profiles/user-" + userId + "-"));
        Path firstUpload = uploadedProfileImagePath(firstProfilePicture);
        assertTrue(Files.exists(firstUpload), "first upload should exist");

        String secondProfilePicture = uploadProfileImage(token, userId, "profile.png", "image/png", createMinimalPng(0x0000FF));
        assertThat(secondProfilePicture, startsWith("/uploads/profiles/user-" + userId + "-"));
        assertNotEquals(firstProfilePicture, secondProfilePicture);
        assertFalse(Files.exists(firstUpload), "old profile image should be cleaned up");

        Path secondUpload = uploadedProfileImagePath(secondProfilePicture);
        assertTrue(Files.exists(secondUpload), "second upload should exist");

        mockMvc.perform(delete("/api/users/{id}/profile-image", userId)
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.profilePicture").value(UserService.DEFAULT_PROFILE_PICTURE));

        assertFalse(Files.exists(secondUpload), "deleted profile image should be cleaned up");
    }

    @Test
    void profileImageUploadAcceptsValidWebp() throws Exception {
        String email = "user.webp-image." + UUID.randomUUID() + "@test.de";
        String token = registerUser(email, "StrongPhrase123!");
        Long userId = currentUserId(token);

        String profilePicture = uploadProfileImage(token, userId, "profile.webp", "image/webp", createMinimalWebp());

        assertThat(profilePicture, startsWith("/uploads/profiles/user-" + userId + "-"));
        assertTrue(profilePicture.endsWith(".webp"));
        assertTrue(Files.exists(uploadedProfileImagePath(profilePicture)), "webp upload should exist");
    }

    @Test
    void profileImageUploadRejectsInvalidFiles() throws Exception {
        String email = "user.invalid-image." + UUID.randomUUID() + "@test.de";
        String token = registerUser(email, "StrongPhrase123!");
        Long userId = currentUserId(token);

        expectProfileImageUploadBadRequest(token, userId, new MockMultipartFile(
                "image", "profile.png", "image/png", new byte[0]
        ));
        expectProfileImageUploadBadRequest(token, userId, new MockMultipartFile(
                "image", "profile.png", "text/plain", createMinimalPng(0x00FF00)
        ));
        expectProfileImageUploadBadRequest(token, userId, new MockMultipartFile(
                "image", "profile.png", "image/png", "not an image".getBytes(StandardCharsets.UTF_8)
        ));
        expectProfileImageUploadBadRequest(token, userId, new MockMultipartFile(
                "image", "profile.txt", "image/png", createMinimalPng(0x00FF00)
        ));
    }

    @Test
    void onlyOwnerCanUploadOrDeleteProfileImage() throws Exception {
        String ownerToken = registerUser("user.owner." + UUID.randomUUID() + "@test.de", "StrongPhrase123!");
        Long ownerId = currentUserId(ownerToken);
        String attackerToken = registerUser("user.attacker." + UUID.randomUUID() + "@test.de", "StrongPhrase123!");

        MockMultipartFile image = new MockMultipartFile(
                "image",
                "profile.png",
                "image/png",
                createMinimalPng(0x00FF00)
        );

        mockMvc.perform(multipart("/api/users/{id}/profile-image", ownerId)
                        .file(image)
                        .header("Authorization", "Bearer " + attackerToken))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.error.code").value("ACCESS_DENIED"));

        mockMvc.perform(delete("/api/users/{id}/profile-image", ownerId)
                        .header("Authorization", "Bearer " + attackerToken))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.error.code").value("ACCESS_DENIED"));
    }

    private Long currentUserId(String token) throws Exception {
        String response = mockMvc.perform(get("/api/users/me")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andReturn()
                .getResponse()
                .getContentAsString();

        return objectMapper.readTree(response).get("data").get("id").asLong();
    }

    private String registerUser(String email, String password) throws Exception {
        String response = mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(buildRegisterPayload(email, password))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.token").isString())
                .andReturn()
                .getResponse()
                .getContentAsString();

        JsonNode root = objectMapper.readTree(response);
        return root.get("data").get("token").asText();
    }

    private Map<String, Object> buildRegisterPayload(String email, String password) {
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
        return payload;
    }

    private String uploadProfileImage(String token,
                                      Long userId,
                                      String filename,
                                      String contentType,
                                      byte[] bytes) throws Exception {
        MockMultipartFile image = new MockMultipartFile("image", filename, contentType, bytes);
        String response = mockMvc.perform(multipart("/api/users/{id}/profile-image", userId)
                        .file(image)
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.profilePicture").isString())
                .andReturn()
                .getResponse()
                .getContentAsString();

        return objectMapper.readTree(response).get("data").get("profilePicture").asText();
    }

    private void expectProfileImageUploadBadRequest(String token, Long userId, MockMultipartFile image) throws Exception {
        mockMvc.perform(multipart("/api/users/{id}/profile-image", userId)
                        .file(image)
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.error.code").value("BAD_REQUEST"));
    }

    private Path uploadedProfileImagePath(String profilePicture) {
        String relativePath = profilePicture.replaceFirst("^/uploads/", "");
        return Paths.get(uploadRoot, relativePath).normalize();
    }

    private byte[] createMinimalPng(int rgbColor) throws Exception {
        BufferedImage image = new BufferedImage(1, 1, BufferedImage.TYPE_INT_RGB);
        image.setRGB(0, 0, rgbColor);
        ByteArrayOutputStream output = new ByteArrayOutputStream();
        ImageIO.write(image, "png", output);
        return output.toByteArray();
    }

    private byte[] createMinimalWebp() {
        return Base64.getDecoder().decode(
                "UklGRgQBAABXRUJQVlA4WAoAAAAYAAAAAAAAAAAAVlA4TAgAAAAvAAAAEIiICEVYSUbWAAAASUkqAAgAAAAGABIBAwABAAAAAQAAABoBBQABAAAAVgAAABsBBQABAAAAXgAAACgBAwABAAAAAgAAADEBAgAQAAAAZgAAAGmHBAABAAAAdgAAAAAAAABgAAAAAQAAAGAAAAABAAAAcGFpbnQubmV0IDUuMC4xAAUAAJAHAAQAAAAwMjMwAaADAAEAAAABAAAAAqAEAAEAAAABAAAAA6AEAAEAAAABAAAABaAEAAEAAAC4AAAAAAAAAAIAAQACAAQAAABSOTgAAgAHAAQAAAAwMTAwAAAAAA=="
        );
    }
}
