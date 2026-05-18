package com.pawsitters.model;

import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToMany;
import jakarta.persistence.OrderBy;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "chat_messages")
public class ChatMessage {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "chat_id", nullable = false)
    private Chat chat;

    @ManyToOne
    @JoinColumn(name = "sender_id", nullable = false)
    private User sender;

    @Enumerated(EnumType.STRING)
    @Column
    private ChatMessageType type = ChatMessageType.TEXT;

    @Column(nullable = false, length = 2000)
    private String content = "";

    @ManyToOne
    @JoinColumn(name = "booking_proposal_id")
    private BookingProposal bookingProposal;

    @Column(nullable = false, updatable = false)
    private Instant createdAt;

    @OneToMany(mappedBy = "message", cascade = CascadeType.ALL, orphanRemoval = true)
    @OrderBy("createdAt ASC, id ASC")
    private List<MessageAttachment> attachments = new ArrayList<>();

    @PrePersist
    void prePersist() {
        if (createdAt == null) {
            createdAt = Instant.now();
        }
    }

    public Long getId() { return id; }

    public Chat getChat() { return chat; }

    public User getSender() { return sender; }

    public ChatMessageType getType() { return type; }

    public String getContent() { return content; }

    public BookingProposal getBookingProposal() { return bookingProposal; }

    public Instant getCreatedAt() { return createdAt; }

    public List<MessageAttachment> getAttachments() { return attachments; }

    public void setId(Long id) { this.id = id; }

    public void setChat(Chat chat) { this.chat = chat; }

    public void setSender(User sender) { this.sender = sender; }

    public void setType(ChatMessageType type) { this.type = type == null ? ChatMessageType.TEXT : type; }

    public void setContent(String content) { this.content = content == null ? "" : content; }

    public void setBookingProposal(BookingProposal bookingProposal) { this.bookingProposal = bookingProposal; }

    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }

    public void setAttachments(List<MessageAttachment> attachments) {
        this.attachments = attachments == null ? new ArrayList<>() : attachments;
    }

    public ChatMessage() {}
}
