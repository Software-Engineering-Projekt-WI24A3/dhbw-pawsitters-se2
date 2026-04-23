package com.pawsitters.security;

import com.pawsitters.model.User;
import com.pawsitters.model.UserRole;
import com.pawsitters.service.UserService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AnonymousAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final UserService userService;
    private final JwtService jwtService;
    private final PasswordEncoder passwordEncoder;

    public AuthController(UserService userService,
                          JwtService jwtService,
                          PasswordEncoder passwordEncoder) {
        this.userService = userService;
        this.jwtService = jwtService;
        this.passwordEncoder = passwordEncoder;
    }

    /** POST /api/auth/register */
    @PostMapping("/register")
    public ResponseEntity<?> register(@RequestBody RegisterRequest request) {
        try {
            User user = userService.createUser(
                    request.email(), request.password(),
                    request.firstName(), request.lastName(),
                    request.phone(), LocalDate.parse(request.birthDate()),
                    request.emergencyContact(), request.profilePicture(),
                    request.bio(), request.role()
            );
            String token = jwtService.generateToken(
                    user.getEmail(), user.getRole().name()
            );
            return ResponseEntity.ok(new AuthResponse(token, user.getRole().name()));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    /** POST /api/auth/login */
    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody LoginRequest request) {
        try {
            User user = userService.findByEmail(request.email());

            if (!passwordEncoder.matches(request.password(), user.getPasswordHash())) {
                return ResponseEntity.status(401).body("Ungültige Credentials.");
            }

            String token = jwtService.generateToken(
                    user.getEmail(), user.getRole().name()
            );
            return ResponseEntity.ok(new AuthResponse(token, user.getRole().name()));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(401).body("Ungültige Credentials.");
        }
    }

    /** POST /api/auth/logout */
    @PostMapping("/logout")
    public ResponseEntity<?> logout() {
        // JWT ist stateless – Client löscht Token lokal
        // Server-seitig nichts zu tun
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
            String email, String password, String firstName, String lastName,
            String phone, String birthDate, String emergencyContact,
            String profilePicture, String bio, UserRole role) {}

    public record LoginRequest(String email, String password) {}

    public record AuthResponse(String token, String role) {}

    public record SessionResponse(boolean loggedIn, String email) {}
}