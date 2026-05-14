package com.pawsitters.controller;

import com.pawsitters.dto.ApiResponse;
import com.pawsitters.dto.MessageAttachmentResponse;
import com.pawsitters.service.ChatService;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

@RestController
@Validated
@RequestMapping("/api/messages")
public class MessageController {

    private final ChatService chatService;

    public MessageController(ChatService chatService) {
        this.chatService = chatService;
    }

    @PostMapping(value = "/{id}/attachments", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<ApiResponse<MessageAttachmentResponse>> uploadAttachment(@PathVariable Long id,
                                                                                  @RequestParam(value = "image", required = false) MultipartFile image,
                                                                                  @RequestParam(value = "file", required = false) MultipartFile file,
                                                                                  Authentication authentication,
                                                                                  HttpServletRequest servletRequest) {
        MultipartFile upload = image != null ? image : file;
        MessageAttachmentResponse attachment = chatService.uploadAttachment(id, authentication.getName(), upload);
        return ResponseEntity.ok(ApiResponse.success(
                HttpStatus.OK,
                "Message attachment uploaded successfully.",
                attachment,
                servletRequest.getRequestURI()
        ));
    }
}
