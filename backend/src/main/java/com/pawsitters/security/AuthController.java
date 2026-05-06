package com.pawsitters.security;

import com.pawsitters.dto.RegisterRequest;
import com.pawsitters.service.AuthService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseCookie;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AnonymousAuthenticationToken;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

@RestController
@Validated
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthService authService;
    private final JwtTokenResolver jwtTokenResolver;

    @Value("${jwt.expiration}")
    private long jwtExpiration;

    public AuthController(AuthService authService, JwtTokenResolver jwtTokenResolver) {
        this.authService = authService;
        this.jwtTokenResolver = jwtTokenResolver;
    }

    /** POST /api/auth/register */
    @PostMapping("/register")
    public ResponseEntity<?> register(@Valid @RequestBody RegisterRequest request) {
        try {
            AuthService.AuthResult result = authService.register(
                    request.email(), request.password(),
                    request.firstName(), request.lastName(),
                    request.phone(), request.birthDate(),
                    request.emergencyContact(), request.profilePicture(),
                    request.bio(), request.role()
            );
            return withAuthCookie(result);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    /** POST /api/auth/login */
    @PostMapping("/login")
    public ResponseEntity<?> login(@Valid @RequestBody LoginRequest request) {
        try {
            AuthService.AuthResult result = authService.login(request.email(), request.password());
            return withAuthCookie(result);
        } catch (BadCredentialsException e) {
            return ResponseEntity.status(401).body("Ungültige Credentials.");
        }
    }

    /** POST /api/auth/logout */
    @PostMapping("/logout")
    public ResponseEntity<?> logout(HttpServletRequest request) {
        jwtTokenResolver.resolve(request).ifPresent(authService::logout);
        return ResponseEntity.ok()
                .header(HttpHeaders.SET_COOKIE, expiredAuthCookie().toString())
                .body("Logout erfolgreich.");
    }

    /** GET /api/auth/session */
    @GetMapping("/session")
    public ResponseEntity<?> session() {
        var auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth != null && auth.isAuthenticated() && !(auth instanceof AnonymousAuthenticationToken)) {
            return ResponseEntity.ok(new SessionResponse(true, auth.getName()));
        }
        return ResponseEntity.ok(new SessionResponse(false, null));
    }

    // ===== Records =====
    public record LoginRequest(
            @NotBlank @Email String email,
            @NotBlank String password) {}

    public record AuthResponse(String token, String role) {}

    public record SessionResponse(boolean loggedIn, String email) {}

    private ResponseEntity<AuthResponse> withAuthCookie(AuthService.AuthResult result) {
        return ResponseEntity.ok()
                .header(HttpHeaders.SET_COOKIE, authCookie(result.token()).toString())
                .body(new AuthResponse(result.token(), result.role()));
    }

    private ResponseCookie authCookie(String token) {
        return ResponseCookie.from(JwtTokenResolver.AUTH_COOKIE_NAME, token)
                .httpOnly(true)
                .secure(false)
                .sameSite("Lax")
                .path("/")
                .maxAge(jwtExpiration / 1000)
                .build();
    }

    private ResponseCookie expiredAuthCookie() {
        return ResponseCookie.from(JwtTokenResolver.AUTH_COOKIE_NAME, "")
                .httpOnly(true)
                .secure(false)
                .sameSite("Lax")
                .path("/")
                .maxAge(0)
                .build();
    }
}
