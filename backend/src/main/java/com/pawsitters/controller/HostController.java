package com.pawsitters.controller;

import com.pawsitters.dto.ApiResponse;
import com.pawsitters.dto.HostCreateRequest;
import com.pawsitters.dto.HostProfileResponse;
import com.pawsitters.dto.HostStatsResponse;
import com.pawsitters.service.HostService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationCredentialsNotFoundException;
import org.springframework.security.core.Authentication;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

@RestController
@Validated
@RequestMapping("/api/hosts")
public class HostController {

    private final HostService hostService;

    public HostController(HostService hostService) {
        this.hostService = hostService;
    }

    @PostMapping
    public ResponseEntity<ApiResponse<HostProfileResponse>> createOrUpdateHostProfile(
            @Valid @RequestBody HostCreateRequest request,
            Authentication authentication,
            HttpServletRequest servletRequest) {
        HostProfileResponse host = hostService.createOrUpdateHostProfile(
                requireAuthenticatedEmail(authentication),
                request.bio(),
                request.experience(),
                request.experiences(),
                request.accommodationDescription(),
                request.acceptedPetSpecies()
        );

        return ResponseEntity.ok(ApiResponse.success(
                HttpStatus.OK,
                "Host profile saved successfully.",
                host,
                servletRequest.getRequestURI()
        ));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<HostProfileResponse>> getHostProfile(@PathVariable Long id,
                                                                           HttpServletRequest servletRequest) {
        HostProfileResponse host = hostService.getHostProfile(id);
        return ResponseEntity.ok(ApiResponse.success(
                HttpStatus.OK,
                "Host profile retrieved successfully.",
                host,
                servletRequest.getRequestURI()
        ));
    }

    @GetMapping("/{id}/stats")
    public ResponseEntity<ApiResponse<HostStatsResponse>> getHostStats(@PathVariable Long id,
                                                                       HttpServletRequest servletRequest) {
        HostStatsResponse stats = hostService.getHostStats(id);
        return ResponseEntity.ok(ApiResponse.success(
                HttpStatus.OK,
                "Host stats retrieved successfully.",
                stats,
                servletRequest.getRequestURI()
        ));
    }

    @PostMapping(value = "/{id}/gallery", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<ApiResponse<HostProfileResponse>> uploadGalleryImage(
            @PathVariable Long id,
            @RequestParam(value = "file", required = false) MultipartFile file,
            @RequestParam(value = "image", required = false) MultipartFile image,
            Authentication authentication,
            HttpServletRequest servletRequest) {
        MultipartFile upload = file != null ? file : image;
        HostProfileResponse host = hostService.addGalleryImage(
                id,
                requireAuthenticatedEmail(authentication),
                upload
        );

        return ResponseEntity.ok(ApiResponse.success(
                HttpStatus.OK,
                "Host gallery image uploaded successfully.",
                host,
                servletRequest.getRequestURI()
        ));
    }

    private String requireAuthenticatedEmail(Authentication authentication) {
        if (authentication == null || authentication.getName() == null || authentication.getName().isBlank()) {
            throw new AuthenticationCredentialsNotFoundException("Authentication required.");
        }
        return authentication.getName();
    }
}
