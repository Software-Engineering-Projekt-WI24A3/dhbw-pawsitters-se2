package com.pawsitters.controller;

import com.pawsitters.dto.ApiResponse;
import com.pawsitters.dto.BookingProposalResponse;
import com.pawsitters.service.BookingProposalService;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@Validated
@RequestMapping("/api/booking-proposals")
public class BookingProposalController {

    private final BookingProposalService bookingProposalService;

    public BookingProposalController(BookingProposalService bookingProposalService) {
        this.bookingProposalService = bookingProposalService;
    }

    @PatchMapping("/{id}/accept")
    public ResponseEntity<ApiResponse<BookingProposalResponse>> acceptProposal(@PathVariable Long id,
                                                                               Authentication authentication,
                                                                               HttpServletRequest servletRequest) {
        BookingProposalResponse proposal = bookingProposalService.acceptProposal(id, authentication.getName());
        return ResponseEntity.ok(ApiResponse.success(
                HttpStatus.OK,
                "Booking proposal accepted successfully.",
                proposal,
                servletRequest.getRequestURI()
        ));
    }

    @PatchMapping("/{id}/decline")
    public ResponseEntity<ApiResponse<BookingProposalResponse>> declineProposal(@PathVariable Long id,
                                                                                Authentication authentication,
                                                                                HttpServletRequest servletRequest) {
        BookingProposalResponse proposal = bookingProposalService.declineProposal(id, authentication.getName());
        return ResponseEntity.ok(ApiResponse.success(
                HttpStatus.OK,
                "Booking proposal declined successfully.",
                proposal,
                servletRequest.getRequestURI()
        ));
    }

    @PatchMapping("/{id}/withdraw")
    public ResponseEntity<ApiResponse<BookingProposalResponse>> withdrawProposal(@PathVariable Long id,
                                                                                 Authentication authentication,
                                                                                 HttpServletRequest servletRequest) {
        BookingProposalResponse proposal = bookingProposalService.withdrawProposal(id, authentication.getName());
        return ResponseEntity.ok(ApiResponse.success(
                HttpStatus.OK,
                "Booking proposal withdrawn successfully.",
                proposal,
                servletRequest.getRequestURI()
        ));
    }
}
