package com.pawsitters.controller;

import com.pawsitters.dto.ApiResponse;
import com.pawsitters.dto.HostResponse;
import com.pawsitters.dto.MarketplaceFiltersResponse;
import com.pawsitters.dto.OfferResponse;
import com.pawsitters.model.PetChoice;
import com.pawsitters.service.MarketplaceService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.Pattern;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@Validated
@RequestMapping("/api/marketplace")
public class MarketplaceController {

    private final MarketplaceService marketplaceService;

    public MarketplaceController(MarketplaceService marketplaceService) {
        this.marketplaceService = marketplaceService;
    }

    @GetMapping("/hosts")
    public ResponseEntity<ApiResponse<List<HostResponse>>> getHosts(HttpServletRequest servletRequest) {
        List<HostResponse> hosts = marketplaceService.getHosts();
        return ResponseEntity.ok(ApiResponse.success(
                HttpStatus.OK,
                "Hosts retrieved successfully.",
                hosts,
                servletRequest.getRequestURI(),
                hosts.size()
        ));
    }

    @GetMapping("/offers")
    public ResponseEntity<ApiResponse<List<OfferResponse>>> getOffers(HttpServletRequest servletRequest) {
        List<OfferResponse> offers = marketplaceService.getPublishedOffers();
        return ResponseEntity.ok(ApiResponse.success(
                HttpStatus.OK,
                "Marketplace offers retrieved successfully.",
                offers,
                servletRequest.getRequestURI(),
                offers.size()
        ));
    }

    @GetMapping("/offers/latest")
    public ResponseEntity<ApiResponse<List<OfferResponse>>> getLatestOffers(
            @RequestParam(defaultValue = "10") @Min(value = 1, message = "limit muss mindestens 1 sein")
            @Max(value = 25, message = "limit darf maximal 25 sein") Integer limit,
            HttpServletRequest servletRequest) {
        List<OfferResponse> offers = marketplaceService.getLatestPublishedOffers(limit);
        return ResponseEntity.ok(ApiResponse.success(
                HttpStatus.OK,
                "Latest marketplace offers retrieved successfully.",
                offers,
                servletRequest.getRequestURI(),
                offers.size()
        ));
    }

    @GetMapping("/hosts/search")
    public ResponseEntity<ApiResponse<List<HostResponse>>> searchHosts(
            @RequestParam(required = false) PetChoice species,
            @RequestParam(required = false) @Pattern(regexp = "\\d{5}", message = "postalCode muss aus 5 Ziffern bestehen") String postalCode,
            @RequestParam(required = false) @Pattern(regexp = "\\d{5}", message = "zipCode muss aus 5 Ziffern bestehen") String zipCode,
            @RequestParam(required = false) @Pattern(regexp = "\\d{5}", message = "plz muss aus 5 Ziffern bestehen") String plz,
            HttpServletRequest servletRequest) {
        String resolvedPostalCode = firstNonBlank(postalCode, zipCode, plz);
        List<HostResponse> hosts = marketplaceService.searchHosts(species, resolvedPostalCode);
        return ResponseEntity.ok(ApiResponse.success(
                HttpStatus.OK,
                "Hosts searched successfully.",
                hosts,
                servletRequest.getRequestURI(),
                hosts.size()
        ));
    }

    @GetMapping("/filters")
    public ResponseEntity<ApiResponse<MarketplaceFiltersResponse>> getFilters(HttpServletRequest servletRequest) {
        MarketplaceFiltersResponse filters = marketplaceService.getFilters();
        return ResponseEntity.ok(ApiResponse.success(
                HttpStatus.OK,
                "Marketplace filters retrieved successfully.",
                filters,
                servletRequest.getRequestURI()
        ));
    }

    private String firstNonBlank(String... values) {
        for (String value : values) {
            if (value != null && !value.isBlank()) {
                return value.trim();
            }
        }
        return null;
    }
}
