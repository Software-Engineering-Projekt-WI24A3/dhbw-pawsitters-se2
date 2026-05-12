package com.pawsitters.security;

import com.pawsitters.dto.ApiResponse;
import com.pawsitters.dto.AuthResponse;
import com.pawsitters.dto.RegisterRequest;
import com.pawsitters.dto.SessionResponse;
import com.pawsitters.service.AuthenticationRateLimiter;
import com.pawsitters.service.AuthService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseCookie;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AnonymousAuthenticationToken;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Locale;

@RestController
@Validated
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthService authService;
    private final JwtTokenResolver jwtTokenResolver;
    private final AuthenticationRateLimiter authenticationRateLimiter;

    @Value("${jwt.expiration}")
    private long jwtExpiration;

    @Value("${auth.cookie.same-site:Lax}")
    private String authCookieSameSite;

    @Value("${auth.cookie.secure-mode:auto}")
    private String authCookieSecureMode;

    @Value("${auth.cookie.domain:}")
    private String authCookieDomain;

    public AuthController(AuthService authService,
                          JwtTokenResolver jwtTokenResolver,
                          AuthenticationRateLimiter authenticationRateLimiter) {
        this.authService = authService;
        this.jwtTokenResolver = jwtTokenResolver;
        this.authenticationRateLimiter = authenticationRateLimiter;
    }

    @PostMapping("/register")
    public ResponseEntity<ApiResponse<AuthResponse>> register(@Valid @RequestBody RegisterRequest request,
                                                              HttpServletRequest servletRequest) {
        AuthService.AuthResult result = authService.register(
                request.email(), request.password(),
                request.firstName(), request.lastName(),
                request.phone(), request.birthDate(),
                request.emergencyContact(), request.profilePicture(),
                request.bio(), request.role(),
                request.postalCode(), request.city(), request.acceptedPetSpecies()
        );
        return withAuthCookie(result, "Registration successful.", servletRequest);
    }

    @PostMapping("/login")
    public ResponseEntity<ApiResponse<AuthResponse>> login(@Valid @RequestBody LoginRequest request,
                                                           HttpServletRequest servletRequest) {
        String clientIp = clientIp(servletRequest);
        authenticationRateLimiter.assertLoginAllowed(request.email(), clientIp);
        AuthService.AuthResult result;
        try {
            result = authService.login(request.email(), request.password());
        } catch (BadCredentialsException e) {
            authenticationRateLimiter.recordFailure(request.email(), clientIp);
            throw e;
        }
        authenticationRateLimiter.recordSuccess(request.email(), clientIp);
        return withAuthCookie(result, "Login successful.", servletRequest);
    }

    @PostMapping("/logout")
    public ResponseEntity<ApiResponse<Void>> logout(HttpServletRequest request) {
        jwtTokenResolver.resolve(request).ifPresent(authService::logout);
        return ResponseEntity.ok()
                .header(HttpHeaders.SET_COOKIE, expiredAuthCookie(request).toString())
                .body(ApiResponse.success(
                        HttpStatus.OK,
                        "Logout erfolgreich.",
                        null,
                        request.getRequestURI()
                ));
    }

    @GetMapping("/session")
    public ResponseEntity<ApiResponse<SessionResponse>> session(HttpServletRequest servletRequest) {
        var auth = SecurityContextHolder.getContext().getAuthentication();
        SessionResponse session = auth != null
                && auth.isAuthenticated()
                && !(auth instanceof AnonymousAuthenticationToken)
                ? new SessionResponse(true, auth.getName())
                : new SessionResponse(false, null);

        return ResponseEntity.ok(ApiResponse.success(
                HttpStatus.OK,
                "Session retrieved successfully.",
                session,
                servletRequest.getRequestURI()
        ));
    }

    public record LoginRequest(
            @NotBlank @Email String email,
            @NotBlank String password) {}

    private ResponseEntity<ApiResponse<AuthResponse>> withAuthCookie(AuthService.AuthResult result,
                                                                     String message,
                                                                     HttpServletRequest servletRequest) {
        return ResponseEntity.ok()
                .header(HttpHeaders.SET_COOKIE, authCookie(result.token(), servletRequest).toString())
                .body(ApiResponse.success(
                        HttpStatus.OK,
                        message,
                        new AuthResponse(result.token(), result.role(), result.passwordChangeRequired()),
                        servletRequest.getRequestURI()
                ));
    }

    private ResponseCookie authCookie(String token, HttpServletRequest request) {
        return cookieBuilder(token, request)
                .maxAge(jwtExpiration / 1000)
                .build();
    }

    private ResponseCookie expiredAuthCookie(HttpServletRequest request) {
        return cookieBuilder("", request)
                .maxAge(0)
                .build();
    }

    private ResponseCookie.ResponseCookieBuilder cookieBuilder(String token, HttpServletRequest request) {
        ResponseCookie.ResponseCookieBuilder builder = ResponseCookie.from(JwtTokenResolver.AUTH_COOKIE_NAME, token)
                .httpOnly(true)
                .secure(resolveCookieSecure(request))
                .sameSite(resolveCookieSameSite())
                .path("/")
                .maxAge(jwtExpiration / 1000);

        String normalizedDomain = normalizeCookieDomain(authCookieDomain);
        if (normalizedDomain != null) {
            builder.domain(normalizedDomain);
        }

        return builder;
    }

    private boolean resolveCookieSecure(HttpServletRequest request) {
        String mode = normalizeCookieSecureMode(authCookieSecureMode);
        return switch (mode) {
            case "always" -> true;
            case "never" -> false;
            default -> isSecureRequest(request);
        };
    }

    private String resolveCookieSameSite() {
        String normalized = authCookieSameSite == null
                ? ""
                : authCookieSameSite.trim().toLowerCase(Locale.ROOT);
        return switch (normalized) {
            case "strict" -> "Strict";
            case "none" -> "None";
            default -> "Lax";
        };
    }

    private String normalizeCookieSecureMode(String value) {
        if (value == null) {
            return "auto";
        }

        String normalized = value.trim().toLowerCase(Locale.ROOT);
        if ("always".equals(normalized) || "never".equals(normalized) || "auto".equals(normalized)) {
            return normalized;
        }

        return "auto";
    }

    private boolean isSecureRequest(HttpServletRequest request) {
        if (request != null && request.isSecure()) {
            return true;
        }

        if (request == null) {
            return false;
        }

        String forwardedProto = firstForwardedValue(request.getHeader("X-Forwarded-Proto"));
        if ("https".equalsIgnoreCase(forwardedProto)) {
            return true;
        }

        String standardizedForwardedProto = forwardedProtoFromStandardHeader(request.getHeader("Forwarded"));
        if ("https".equalsIgnoreCase(standardizedForwardedProto)) {
            return true;
        }

        String forwardedSsl = request.getHeader("X-Forwarded-Ssl");
        return forwardedSsl != null && "on".equalsIgnoreCase(forwardedSsl.trim());
    }

    private String firstForwardedValue(String rawValue) {
        if (rawValue == null || rawValue.isBlank()) {
            return "";
        }

        String[] parts = rawValue.split(",", 2);
        return parts[0].trim();
    }

    private String forwardedProtoFromStandardHeader(String rawForwardedHeader) {
        if (rawForwardedHeader == null || rawForwardedHeader.isBlank()) {
            return "";
        }

        String firstEntry = rawForwardedHeader.split(",", 2)[0].trim();
        if (firstEntry.isEmpty()) {
            return "";
        }

        String[] parameters = firstEntry.split(";");
        for (String parameter : parameters) {
            String[] keyAndValue = parameter.split("=", 2);
            if (keyAndValue.length != 2) {
                continue;
            }

            if (!"proto".equalsIgnoreCase(keyAndValue[0].trim())) {
                continue;
            }

            String value = keyAndValue[1].trim();
            if (value.length() >= 2 && value.startsWith("\"") && value.endsWith("\"")) {
                value = value.substring(1, value.length() - 1);
            }

            return value.trim();
        }

        return "";
    }

    private String normalizeCookieDomain(String rawDomain) {
        if (rawDomain == null) {
            return null;
        }

        String normalized = rawDomain.trim();
        if (normalized.isEmpty()) {
            return null;
        }

        if (normalized.startsWith(".")) {
            normalized = normalized.substring(1);
        }

        return normalized.isEmpty() ? null : normalized;
    }

    private String clientIp(HttpServletRequest request) {
        String forwardedFor = request.getHeader("X-Forwarded-For");
        if (forwardedFor != null && !forwardedFor.isBlank()) {
            return forwardedFor.split(",", 2)[0].trim();
        }
        return request.getRemoteAddr();
    }
}
