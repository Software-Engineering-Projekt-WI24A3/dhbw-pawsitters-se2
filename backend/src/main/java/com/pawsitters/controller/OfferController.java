package com.pawsitters.controller;

import com.pawsitters.dto.ApiResponse;
import com.pawsitters.dto.OfferCreateRequest;
import com.pawsitters.dto.OfferResponse;
import com.pawsitters.service.OfferService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@Validated
@RequestMapping("/api/offers")
public class OfferController {

    private final OfferService offerService;

    public OfferController(OfferService offerService) {
        this.offerService = offerService;
    }

    @PostMapping
    public ResponseEntity<ApiResponse<OfferResponse>> createOffer(@Valid @RequestBody OfferCreateRequest request,
                                                                  Authentication authentication,
                                                                  HttpServletRequest servletRequest) {
        OfferResponse offer = OfferResponse.from(offerService.createOfferForHostEmail(
                authentication.getName(),
                request.title(),
                request.description(),
                request.pricePerDay(),
                request.acceptedPetSpecies(),
                request.services()
        ));
        return ResponseEntity.ok(ApiResponse.success(
                HttpStatus.OK,
                "Offer created successfully.",
                offer,
                servletRequest.getRequestURI()
        ));
    }

    @PatchMapping("/{id}/publish")
    public ResponseEntity<ApiResponse<OfferResponse>> publishOffer(@PathVariable Long id,
                                                                   Authentication authentication,
                                                                   HttpServletRequest servletRequest) {
        OfferResponse offer = OfferResponse.from(offerService.publishOfferForHostEmail(id, authentication.getName()));
        return ResponseEntity.ok(ApiResponse.success(
                HttpStatus.OK,
                "Offer published successfully.",
                offer,
                servletRequest.getRequestURI()
        ));
    }

    @PatchMapping("/{id}/withdraw")
    public ResponseEntity<ApiResponse<OfferResponse>> withdrawOffer(@PathVariable Long id,
                                                                    Authentication authentication,
                                                                    HttpServletRequest servletRequest) {
        OfferResponse offer = OfferResponse.from(offerService.withdrawOfferForHostEmail(id, authentication.getName()));
        return ResponseEntity.ok(ApiResponse.success(
                HttpStatus.OK,
                "Offer withdrawn successfully.",
                offer,
                servletRequest.getRequestURI()
        ));
    }
}
