package com.pawsitters.security;

import com.pawsitters.model.UserRole;
import com.pawsitters.service.AuthService;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Past;
import jakarta.validation.constraints.Size;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AnonymousAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;

@RestController
@Validated
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
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
            return ResponseEntity.ok(new AuthResponse(result.token(), result.role()));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    /** POST /api/auth/login */
    @PostMapping("/login")
    public ResponseEntity<?> login(@Valid @RequestBody LoginRequest request) {
        try {
            AuthService.AuthResult result = authService.login(request.email(), request.password());
            return ResponseEntity.ok(new AuthResponse(result.token(), result.role()));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(401).body(e.getMessage());
        }
    }

    /** POST /api/auth/logout */
    @PostMapping("/logout")
    public ResponseEntity<?> logout(@RequestHeader(value = "Authorization", required = false) String authorizationHeader) {
        authService.logout(authorizationHeader);
        return ResponseEntity.ok("Logout erfolgreich.");
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
    public record RegisterRequest(
            @NotBlank @Email String email,
            @NotBlank @Size(min = 8, max = 100) String password,
            @NotBlank String firstName,
            @NotBlank String lastName,
            @NotBlank String phone,
            @NotNull @Past LocalDate birthDate,
            @NotBlank String emergencyContact,
            @NotBlank String profilePicture,
            @NotBlank String bio,
            @NotNull UserRole role) {}

    public record LoginRequest(
            @NotBlank @Email String email,
            @NotBlank String password) {}

    public record AuthResponse(String token, String role) {}

    public record SessionResponse(boolean loggedIn, String email) {}
}