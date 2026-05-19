package com.pawsitters.controller;

import com.pawsitters.dto.ApiResponse;
import com.pawsitters.dto.HostReviewResponse;
import com.pawsitters.dto.ReviewCreateRequest;
import com.pawsitters.service.ReviewService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationCredentialsNotFoundException;
import org.springframework.security.core.Authentication;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@Validated
public class ReviewController {

    private final ReviewService reviewService;

    public ReviewController(ReviewService reviewService) {
        this.reviewService = reviewService;
    }

    @PostMapping("/api/reviews")
    public ResponseEntity<ApiResponse<HostReviewResponse>> createReview(
            @Valid @RequestBody ReviewCreateRequest request,
            Authentication authentication,
            HttpServletRequest servletRequest) {
        HostReviewResponse review = reviewService.createReview(
                requireAuthenticatedEmail(authentication),
                request.bookingId(),
                request.rating(),
                request.communicationRating(),
                request.reliabilityRating(),
                request.careRating(),
                request.comment()
        );

        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.success(
                HttpStatus.CREATED,
                "Review created successfully.",
                review,
                servletRequest.getRequestURI()
        ));
    }

    @GetMapping("/api/hosts/{id}/reviews")
    public ResponseEntity<ApiResponse<List<HostReviewResponse>>> getHostReviews(@PathVariable Long id,
                                                                                HttpServletRequest servletRequest) {
        List<HostReviewResponse> reviews = reviewService.getReviewsForHost(id);
        return ResponseEntity.ok(ApiResponse.success(
                HttpStatus.OK,
                "Host reviews retrieved successfully.",
                reviews,
                servletRequest.getRequestURI(),
                reviews.size()
        ));
    }

    private String requireAuthenticatedEmail(Authentication authentication) {
        if (authentication == null || authentication.getName() == null || authentication.getName().isBlank()) {
            throw new AuthenticationCredentialsNotFoundException("Authentication required.");
        }
        return authentication.getName();
    }
}
