package com.pawsitters.security;

import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.stereotype.Component;

import java.util.Optional;

@Component
public class JwtTokenResolver {

    public static final String AUTH_COOKIE_NAME = "PAWSITTERS_AUTH_TOKEN";
    private static final String BEARER_PREFIX = "Bearer ";

    public Optional<String> resolve(HttpServletRequest request) {
        return resolveFromAuthorizationHeader(request.getHeader("Authorization"))
                .or(() -> resolveFromCookie(request));
    }

    public Optional<String> resolveFromAuthorizationHeader(String authorizationHeader) {
        if (authorizationHeader == null || authorizationHeader.isBlank()) {
            return Optional.empty();
        }

        String value = authorizationHeader.trim();
        if (value.regionMatches(true, 0, BEARER_PREFIX, 0, BEARER_PREFIX.length())) {
            value = value.substring(BEARER_PREFIX.length()).trim();
        }

        return value.isBlank() ? Optional.empty() : Optional.of(value);
    }

    private Optional<String> resolveFromCookie(HttpServletRequest request) {
        Cookie[] cookies = request.getCookies();
        if (cookies == null) {
            return Optional.empty();
        }

        for (Cookie cookie : cookies) {
            String value = cookie.getValue();
            if (AUTH_COOKIE_NAME.equals(cookie.getName()) && value != null && !value.isBlank()) {
                return Optional.of(value);
            }
        }

        return Optional.empty();
    }
}
