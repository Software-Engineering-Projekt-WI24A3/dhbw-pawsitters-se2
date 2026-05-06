package com.pawsitters.controller;

import com.pawsitters.dto.RegisterRequest;
import com.pawsitters.dto.RoleUpdateRequest;
import com.pawsitters.dto.UserPatchRequest;
import com.pawsitters.dto.UserUpdateRequest;
import com.pawsitters.model.User;
import com.pawsitters.service.UserService;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.UUID;

@Validated
@RestController
@RequestMapping("/api/users")
public class UserController {

    private final UserService userService;
    private final String uploadDir = "uploads/profiles/";

    public UserController(UserService userService) {
        this.userService = userService;
    }

    /**
     * Registriert einen neuen User.
     * POST /api/users/register
     */
    @PostMapping("/register")
    public ResponseEntity<?> register(@Valid @RequestBody RegisterRequest request) {
        try {
            User user = userService.createUser(
                    request.email(),
                    request.password(),
                    request.firstName(),
                    request.lastName(),
                    request.phone(),
                    request.birthDate(),
                    request.emergencyContact(),
                    request.profilePicture(),
                    request.bio(),
                    request.role()
            );
            return ResponseEntity.ok(user);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    /**
     * Gibt einen User anhand seiner ID zurück.
     * GET /api/users/{id}
     */
    @GetMapping("/{id}")
    public ResponseEntity<?> getUser(@PathVariable Long id) {
        User user = userService.getUserById(id);
        return ResponseEntity.ok(user);
    }

    @GetMapping("/mailExists")
    public ResponseEntity<?> mailExists(@RequestParam @NotBlank @Email String mail) {
        boolean user = userService.existsByEmail(mail);
        return ResponseEntity.ok(user);
    }

    /**
     * Gibt den aktuellen angemeldeten User zurück.
     * GET /api/users/me
     */
    @GetMapping("/me")
    public ResponseEntity<?> getMe(Authentication authentication) {
        User user = userService.findByEmail(authentication.getName());
        return ResponseEntity.ok(user);
    }

    /**
     * Aktualisiert den User vollständig (PUT).
     * PUT /api/users/{id}
     */
    @PutMapping("/{id}")
    public ResponseEntity<?> updateUser(@PathVariable Long id,
                                        @Valid @RequestBody UserUpdateRequest request,
                                        Authentication authentication) {
        try {
            User user = userService.updateUser(
                    id,
                    authentication.getName(),
                    request.firstName(),
                    request.lastName(),
                    request.phone(),
                    request.birthDate(),
                    request.emergencyContact(),
                    request.profilePicture(),
                    request.bio()
            );
            return ResponseEntity.ok(user);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    /**
     * Aktualisiert den User partiell (PATCH).
     * PATCH /api/users/{id}
     */
    @PatchMapping("/{id}")
    public ResponseEntity<?> patchUser(@PathVariable Long id,
                                       @Valid @RequestBody UserPatchRequest request,
                                       Authentication authentication) {
        try {
            User user = userService.patchUser(
                    id,
                    authentication.getName(),
                    request.firstName(),
                    request.lastName(),
                    request.phone(),
                    request.birthDate(),
                    request.emergencyContact(),
                    request.profilePicture(),
                    request.bio()
            );
            return ResponseEntity.ok(user);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    /**
     * Löscht einen User.
     * DELETE /api/users/{id}
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteUser(@PathVariable Long id, Authentication authentication) {
        try {
            userService.deleteUser(id, authentication.getName());
            return ResponseEntity.ok(new DeleteUserResponse(true, id, "User wurde erfolgreich gelöscht."));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    /**
     * Aktualisiert die Benutzerrolle (Tierhalter ↔ Gastgeber).
     * PATCH /api/users/{id}/roles
     */
    @PreAuthorize("hasRole('ADMIN')")
    @PatchMapping("/{id}/roles")
    public ResponseEntity<?> updateRole(@PathVariable Long id,
                                        @Valid @RequestBody RoleUpdateRequest request) {
        try {
            User user = userService.updateRole(id, request.role());
            return ResponseEntity.ok(user);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    /**
     * Lädt ein Profilbild hoch.
     * POST /api/users/{id}/profile-image
     */
    @PostMapping("/{id}/profile-image")
    public ResponseEntity<?> uploadProfileImage(@PathVariable Long id,
                                                 @RequestParam("file") MultipartFile file,
                                                 Authentication authentication) {
        try {
            if (file.isEmpty()) {
                return ResponseEntity.badRequest().body("Datei ist leer.");
            }

            // Datei speichern
            String filename = UUID.randomUUID() + "-" + file.getOriginalFilename();
            Path uploadPath = Paths.get(uploadDir);
            Files.createDirectories(uploadPath);
            Files.write(uploadPath.resolve(filename), file.getBytes());

            // User aktualisieren
            User user = userService.updateProfileImage(id, authentication.getName(), filename);
            return ResponseEntity.ok(user);
        } catch (IOException e) {
            return ResponseEntity.status(500).body("Fehler beim Speichern der Datei: " + e.getMessage());
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    public record DeleteUserResponse(boolean deleted, Long id, String message) {}
}
