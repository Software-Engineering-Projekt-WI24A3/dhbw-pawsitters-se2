package com.pawsitters.dto;

import jakarta.validation.constraints.NotNull;

import com.pawsitters.model.UserRole;

public record RoleUpdateRequest(
        @NotNull UserRole role
) {}

