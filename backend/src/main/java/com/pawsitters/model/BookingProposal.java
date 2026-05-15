package com.pawsitters.model;

import jakarta.persistence.Column;
import jakarta.persistence.CollectionTable;
import jakarta.persistence.ElementCollection;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.LinkedHashSet;
import java.util.Set;

@Entity
@Table(name = "booking_proposals")
public class BookingProposal {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "chat_id", nullable = false)
    private Chat chat;

    @ManyToOne
    @JoinColumn(name = "offer_id", nullable = false)
    private Offer offer;

    @ManyToOne
    @JoinColumn(name = "sender_id", nullable = false)
    private User sender;

    @ManyToOne
    @JoinColumn(name = "recipient_id", nullable = false)
    private User recipient;

    @Column(nullable = false)
    private LocalDate startDate;

    @Column(nullable = false)
    private LocalDate endDate;

    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal priceTotal;

    @Column(nullable = false, length = 3)
    private String currency = "EUR";

    @ElementCollection(targetClass = PetChoice.class)
    @CollectionTable(name = "booking_proposal_pet_species", joinColumns = @JoinColumn(name = "booking_proposal_id"))
    @Enumerated(EnumType.STRING)
    @Column(name = "species", nullable = false)
    private Set<PetChoice> petSpecies = new LinkedHashSet<>();

    @Column(nullable = false)
    private Integer petCount;

    @Column(length = 1000)
    private String note;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private BookingProposalStatus status = BookingProposalStatus.PENDING;

    @Enumerated(EnumType.STRING)
    private BookingProposalDeclineReason declineReason;

    @Column(nullable = false, updatable = false)
    private Instant createdAt;

    private Instant respondedAt;

    @PrePersist
    void prePersist() {
        if (createdAt == null) {
            createdAt = Instant.now();
        }
    }

    public Long getId() { return id; }

    public Chat getChat() { return chat; }

    public Offer getOffer() { return offer; }

    public User getSender() { return sender; }

    public User getRecipient() { return recipient; }

    public LocalDate getStartDate() { return startDate; }

    public LocalDate getEndDate() { return endDate; }

    public BigDecimal getPriceTotal() { return priceTotal; }

    public String getCurrency() { return currency; }

    public Set<PetChoice> getPetSpecies() { return petSpecies; }

    public Integer getPetCount() { return petCount; }

    public String getNote() { return note; }

    public BookingProposalStatus getStatus() { return status; }

    public BookingProposalDeclineReason getDeclineReason() { return declineReason; }

    public Instant getCreatedAt() { return createdAt; }

    public Instant getRespondedAt() { return respondedAt; }

    public void setId(Long id) { this.id = id; }

    public void setChat(Chat chat) { this.chat = chat; }

    public void setOffer(Offer offer) { this.offer = offer; }

    public void setSender(User sender) { this.sender = sender; }

    public void setRecipient(User recipient) { this.recipient = recipient; }

    public void setStartDate(LocalDate startDate) { this.startDate = startDate; }

    public void setEndDate(LocalDate endDate) { this.endDate = endDate; }

    public void setPriceTotal(BigDecimal priceTotal) { this.priceTotal = priceTotal; }

    public void setCurrency(String currency) { this.currency = currency; }

    public void setPetSpecies(Set<PetChoice> petSpecies) {
        this.petSpecies = petSpecies == null ? new LinkedHashSet<>() : petSpecies;
    }

    public void setPetCount(Integer petCount) { this.petCount = petCount; }

    public void setNote(String note) { this.note = note; }

    public void setStatus(BookingProposalStatus status) { this.status = status; }

    public void setDeclineReason(BookingProposalDeclineReason declineReason) { this.declineReason = declineReason; }

    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }

    public void setRespondedAt(Instant respondedAt) { this.respondedAt = respondedAt; }

    public BookingProposal() {}
}
