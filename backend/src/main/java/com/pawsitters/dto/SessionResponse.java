package com.pawsitters.dto;

public record SessionResponse(
        boolean loggedIn,
        String email
) {}
