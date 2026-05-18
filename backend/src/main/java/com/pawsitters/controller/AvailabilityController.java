package com.pawsitters.controller;

import com.pawsitters.dto.ApiResponse;
import com.pawsitters.dto.AvailabilityCreateRequest;
import com.pawsitters.dto.AvailabilityResponse;
import com.pawsitters.dto.DeleteResponse;
import com.pawsitters.dto.RecurringAvailabilityCreateRequest;
import com.pawsitters.service.AvailabilityService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@Validated
@RequestMapping("/api/availability")
public class AvailabilityController {

    private final AvailabilityService availabilityService;

    public AvailabilityController(AvailabilityService availabilityService) {
        this.availabilityService = availabilityService;
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<AvailabilityResponse>>> getAvailability(Authentication authentication,
                                                                                   HttpServletRequest servletRequest) {
        List<AvailabilityResponse> availability = availabilityService.getAvailabilityForHostEmail(authentication.getName());
        return ResponseEntity.ok(ApiResponse.success(
                HttpStatus.OK,
                "Availability retrieved successfully.",
                availability,
                servletRequest.getRequestURI(),
                availability.size()
        ));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<AvailabilityResponse>> createAvailability(
            @Valid @RequestBody AvailabilityCreateRequest request,
            Authentication authentication,
            HttpServletRequest servletRequest) {
        AvailabilityResponse availability = availabilityService.createSingleAvailability(
                authentication.getName(),
                request.startDate(),
                request.endDate()
        );
        return ResponseEntity.ok(ApiResponse.success(
                HttpStatus.OK,
                "Availability created successfully.",
                availability,
                servletRequest.getRequestURI()
        ));
    }

    @PostMapping("/recurring")
    public ResponseEntity<ApiResponse<AvailabilityResponse>> createRecurringAvailability(
            @Valid @RequestBody RecurringAvailabilityCreateRequest request,
            Authentication authentication,
            HttpServletRequest servletRequest) {
        AvailabilityResponse availability = availabilityService.createRecurringAvailability(
                authentication.getName(),
                request.startDate(),
                request.endDate(),
                request.daysOfWeek()
        );
        return ResponseEntity.ok(ApiResponse.success(
                HttpStatus.OK,
                "Recurring availability created successfully.",
                availability,
                servletRequest.getRequestURI()
        ));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<DeleteResponse>> deleteAvailability(@PathVariable Long id,
                                                                          Authentication authentication,
                                                                          HttpServletRequest servletRequest) {
        availabilityService.deleteAvailability(authentication.getName(), id);
        DeleteResponse deleted = new DeleteResponse(true, id, "Availability deleted successfully.");
        return ResponseEntity.ok(ApiResponse.success(
                HttpStatus.OK,
                "Availability deleted successfully.",
                deleted,
                servletRequest.getRequestURI()
        ));
    }
}
