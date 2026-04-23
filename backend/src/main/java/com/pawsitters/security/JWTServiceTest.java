package com.pawsitters.security;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.test.util.ReflectionTestUtils;

import static org.junit.jupiter.api.Assertions.*;

class JwtServiceTest {

    private JwtService jwtService;

    @BeforeEach
    void setUp() {
        jwtService = new JwtService();
        // application.properties Werte manuell setzen
        ReflectionTestUtils.setField(jwtService, "secret",
                "pawsitters-super-secret-key-2025-dhbw-heilbronn");
        ReflectionTestUtils.setField(jwtService, "expiration", 86400000L);
    }

    // ===== TEST 8: Normalfall =====
    @Test
    void whenValidCredentials_thenTokenIsGenerated() {
        // WHEN
        String token = jwtService.generateToken("max@test.de", "PET_OWNER");

        // THEN
        assertNotNull(token);
        assertFalse(token.isEmpty());
    }

    // ===== TEST 9: Normalfall =====
    @Test
    void whenValidToken_thenEmailAndRoleAreExtractedCorrectly() {
        // GIVEN
        String token = jwtService.generateToken("max@test.de", "PET_OWNER");

        // WHEN
        String email = jwtService.extractEmail(token);
        String role  = jwtService.extractRole(token);

        // THEN
        assertEquals("max@test.de", email);
        assertEquals("PET_OWNER", role);
    }

    // ===== TEST 10: Edge Case =====
    @Test
    void whenInvalidToken_thenIsTokenValidReturnsFalse() {
        // GIVEN – manipulierter Token
        String fakeToken = "eyJhbGciOiJIUzI1NiJ9.fakePayload.fakeSignature";

        // WHEN
        boolean valid = jwtService.isTokenValid(fakeToken);

        // THEN
        assertFalse(valid);
    }

    // ===== TEST 11: Edge Case =====
    @Test
    void whenExpiredToken_thenIsTokenValidReturnsFalse() {
        // GIVEN – Token mit 0ms Ablaufzeit = sofort abgelaufen
        ReflectionTestUtils.setField(jwtService, "expiration", 0L);
        String expiredToken = jwtService.generateToken("max@test.de", "PET_OWNER");

        // WHEN
        boolean valid = jwtService.isTokenValid(expiredToken);

        // THEN
        assertFalse(valid);
    }
}