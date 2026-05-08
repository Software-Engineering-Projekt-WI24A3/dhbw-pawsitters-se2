package com.pawsitters.security;

import com.pawsitters.dto.ApiResponse;
import com.pawsitters.dto.AuthResponse;
import com.pawsitters.dto.RegisterRequest;
import com.pawsitters.dto.SessionResponse;
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
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

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
        AuthService.AuthResult result = authService.login(request.email(), request.password());
        return withAuthCookie(result, "Login successful.", servletRequest);
    }

    @PostMapping("/logout")
    public ResponseEntity<ApiResponse<Void>> logout(HttpServletRequest request) {
        jwtTokenResolver.resolve(request).ifPresent(authService::logout);
        return ResponseEntity.ok()
                .header(HttpHeaders.SET_COOKIE, expiredAuthCookie().toString())
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
                .header(HttpHeaders.SET_COOKIE, authCookie(result.token()).toString())
                .body(ApiResponse.success(
                        HttpStatus.OK,
                        message,
                        new AuthResponse(result.token(), result.role()),
                        servletRequest.getRequestURI()
                ));
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
