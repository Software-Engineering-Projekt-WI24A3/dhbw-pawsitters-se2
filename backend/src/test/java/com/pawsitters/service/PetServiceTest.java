package com.pawsitters.service;

import com.pawsitters.model.Pet;
import com.pawsitters.model.PetChoice;
import com.pawsitters.model.User;
import com.pawsitters.repository.PetRepository;
import com.pawsitters.repository.UserRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class PetServiceTest {

    @Mock
    private PetRepository petRepository;

    @Mock
    private UserRepository userRepository;

    @InjectMocks
    private PetService petService;

    // ===== TEST 3: Normalfall =====
    @Test
    void whenValidOwner_thenPetIsSavedSuccessfully() {
        // GIVEN
        User owner = new User();
        owner.setId(1L);

        when(userRepository.findById(1L)).thenReturn(Optional.of(owner));
        when(petRepository.save(any(Pet.class))).thenAnswer(i -> i.getArgument(0));

        // WHEN
        Pet result = petService.createPet(
                1L, "Bello", PetChoice.DOG, "Labrador", 3, "Keine"
        );

        // THEN
        assertNotNull(result);
        assertEquals("Bello", result.getName());
        assertEquals(owner, result.getOwner());
        verify(petRepository).save(any(Pet.class));
    }

    // ===== TEST 4: Edge Case =====
    @Test
    void whenOwnerNotFound_thenThrowException() {
        // GIVEN – User existiert nicht
        when(userRepository.findById(99L)).thenReturn(Optional.empty());

        // WHEN & THEN
        assertThrows(IllegalArgumentException.class, () ->
                petService.createPet(99L, "Bello", PetChoice.DOG, "Labrador", 3, "Keine")
        );

        verify(petRepository, never()).save(any());
    }
}