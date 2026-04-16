package com.pawsitters.service;

import com.pawsitters.model.*;
import com.pawsitters.repository.PetRepository;
import com.pawsitters.repository.RequestRepository;
import com.pawsitters.repository.UserRepository;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.List;

@Service
public class RequestService {

    private final RequestRepository requestRepository;
    private final UserRepository userRepository;
    private final PetRepository petRepository;

    public RequestService(RequestRepository requestRepository,
                          UserRepository userRepository,
                          PetRepository petRepository) {
        this.requestRepository = requestRepository;
        this.userRepository = userRepository;
        this.petRepository = petRepository;
    }

    /**
     * Erstellt eine neue Betreuungsanfrage für ein Haustier.
     */
    public Request createRequest(Long ownerId, Long petId,
                                 LocalDate startDate, LocalDate endDate) {

        if (endDate.isBefore(startDate) || endDate.isEqual(startDate)) {
            throw new IllegalArgumentException(
                    "EndDate muss nach StartDate liegen.");
        }

        User owner = userRepository.findById(ownerId)
                .orElseThrow(() -> new IllegalArgumentException(
                        "User mit ID " + ownerId + " nicht gefunden."));

        Pet pet = petRepository.findById(petId)
                .orElseThrow(() -> new IllegalArgumentException(
                        "Tier mit ID " + petId + " nicht gefunden."));

        if (!pet.getOwner().getId().equals(ownerId)) {
            throw new IllegalArgumentException(
                    "Dieses Tier gehört nicht dem angegebenen User.");
        }

        Request request = new Request();
        request.setPetOwner(owner);
        request.setPet(pet);
        request.setStartDate(startDate);
        request.setEndDate(endDate);
        request.setStatus(RequestStatus.OPEN);

        return requestRepository.save(request);
    }

    /**
     * Gibt alle Anfragen mit dem angegebenen Status zurück.
     *
     * @param status der Status, nach dem die Anfragen gefiltert werden
     */
    public List<Request> getRequests(RequestStatus status) {
        return requestRepository.findByStatus(status);
    }

    /**
     * Gibt alle Anfragen eines bestimmten Tierhalters zurück.
     */
    public List<Request> getRequestsByOwner(Long ownerId) {
        return requestRepository.findByPetOwnerId(ownerId);
    }

    /**
     * Storniert eine Anfrage.
     */
    public Request cancelRequest(Long requestId, Long ownerId) {
        Request request = requestRepository.findById(requestId)
                .orElseThrow(() -> new IllegalArgumentException(
                        "Anfrage mit ID " + requestId + " nicht gefunden."));

        if (!request.getPetOwner().getId().equals(ownerId)) {
            throw new IllegalArgumentException(
                    "Diese Anfrage gehört nicht dem angegebenen User.");
        }

        request.setStatus(RequestStatus.CANCELLED);
        return requestRepository.save(request);
    }
}