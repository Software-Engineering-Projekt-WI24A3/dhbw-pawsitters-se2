package com.pawsitters.service;

import com.pawsitters.model.*;
import com.pawsitters.repository.PetRepository;
import com.pawsitters.repository.RequestRepository;
import com.pawsitters.repository.UserRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDate;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class RequestServiceTest {

    @Mock
    private RequestRepository requestRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private PetRepository petRepository;

    @InjectMocks
    private RequestService requestService;

    // ===== TEST 5: Normalfall =====
    @Test
    void whenValidData_thenRequestIsCreatedWithStatusOpen() {
        // GIVEN
        User owner = new User();
        owner.setId(1L);

        Pet pet = new Pet();
        pet.setId(1L);
        pet.setOwner(owner);

        when(userRepository.findById(1L)).thenReturn(Optional.of(owner));
        when(petRepository.findById(1L)).thenReturn(Optional.of(pet));
        when(requestRepository.save(any(Request.class))).thenAnswer(i -> i.getArgument(0));

        // WHEN
        Request result = requestService.createRequest(
                1L, 1L,
                LocalDate.of(2025, 8, 1),
                LocalDate.of(2025, 8, 15)
        );

        // THEN
        assertNotNull(result);
        assertEquals(RequestStatus.OPEN, result.getStatus());
        assertEquals(owner, result.getPetOwner());
        verify(requestRepository).save(any(Request.class));
    }

    // ===== TEST 6: Edge Case =====
    @Test
    void whenEndDateBeforeStartDate_thenThrowException() {
        // GIVEN
        LocalDate startDate = LocalDate.of(2025, 8, 15);
        LocalDate endDate = LocalDate.of(2025, 8, 1); // VOR startDate!

        // WHEN & THEN
        assertThrows(IllegalArgumentException.class, () ->
                requestService.createRequest(1L, 1L, startDate, endDate)
        );

        // Datenbank darf nicht aufgerufen werden
        verify(requestRepository, never()).save(any());
    }

    // ===== TEST 7: Edge Case =====
    @Test
    void whenPetDoesNotBelongToOwner_thenThrowException() {
        // GIVEN
        User owner = new User();
        owner.setId(1L);

        User otherOwner = new User();
        otherOwner.setId(2L);

        Pet pet = new Pet();
        pet.setId(1L);
        pet.setOwner(otherOwner); // Tier gehört jemand anderem!

        when(userRepository.findById(1L)).thenReturn(Optional.of(owner));
        when(petRepository.findById(1L)).thenReturn(Optional.of(pet));

        // WHEN & THEN
        assertThrows(IllegalArgumentException.class, () ->
                requestService.createRequest(
                        1L, 1L,
                        LocalDate.of(2025, 8, 1),
                        LocalDate.of(2025, 8, 15)
                )
        );

        verify(requestRepository, never()).save(any());
    }
}