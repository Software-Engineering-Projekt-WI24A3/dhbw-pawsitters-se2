package com.pawsitters.dto;

public record AuthResponse(
        String token,
        String role,
        boolean passwordChangeRequired
) {}
