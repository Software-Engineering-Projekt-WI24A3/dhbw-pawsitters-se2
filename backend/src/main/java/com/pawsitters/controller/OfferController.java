package com.pawsitters.controller;

import com.pawsitters.dto.ApiResponse;
import com.pawsitters.dto.OfferCreateRequest;
import com.pawsitters.dto.OfferResponse;
import com.pawsitters.dto.OfferUpdateRequest;
import com.pawsitters.service.OfferService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@Validated
@RequestMapping("/api/offers")
public class OfferController {

    private final OfferService offerService;

    public OfferController(OfferService offerService) {
        this.offerService = offerService;
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<OfferResponse>>> getOwnOffers(Authentication authentication,
                                                                         HttpServletRequest servletRequest) {
        List<OfferResponse> offers = offerService.getOffersForUserEmail(authentication.getName())
                .stream()
                .map(OfferResponse::from)
                .toList();
        return ResponseEntity.ok(ApiResponse.success(
                HttpStatus.OK,
                "Offers retrieved successfully.",
                offers,
                servletRequest.getRequestURI(),
                offers.size()
        ));
    }

    @GetMapping("/host/{hostId}")
    public ResponseEntity<ApiResponse<List<OfferResponse>>> getOffersForHost(@PathVariable Long hostId,
                                                                              Authentication authentication,
                                                                              HttpServletRequest servletRequest) {
        String requesterEmail = authentication != null ? authentication.getName() : null;
        List<OfferResponse> offers = offerService.getProfileOffersForHostId(hostId, requesterEmail)
                .stream()
                .map(OfferResponse::from)
                .toList();
        return ResponseEntity.ok(ApiResponse.success(
                HttpStatus.OK,
                "Offers retrieved successfully.",
                offers,
                servletRequest.getRequestURI(),
                offers.size()
        ));
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
                request.services(),
                request.availableFrom(),
                request.availableTo()
        ));
        return ResponseEntity.ok(ApiResponse.success(
                HttpStatus.OK,
                "Offer created successfully.",
                offer,
                servletRequest.getRequestURI()
        ));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<OfferResponse>> getOffer(@PathVariable Long id,
                                                               Authentication authentication,
                                                               HttpServletRequest servletRequest) {
        OfferResponse offer = OfferResponse.from(offerService.getOfferForHostEmail(id, authentication.getName()));
        return ResponseEntity.ok(ApiResponse.success(
                HttpStatus.OK,
                "Offer retrieved successfully.",
                offer,
                servletRequest.getRequestURI()
        ));
    }

    @PatchMapping("/{id}")
    public ResponseEntity<ApiResponse<OfferResponse>> updateOffer(@PathVariable Long id,
                                                                  @Valid @RequestBody OfferUpdateRequest request,
                                                                  Authentication authentication,
                                                                  HttpServletRequest servletRequest) {
        OfferResponse offer = OfferResponse.from(offerService.updateDraftOfferForHostEmail(
                id,
                authentication.getName(),
                request.title(),
                request.description(),
                request.pricePerDay(),
                request.acceptedPetSpecies(),
                request.services(),
                request.availableFrom(),
                request.availableTo()
        ));
        return ResponseEntity.ok(ApiResponse.success(
                HttpStatus.OK,
                "Offer updated successfully.",
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
