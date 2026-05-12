package com.pawsitters.security;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockCookie;
import org.springframework.mock.web.MockHttpServletResponse;
import org.springframework.test.web.servlet.MockMvc;
import tools.jackson.databind.ObjectMapper;

import java.time.LocalDate;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

import static org.hamcrest.Matchers.nullValue;
import static org.hamcrest.Matchers.containsString;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.options;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
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
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.loggedIn").value(false))
                .andExpect(jsonPath("$.data.email").value(nullValue()));
    }

    @Test
    void sessionWithInvalidTokenReturnsLoggedInFalse() throws Exception {
        mockMvc.perform(get("/api/auth/session")
                        .header("Authorization", "Bearer eyJhbGciOiJIUzI1NiJ9.fakePayload.fakeSignature"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.loggedIn").value(false))
                .andExpect(jsonPath("$.data.email").value(nullValue()));
    }

    @Test
    void loginWithUppercaseEmailSucceedsAfterRegister() throws Exception {
        String baseEmail = "auth." + UUID.randomUUID() + "@test.de";
        registerUser(baseEmail, "StrongPhrase123!");

        Map<String, String> loginPayload = new HashMap<>();
        loginPayload.put("email", baseEmail.toUpperCase());
        loginPayload.put("password", "StrongPhrase123!");

        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(loginPayload)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.token").isString())
                .andExpect(jsonPath("$.data.role").value("PET_OWNER"))
                .andExpect(jsonPath("$.data.passwordChangeRequired").value(false));
    }

    @Test
    void loginUsesUnicodeNormalizedPassword() throws Exception {
        String baseEmail = "unicode." + UUID.randomUUID() + "@test.de";
        registerUser(baseEmail, "Cafe\u0301 autumn meadow");

        Map<String, String> loginPayload = new HashMap<>();
        loginPayload.put("email", baseEmail);
        loginPayload.put("password", "Caf\u00e9 autumn meadow");

        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(loginPayload)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.token").isString());
    }

    @Test
    void registerDuplicateEmailDifferentCaseReturnsBadRequest() throws Exception {
        String baseEmail = "dup." + UUID.randomUUID() + "@test.de";
        registerUser(baseEmail, "StrongPhrase123!");

        Map<String, Object> secondRegister = buildRegisterPayload(baseEmail.toUpperCase(), "StrongPhrase123!");

        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(secondRegister)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.error.code").value("BAD_REQUEST"));
    }

    @Test
    void loginWithWrongPasswordReturnsInvalidCredentialsEnvelope() throws Exception {
        String baseEmail = "wrong.password." + UUID.randomUUID() + "@test.de";
        registerUser(baseEmail, "StrongPhrase123!");

        Map<String, String> loginPayload = new HashMap<>();
        loginPayload.put("email", baseEmail);
        loginPayload.put("password", "WrongPass123!");

        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(loginPayload)))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.status").value(401))
                .andExpect(jsonPath("$.data").value(nullValue()))
                .andExpect(jsonPath("$.error.code").value("AUTH_INVALID_CREDENTIALS"));
    }

    @Test
    void repeatedFailedLoginAttemptsAreRateLimited() throws Exception {
        String baseEmail = "rate.limit." + UUID.randomUUID() + "@test.de";
        registerUser(baseEmail, "StrongPhrase123!");

        Map<String, String> loginPayload = new HashMap<>();
        loginPayload.put("email", baseEmail);
        loginPayload.put("password", "WrongPhrase123!");

        for (int attempt = 0; attempt < 5; attempt++) {
            mockMvc.perform(post("/api/auth/login")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(loginPayload)))
                    .andExpect(status().isUnauthorized())
                    .andExpect(jsonPath("$.error.code").value("AUTH_INVALID_CREDENTIALS"));
        }

        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(loginPayload)))
                .andExpect(status().isTooManyRequests())
                .andExpect(jsonPath("$.error.code").value("TOO_MANY_REQUESTS"));
    }

    @Test
    void malformedJsonReturnsMalformedRequestEnvelope() throws Exception {
        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.status").value(400))
                .andExpect(jsonPath("$.error.code").value("MALFORMED_REQUEST"))
                .andExpect(jsonPath("$.error.details[0].field").value("request"));
    }

    @Test
    void registerValidationFailureReturnsFieldDetails() throws Exception {
        Map<String, Object> payload = buildRegisterPayload("not-an-email", "short");

        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(payload)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.status").value(400))
                .andExpect(jsonPath("$.error.code").value("VALIDATION_FAILED"))
                .andExpect(jsonPath("$.error.details").isArray());
    }

    @Test
    void registerWithTooShortPasswordReturnsPasswordValidationError() throws Exception {
        Map<String, Object> payload = buildRegisterPayload("short.password." + UUID.randomUUID() + "@test.de", "Short1!");

        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(payload)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.error.code").value("VALIDATION_FAILED"))
                .andExpect(jsonPath("$.error.details[0].field").value("password"));
    }

    @Test
    void registerWithNistStylePassphraseWithoutCharacterMixSucceeds() throws Exception {
        Map<String, Object> payload = buildRegisterPayload("passphrase." + UUID.randomUUID() + "@test.de",
                "correct horse battery staple");

        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(payload)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.token").isString());
    }

    @Test
    void registerWithPasswordContainingEmailLocalPartReturnsPasswordValidationError() throws Exception {
        Map<String, Object> payload = buildRegisterPayload("max.mustermann@test.de", "Max.Mustermann123!");

        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(payload)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.error.code").value("VALIDATION_FAILED"))
                .andExpect(jsonPath("$.error.details[0].field").value("password"));
    }

    @Test
    void registerWithPasswordLongerThanBcryptLimitReturnsPasswordValidationError() throws Exception {
        Map<String, Object> payload = buildRegisterPayload("long.password." + UUID.randomUUID() + "@test.de",
                "VerySecurePhrase123!" + "a".repeat(55));

        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(payload)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.error.code").value("VALIDATION_FAILED"))
                .andExpect(jsonPath("$.error.details[0].field").value("password"));
    }

    @Test
    void registerWithProjectNamePasswordVariantReturnsPasswordValidationError() throws Exception {
        Map<String, Object> payload = buildRegisterPayload("project.password." + UUID.randomUUID() + "@test.de",
                "Pawsitters2026!");

        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(payload)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.error.code").value("VALIDATION_FAILED"))
                .andExpect(jsonPath("$.error.details[0].field").value("password"));
    }

    @Test
    void registerWithPasswordContainingFirstNameReturnsPasswordValidationError() throws Exception {
        Map<String, Object> payload = buildRegisterPayload("name.password." + UUID.randomUUID() + "@test.de",
                "BlueMaxCloud9!");

        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(payload)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.error.code").value("VALIDATION_FAILED"))
                .andExpect(jsonPath("$.error.details[0].field").value("password"));
    }

    @Test
    void registerWithSequentialPasswordReturnsPasswordValidationError() throws Exception {
        Map<String, Object> payload = buildRegisterPayload("sequence.password." + UUID.randomUUID() + "@test.de",
                "Abcdef98765!");

        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(payload)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.error.code").value("VALIDATION_FAILED"))
                .andExpect(jsonPath("$.error.details[0].field").value("password"));
    }

    @Test
    void registerWithLongRepetitionPasswordReturnsPasswordValidationError() throws Exception {
        Map<String, Object> payload = buildRegisterPayload("repeat.password." + UUID.randomUUID() + "@test.de",
                "AaaaSecure123!");

        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(payload)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.error.code").value("VALIDATION_FAILED"))
                .andExpect(jsonPath("$.error.details[0].field").value("password"));
    }

    @Test
    void mailExistsReturnsTrueForExistingEmailWithoutToken() throws Exception {
        String baseEmail = "mail.exists." + UUID.randomUUID() + "@test.de";
        registerUser(baseEmail, "StrongPhrase123!");

        mockMvc.perform(get("/api/users/mailExists")
                        .param("mail", baseEmail.toUpperCase()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.exists").value(true));
    }

    @Test
    void mailExistsReturnsFalseForUnknownEmailWithoutToken() throws Exception {
        String baseEmail = "mail.missing." + UUID.randomUUID() + "@test.de";

        mockMvc.perform(get("/api/users/mailExists")
                        .param("mail", baseEmail))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.exists").value(false));
    }

    @Test
    void actuatorHealthIsPublicForDeploymentChecks() throws Exception {
        mockMvc.perform(get("/actuator/health"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("UP"));
    }

    @Test
    void sessionWithValidJwtReturnsLoggedInTrue() throws Exception {
        String baseEmail = "session." + UUID.randomUUID() + "@test.de";
        String token = registerUser(baseEmail, "StrongPhrase123!");

        mockMvc.perform(get("/api/auth/session")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.loggedIn").value(true))
                .andExpect(jsonPath("$.data.email").value(baseEmail));
    }

    @Test
    void sessionWithValidJwtCookieReturnsLoggedInTrue() throws Exception {
        String baseEmail = "session.cookie." + UUID.randomUUID() + "@test.de";
        String token = registerUser(baseEmail, "StrongPhrase123!");

        mockMvc.perform(get("/api/auth/session")
                        .cookie(new MockCookie(JwtTokenResolver.AUTH_COOKIE_NAME, token)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.loggedIn").value(true))
                .andExpect(jsonPath("$.data.email").value(baseEmail));
    }

    @Test
    void sessionAfterRegisterUsesAuthCookie() throws Exception {
        String baseEmail = "session.register.cookie." + UUID.randomUUID() + "@test.de";
        MockHttpServletResponse registerResponse = mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(buildRegisterPayload(baseEmail, "StrongPhrase123!"))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.token").isString())
                .andReturn()
                .getResponse();

        mockMvc.perform(get("/api/auth/session")
                        .cookie(registerResponse.getCookie(JwtTokenResolver.AUTH_COOKIE_NAME)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.loggedIn").value(true))
                .andExpect(jsonPath("$.data.email").value(baseEmail));
    }

    @Test
    void sessionAfterLoginUsesAuthCookie() throws Exception {
        String baseEmail = "session.login.cookie." + UUID.randomUUID() + "@test.de";
        registerUser(baseEmail, "StrongPhrase123!");

        Map<String, String> loginPayload = new HashMap<>();
        loginPayload.put("email", baseEmail);
        loginPayload.put("password", "StrongPhrase123!");

        MockHttpServletResponse loginResponse = mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(loginPayload)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.token").isString())
                .andReturn()
                .getResponse();

        mockMvc.perform(get("/api/auth/session")
                        .cookie(loginResponse.getCookie(JwtTokenResolver.AUTH_COOKIE_NAME)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.loggedIn").value(true))
                .andExpect(jsonPath("$.data.email").value(baseEmail));
    }

    @Test
    void loginSetsSecureCookieWhenForwardedProtoIsHttps() throws Exception {
        String baseEmail = "secure.cookie." + UUID.randomUUID() + "@test.de";
        registerUser(baseEmail, "StrongPhrase123!");

        Map<String, String> loginPayload = new HashMap<>();
        loginPayload.put("email", baseEmail);
        loginPayload.put("password", "StrongPhrase123!");

        mockMvc.perform(post("/api/auth/login")
                        .header("X-Forwarded-Proto", "https")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(loginPayload)))
                .andExpect(status().isOk())
                .andExpect(header().string("Set-Cookie", containsString("Secure")));
    }

    @Test
    void loginSetsSecureCookieWhenStandardForwardedProtoIsHttps() throws Exception {
        String baseEmail = "secure.forwarded." + UUID.randomUUID() + "@test.de";
        registerUser(baseEmail, "StrongPhrase123!");

        Map<String, String> loginPayload = new HashMap<>();
        loginPayload.put("email", baseEmail);
        loginPayload.put("password", "StrongPhrase123!");

        mockMvc.perform(post("/api/auth/login")
                        .header("Forwarded", "for=192.0.2.10;proto=https;host=example.test")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(loginPayload)))
                .andExpect(status().isOk())
                .andExpect(header().string("Set-Cookie", containsString("Secure")));
    }

    @Test
    void corsPreflightForSessionAllowsConfiguredLocalOrigin() throws Exception {
        mockMvc.perform(options("/api/auth/session")
                        .header("Origin", "http://localhost:3000")
                        .header("Access-Control-Request-Method", "GET")
                        .header("Access-Control-Request-Headers", "Authorization"))
                .andExpect(status().isOk())
                .andExpect(header().string("Access-Control-Allow-Origin", "http://localhost:3000"))
                .andExpect(header().string("Access-Control-Allow-Credentials", "true"));
    }

    @Test
    void sessionWithRawAuthorizationTokenReturnsLoggedInTrue() throws Exception {
        String baseEmail = "session.raw." + UUID.randomUUID() + "@test.de";
        String token = registerUser(baseEmail, "StrongPhrase123!");

        mockMvc.perform(get("/api/auth/session")
                        .header("Authorization", token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.loggedIn").value(true))
                .andExpect(jsonPath("$.data.email").value(baseEmail));
    }

    @Test
    void logoutInvalidatesTokenForSessionCheck() throws Exception {
        String baseEmail = "logout." + UUID.randomUUID() + "@test.de";
        String token = registerUser(baseEmail, "StrongPhrase123!");

        mockMvc.perform(post("/api/auth/logout")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));

        mockMvc.perform(get("/api/auth/session")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.loggedIn").value(false))
                .andExpect(jsonPath("$.data.email").value(nullValue()));
    }

    private String registerUser(String email, String password) throws Exception {
        String response = mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(buildRegisterPayload(email, password))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.token").isString())
                .andReturn()
                .getResponse()
                .getContentAsString();

        return objectMapper.readTree(response).get("data").get("token").asText();
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
