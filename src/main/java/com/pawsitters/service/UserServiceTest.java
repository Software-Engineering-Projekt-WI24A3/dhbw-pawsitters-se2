package com.pawsitters.service;

import com.pawsitters.model.User;
import com.pawsitters.model.UserRole;
import com.pawsitters.repository.UserRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.time.LocalDate;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class UserServiceTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private PasswordEncoder passwordEncoder;

    @InjectMocks
    private UserService userService;

    // ===== TEST 1: Normalfall =====
    @Test
    void whenValidUser_thenUserIsSavedSuccessfully() {
        // GIVEN
        when(userRepository.existsByEmailIgnoreCase(any())).thenReturn(false);
        when(passwordEncoder.encode(any())).thenReturn("hashedPassword");
        when(userRepository.save(any(User.class))).thenAnswer(i -> i.getArgument(0));

        // WHEN
        User result = userService.createUser(
                "max@test.de", "passwort123", "Max", "Muster",
                "01234567", LocalDate.ofEpochDay((2000-01-01)), "Notfall: 0987",
                "bild.jpg", "Ich bin Max", UserRole.PET_OWNER
        );

        // THEN
        assertNotNull(result);
        assertEquals("max@test.de", result.getEmail());
        assertEquals("hashedPassword", result.getPasswordHash());
        assertEquals(UserRole.PET_OWNER, result.getRole());
        verify(userRepository).save(any(User.class));
    }

    // ===== TEST 2: Edge Case =====
    @Test
    void whenDuplicateEmail_thenThrowException() {
        // GIVEN – E-Mail existiert bereits
        when(userRepository.existsByEmailIgnoreCase("exists@test.de")).thenReturn(true);

        // WHEN & THEN
        assertThrows(IllegalArgumentException.class, () ->
                userService.createUser(
                        "exists@test.de", "passwort123", "Max", "Muster",
                        "01234567", LocalDate.ofEpochDay(2000-01-01), "Notfall: 0987",
                        "bild.jpg", "Bio", UserRole.PET_OWNER
                )
        );

        // Repository darf NICHT aufgerufen werden
        verify(userRepository, never()).save(any());
    }
}