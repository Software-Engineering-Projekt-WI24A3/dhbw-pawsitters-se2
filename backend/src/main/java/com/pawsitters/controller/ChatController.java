package com.pawsitters.controller;

import com.pawsitters.dto.ApiResponse;
import com.pawsitters.dto.BookingProposalCreateRequest;
import com.pawsitters.dto.BookingProposalResponse;
import com.pawsitters.dto.ChatCreateRequest;
import com.pawsitters.dto.ChatMessageCreateRequest;
import com.pawsitters.dto.ChatMessageResponse;
import com.pawsitters.dto.ChatResponse;
import com.pawsitters.service.BookingProposalService;
import com.pawsitters.service.ChatService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@Validated
@RequestMapping("/api/chats")
public class ChatController {

    private final ChatService chatService;
    private final BookingProposalService bookingProposalService;

    public ChatController(ChatService chatService, BookingProposalService bookingProposalService) {
        this.chatService = chatService;
        this.bookingProposalService = bookingProposalService;
    }

    @PostMapping
    public ResponseEntity<ApiResponse<ChatResponse>> createChat(@Valid @RequestBody ChatCreateRequest request,
                                                                Authentication authentication,
                                                                HttpServletRequest servletRequest) {
        ChatResponse chat = chatService.createOrGetChat(request.offerId(), authentication.getName());
        return ResponseEntity.ok(ApiResponse.success(
                HttpStatus.OK,
                "Chat retrieved successfully.",
                chat,
                servletRequest.getRequestURI()
        ));
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<ChatResponse>>> getChats(Authentication authentication,
                                                                    HttpServletRequest servletRequest) {
        List<ChatResponse> chats = chatService.getChats(authentication.getName());
        return ResponseEntity.ok(ApiResponse.success(
                HttpStatus.OK,
                "Chats retrieved successfully.",
                chats,
                servletRequest.getRequestURI(),
                chats.size()
        ));
    }

    @GetMapping("/{id}/messages")
    public ResponseEntity<ApiResponse<List<ChatMessageResponse>>> getMessages(@PathVariable Long id,
                                                                              Authentication authentication,
                                                                              HttpServletRequest servletRequest) {
        List<ChatMessageResponse> messages = chatService.getMessages(id, authentication.getName());
        return ResponseEntity.ok(ApiResponse.success(
                HttpStatus.OK,
                "Chat messages retrieved successfully.",
                messages,
                servletRequest.getRequestURI(),
                messages.size()
        ));
    }

    @PostMapping("/{id}/messages")
    public ResponseEntity<ApiResponse<ChatMessageResponse>> createMessage(@PathVariable Long id,
                                                                          @Valid @RequestBody ChatMessageCreateRequest request,
                                                                          Authentication authentication,
                                                                          HttpServletRequest servletRequest) {
        ChatMessageResponse message = chatService.createMessage(id, authentication.getName(), request.content());
        return ResponseEntity.ok(ApiResponse.success(
                HttpStatus.OK,
                "Chat message created successfully.",
                message,
                servletRequest.getRequestURI()
        ));
    }

    @PostMapping("/{id}/booking-proposals")
    public ResponseEntity<ApiResponse<BookingProposalResponse>> createBookingProposal(
            @PathVariable Long id,
            @Valid @RequestBody BookingProposalCreateRequest request,
            Authentication authentication,
            HttpServletRequest servletRequest) {
        BookingProposalResponse proposal = bookingProposalService.createProposal(
                id,
                authentication.getName(),
                request.startDate(),
                request.endDate(),
                request.priceTotal(),
                request.petSpecies(),
                request.petCount(),
                request.note()
        );
        return ResponseEntity.ok(ApiResponse.success(
                HttpStatus.OK,
                "Booking proposal created successfully.",
                proposal,
                servletRequest.getRequestURI()
        ));
    }
}
