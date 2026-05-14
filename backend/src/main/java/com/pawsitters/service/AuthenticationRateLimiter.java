package com.pawsitters.service;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.util.Locale;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.ConcurrentMap;

@Service
public class AuthenticationRateLimiter {

    private static final int MAX_FAILED_ATTEMPTS = 5;
    private static final Duration LOCK_DURATION = Duration.ofMinutes(15);

    private final Clock clock;
    private final ConcurrentMap<String, LoginAttempt> attemptsByKey = new ConcurrentHashMap<>();

    public AuthenticationRateLimiter() {
        this(Clock.systemUTC());
    }

    AuthenticationRateLimiter(Clock clock) {
        this.clock = clock;
    }

    public void assertLoginAllowed(String email, String clientIp) {
        LoginAttempt attempt = attemptsByKey.get(key(email, clientIp));
        if (attempt == null || attempt.lockedUntil == null) {
            return;
        }

        if (Instant.now(clock).isBefore(attempt.lockedUntil)) {
            throw new ResponseStatusException(
                    HttpStatus.TOO_MANY_REQUESTS,
                    "Zu viele fehlgeschlagene Login-Versuche. Bitte später erneut versuchen."
            );
        }

        attemptsByKey.remove(key(email, clientIp), attempt);
    }

    public void recordFailure(String email, String clientIp) {
        attemptsByKey.compute(key(email, clientIp), (ignored, existingAttempt) -> {
            LoginAttempt attempt = existingAttempt == null ? new LoginAttempt(0, null) : existingAttempt;
            int failedAttempts = attempt.failedAttempts + 1;
            Instant lockedUntil = failedAttempts >= MAX_FAILED_ATTEMPTS
                    ? Instant.now(clock).plus(LOCK_DURATION)
                    : null;
            return new LoginAttempt(failedAttempts, lockedUntil);
        });
    }

    public void recordSuccess(String email, String clientIp) {
        attemptsByKey.remove(key(email, clientIp));
    }

    private String key(String email, String clientIp) {
        String normalizedEmail = email == null ? "" : email.trim().toLowerCase(Locale.ROOT);
        String normalizedClientIp = clientIp == null ? "" : clientIp.trim();
        return normalizedEmail + "|" + normalizedClientIp;
    }

    private record LoginAttempt(int failedAttempts, Instant lockedUntil) {
    }
}
