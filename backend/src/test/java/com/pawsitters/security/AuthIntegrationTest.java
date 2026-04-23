package com.pawsitters.security;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import java.time.LocalDate;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

import static org.hamcrest.Matchers.nullValue;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
class AuthIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Test
    void sessionWithoutTokenReturnsLoggedInFalse() throws Exception {
        mockMvc.perform(get("/api/auth/session"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.loggedIn").value(false))
                .andExpect(jsonPath("$.email").value(nullValue()));
    }

    @Test
    void sessionWithInvalidTokenReturnsLoggedInFalse() throws Exception {
        mockMvc.perform(get("/api/auth/session")
                        .header("Authorization", "Bearer eyJhbGciOiJIUzI1NiJ9.fakePayload.fakeSignature"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.loggedIn").value(false))
                .andExpect(jsonPath("$.email").value(nullValue()));
    }

    @Test
    void loginWithUppercaseEmailSucceedsAfterRegister() throws Exception {
        String baseEmail = "auth." + UUID.randomUUID() + "@test.de";
        registerUser(baseEmail, "StrongPass123!");

        Map<String, String> loginPayload = new HashMap<>();
        loginPayload.put("email", baseEmail.toUpperCase());
        loginPayload.put("password", "StrongPass123!");

        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(loginPayload)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.token").isString())
                .andExpect(jsonPath("$.role").value("PET_OWNER"));
    }

    @Test
    void registerDuplicateEmailDifferentCaseReturnsBadRequest() throws Exception {
        String baseEmail = "dup." + UUID.randomUUID() + "@test.de";
        registerUser(baseEmail, "StrongPass123!");

        Map<String, Object> secondRegister = buildRegisterPayload(baseEmail.toUpperCase(), "StrongPass123!");

        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(secondRegister)))
                .andExpect(status().isBadRequest());
    }

    @Test
    void sessionWithValidJwtReturnsLoggedInTrue() throws Exception {
        String baseEmail = "session." + UUID.randomUUID() + "@test.de";
        String token = registerUser(baseEmail, "StrongPass123!");

        mockMvc.perform(get("/api/auth/session")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.loggedIn").value(true))
                .andExpect(jsonPath("$.email").value(baseEmail));
    }

    private String registerUser(String email, String password) throws Exception {
        String response = mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(buildRegisterPayload(email, password))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.token").isString())
                .andReturn()
                .getResponse()
                .getContentAsString();

        return objectMapper.readTree(response).get("token").asText();
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
}

