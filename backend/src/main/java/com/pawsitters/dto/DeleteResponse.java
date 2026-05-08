package com.pawsitters.dto;

public record DeleteResponse(
        boolean deleted,
        Long id,
        String message
) {}
