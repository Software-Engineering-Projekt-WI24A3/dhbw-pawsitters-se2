package com.pawsitters.controller;

import com.pawsitters.dto.ApiResponse;
import com.pawsitters.dto.BookingProposalResponse;
import com.pawsitters.service.BookingProposalService;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@Validated
@RequestMapping("/api/bookings")
public class BookingController {

    private final BookingProposalService bookingProposalService;

    public BookingController(BookingProposalService bookingProposalService) {
        this.bookingProposalService = bookingProposalService;
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<BookingProposalResponse>>> getMyBookings(Authentication authentication,
                                                                                   HttpServletRequest servletRequest) {
        List<BookingProposalResponse> bookings = bookingProposalService.getAcceptedBookingsForUser(authentication.getName());
        return ResponseEntity.ok(ApiResponse.success(
                HttpStatus.OK,
                "Bookings retrieved successfully.",
                bookings,
                servletRequest.getRequestURI(),
                bookings.size()
        ));
    }
}
