package com.pawsitters.controller;

import com.pawsitters.dto.ApiResponse;
import com.pawsitters.dto.DeleteResponse;
import com.pawsitters.dto.MailExistsResponse;
import com.pawsitters.dto.RegisterRequest;
import com.pawsitters.dto.RoleUpdateRequest;
import com.pawsitters.dto.UserPatchRequest;
import com.pawsitters.dto.UserResponse;
import com.pawsitters.dto.UserUpdateRequest;
import com.pawsitters.model.User;
import com.pawsitters.service.UserService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

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

    @PostMapping("/register")
    public ResponseEntity<ApiResponse<UserResponse>> register(@Valid @RequestBody RegisterRequest request,
                                                              HttpServletRequest servletRequest) {
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

        return ResponseEntity.ok(ApiResponse.success(
                HttpStatus.OK,
                "User registered successfully.",
                UserResponse.from(user),
                servletRequest.getRequestURI()
        ));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<UserResponse>> getUser(@PathVariable Long id,
                                                             HttpServletRequest servletRequest) {
        User user = userService.getUserById(id);
        return ResponseEntity.ok(ApiResponse.success(
                HttpStatus.OK,
                "User retrieved successfully.",
                UserResponse.from(user),
                servletRequest.getRequestURI()
        ));
    }

    @GetMapping("/mailExists")
    public ResponseEntity<ApiResponse<MailExistsResponse>> mailExists(@RequestParam @NotBlank @Email String mail,
                                                                      HttpServletRequest servletRequest) {
        boolean exists = userService.existsByEmail(mail);
        return ResponseEntity.ok(ApiResponse.success(
                HttpStatus.OK,
                "Mail existence checked successfully.",
                new MailExistsResponse(exists),
                servletRequest.getRequestURI()
        ));
    }

    @GetMapping("/me")
    public ResponseEntity<ApiResponse<UserResponse>> getMe(Authentication authentication,
                                                           HttpServletRequest servletRequest) {
        User user = userService.findByEmail(authentication.getName());
        return ResponseEntity.ok(ApiResponse.success(
                HttpStatus.OK,
                "Current user retrieved successfully.",
                UserResponse.from(user),
                servletRequest.getRequestURI()
        ));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<UserResponse>> updateUser(@PathVariable Long id,
                                                                @Valid @RequestBody UserUpdateRequest request,
                                                                Authentication authentication,
                                                                HttpServletRequest servletRequest) {
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
        return ResponseEntity.ok(ApiResponse.success(
                HttpStatus.OK,
                "User updated successfully.",
                UserResponse.from(user),
                servletRequest.getRequestURI()
        ));
    }

    @PatchMapping("/{id}")
    public ResponseEntity<ApiResponse<UserResponse>> patchUser(@PathVariable Long id,
                                                               @Valid @RequestBody UserPatchRequest request,
                                                               Authentication authentication,
                                                               HttpServletRequest servletRequest) {
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
        return ResponseEntity.ok(ApiResponse.success(
                HttpStatus.OK,
                "User patched successfully.",
                UserResponse.from(user),
                servletRequest.getRequestURI()
        ));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<DeleteResponse>> deleteUser(@PathVariable Long id,
                                                                  Authentication authentication,
                                                                  HttpServletRequest servletRequest) {
        userService.deleteUser(id, authentication.getName());
        String message = "User wurde erfolgreich geloescht.";
        DeleteResponse deleted = new DeleteResponse(true, id, message);
        return ResponseEntity.ok(ApiResponse.success(
                HttpStatus.OK,
                message,
                deleted,
                servletRequest.getRequestURI()
        ));
    }

    @PreAuthorize("hasRole('ADMIN')")
    @PatchMapping("/{id}/roles")
    public ResponseEntity<ApiResponse<UserResponse>> updateRole(@PathVariable Long id,
                                                                @Valid @RequestBody RoleUpdateRequest request,
                                                                HttpServletRequest servletRequest) {
        User user = userService.updateRole(id, request.role());
        return ResponseEntity.ok(ApiResponse.success(
                HttpStatus.OK,
                "User role updated successfully.",
                UserResponse.from(user),
                servletRequest.getRequestURI()
        ));
    }

    @PostMapping("/{id}/profile-image")
    public ResponseEntity<ApiResponse<UserResponse>> uploadProfileImage(@PathVariable Long id,
                                                                        @RequestParam(value = "file", required = false) MultipartFile file,
                                                                        @RequestParam(value = "image", required = false) MultipartFile image,
                                                                        Authentication authentication,
                                                                        HttpServletRequest servletRequest) {
        MultipartFile upload = file != null ? file : image;
        if (upload == null || upload.isEmpty()) {
            throw new IllegalArgumentException("Datei ist leer.");
        }

        try {
            String filename = UUID.randomUUID() + "-" + upload.getOriginalFilename();
            Path uploadPath = Paths.get(uploadDir);
            Files.createDirectories(uploadPath);
            Files.write(uploadPath.resolve(filename), upload.getBytes());

            User user = userService.updateProfileImage(id, authentication.getName(), filename);
            return ResponseEntity.ok(ApiResponse.success(
                    HttpStatus.OK,
                    "Profile image uploaded successfully.",
                    UserResponse.from(user),
                    servletRequest.getRequestURI()
            ));
        } catch (IOException e) {
            throw new ResponseStatusException(
                    HttpStatus.INTERNAL_SERVER_ERROR,
                    "Fehler beim Speichern der Datei: " + e.getMessage(),
                    e
            );
        }
    }
}
