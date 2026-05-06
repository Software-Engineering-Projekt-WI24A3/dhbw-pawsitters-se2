package com.pawsitters.service;

import com.pawsitters.exception.ForbiddenException;
import com.pawsitters.exception.NotFoundException;
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
import java.util.Optional;

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


    // ===== createUser =====

    @Test
    void whenValidUser_thenUserIsSavedSuccessfully() {
        when(userRepository.existsByEmailIgnoreCase(any())).thenReturn(false);
        when(passwordEncoder.encode(any())).thenReturn("hashedPassword");
        when(userRepository.save(any(User.class))).thenAnswer(i -> i.getArgument(0));

        User result = userService.createUser(
                "max@test.de", "passwort123", "Max", "Muster",
                "01234567", LocalDate.of(2000, 1, 1), "Notfall: 0987",
                "bild.jpg", "Ich bin Max", UserRole.PET_OWNER
        );

        assertNotNull(result);
        assertEquals("max@test.de", result.getEmail());
        assertEquals("hashedPassword", result.getPasswordHash());
        assertEquals(UserRole.PET_OWNER, result.getRole());
        verify(userRepository).save(any(User.class));
    }

    @Test
    void whenDuplicateEmail_thenThrowException() {
        when(userRepository.existsByEmailIgnoreCase("exists@test.de")).thenReturn(true);

        assertThrows(IllegalArgumentException.class, () ->
                userService.createUser(
                        "exists@test.de", "passwort123", "Max", "Muster",
                        "01234567", LocalDate.of(2000, 1, 1), "Notfall: 0987",
                        "bild.jpg", "Bio", UserRole.PET_OWNER
                )
        );

        verify(userRepository, never()).save(any());
    }

    @Test
    void whenLoginEmailHasDifferentCase_thenFindByEmailStillReturnsUser() {
        User existingUser = new User();
        existingUser.setEmail("max@test.de");
        when(userRepository.findByEmailIgnoreCase("MAX@TEST.DE")).thenReturn(Optional.of(existingUser));

        User result = userService.findByEmail("MAX@TEST.DE");

        assertEquals("max@test.de", result.getEmail());
        verify(userRepository).findByEmailIgnoreCase("MAX@TEST.DE");
    }

    @Test
    void whenDuplicateEmailWithDifferentCase_thenCreateUserThrowsException() {
        when(userRepository.existsByEmailIgnoreCase("MAX@TEST.DE")).thenReturn(true);

        assertThrows(IllegalArgumentException.class, () ->
                userService.createUser(
                        "MAX@TEST.DE", "passwort123", "Max", "Muster",
                        "01234567", LocalDate.of(2000, 1, 1), "Notfall: 0987",
                        "bild.jpg", "Bio", UserRole.PET_OWNER
                )
        );
        verify(userRepository, never()).save(any());
    }

    // ===== getUserById =====

    @Test
    void whenUserNotFound_thenGetUserByIdThrowsException() {
        when(userRepository.findById(99L)).thenReturn(Optional.empty());

        assertThrows(NotFoundException.class, () -> userService.getUserById(99L));
    }

    // ===== findByEmail =====

    @Test
    void whenEmailNotFound_thenFindByEmailThrowsException() {
        when(userRepository.findByEmailIgnoreCase("notfound@test.de")).thenReturn(Optional.empty());

        assertThrows(NotFoundException.class, () -> userService.findByEmail("notfound@test.de"));
    }

    // ===== existsByEmail =====

    @Test
    void whenEmailExists_thenExistsByEmailReturnsTrue() {
        when(userRepository.existsByEmailIgnoreCase("exists@test.de")).thenReturn(true);

        boolean result = userService.existsByEmail("exists@test.de");

        assertTrue(result);
    }

    @Test
    void whenEmailNotExists_thenExistsByEmailReturnsFalse() {
        when(userRepository.existsByEmailIgnoreCase("notexists@test.de")).thenReturn(false);

        boolean result = userService.existsByEmail("notexists@test.de");

        assertFalse(result);
    }

    // ===== updateUser =====

    @Test
    void whenOwnerUpdatesUser_thenUserIsSaved() {
        User user = buildUser(1L, "owner@test.de");
        when(userRepository.findById(1L)).thenReturn(Optional.of(user));
        when(userRepository.save(any(User.class))).thenAnswer(i -> i.getArgument(0));

        User result = userService.updateUser(
                1L, "owner@test.de",
                "NewFirst", "NewLast", "0123", LocalDate.of(1990, 1, 1),
                "Emergency", "pic.jpg", "Bio text"
        );

        assertEquals("NewFirst", result.getFirstName());
        assertEquals("NewLast", result.getLastName());
        verify(userRepository).save(user);
    }

    @Test
    void whenWrongEmailUpdatesUser_thenThrowsException() {
        User user = buildUser(1L, "owner@test.de");
        when(userRepository.findById(1L)).thenReturn(Optional.of(user));

        assertThrows(ForbiddenException.class, () ->
                userService.updateUser(
                        1L, "attacker@test.de",
                        "X", "X", "0", LocalDate.of(1990, 1, 1), "E", "p.jpg", "B"
                )
        );
        verify(userRepository, never()).save(any());
    }

    // ===== patchUser =====

    @Test
    void whenNullFieldsPatched_thenFieldsRemainUnchanged() {
        User user = buildUser(1L, "owner@test.de");
        user.setFirstName("Original");
        user.setBio("OriginalBio");
        when(userRepository.findById(1L)).thenReturn(Optional.of(user));
        when(userRepository.save(any(User.class))).thenAnswer(i -> i.getArgument(0));

        User result = userService.patchUser(
                1L, "owner@test.de",
                null, null, null, null, null, null, null
        );

        assertEquals("Original", result.getFirstName());
        assertEquals("OriginalBio", result.getBio());
    }

    @Test
    void whenNonNullFieldsPatched_thenFieldsAreUpdated() {
        User user = buildUser(1L, "owner@test.de");
        user.setFirstName("Original");
        when(userRepository.findById(1L)).thenReturn(Optional.of(user));
        when(userRepository.save(any(User.class))).thenAnswer(i -> i.getArgument(0));

        User result = userService.patchUser(
                1L, "owner@test.de",
                "Updated", null, null, null, null, null, null
        );

        assertEquals("Updated", result.getFirstName());
    }

    @Test
    void whenWrongEmailPatches_thenThrowsException() {
        User user = buildUser(1L, "owner@test.de");
        when(userRepository.findById(1L)).thenReturn(Optional.of(user));

        assertThrows(ForbiddenException.class, () ->
                userService.patchUser(
                        1L, "attacker@test.de",
                        "X", null, null, null, null, null, null
                )
        );
        verify(userRepository, never()).save(any());
    }

    // ===== deleteUser =====

    @Test
    void whenOwnerDeletes_thenUserIsDeleted() {
        User user = buildUser(1L, "owner@test.de");
        when(userRepository.findById(1L)).thenReturn(Optional.of(user));

        userService.deleteUser(1L, "owner@test.de");

        verify(userRepository).deleteById(1L);
    }

    @Test
    void whenWrongEmailDeletes_thenThrowsException() {
        User user = buildUser(1L, "owner@test.de");
        when(userRepository.findById(1L)).thenReturn(Optional.of(user));

        assertThrows(ForbiddenException.class, () ->
                userService.deleteUser(1L, "attacker@test.de")
        );
        verify(userRepository, never()).deleteById(any());
    }

    // ===== updateRole =====

    @Test
    void whenAdminUpdatesRole_thenRoleIsChanged() {
        User user = buildUser(1L, "user@test.de");
        user.setRole(UserRole.PET_OWNER);
        when(userRepository.findById(1L)).thenReturn(Optional.of(user));
        when(userRepository.save(any(User.class))).thenAnswer(i -> i.getArgument(0));

        User result = userService.updateRole(1L, UserRole.HOST);

        assertEquals(UserRole.HOST, result.getRole());
        verify(userRepository).save(user);
    }

    @Test
    void whenUserNotFoundForRoleUpdate_thenThrowsException() {
        when(userRepository.findById(99L)).thenReturn(Optional.empty());

        assertThrows(NotFoundException.class, () -> userService.updateRole(99L, UserRole.HOST));
    }

    // ===== updateProfileImage =====

    @Test
    void whenOwnerUpdatesProfileImage_thenProfilePictureIsUpdated() {
        User user = buildUser(1L, "owner@test.de");
        when(userRepository.findById(1L)).thenReturn(Optional.of(user));
        when(userRepository.save(any(User.class))).thenAnswer(i -> i.getArgument(0));

        User result = userService.updateProfileImage(1L, "owner@test.de", "new-pic.jpg");

        assertEquals("new-pic.jpg", result.getProfilePicture());
        verify(userRepository).save(user);
    }

    @Test
    void whenWrongEmailUpdatesProfileImage_thenThrowsException() {
        User user = buildUser(1L, "owner@test.de");
        when(userRepository.findById(1L)).thenReturn(Optional.of(user));

        assertThrows(ForbiddenException.class, () ->
                userService.updateProfileImage(1L, "attacker@test.de", "pic.jpg")
        );
        verify(userRepository, never()).save(any());
    }

    // ===== Helpers =====

    private User buildUser(Long id, String email) {
        User user = new User();
        user.setId(id);
        user.setEmail(email);
        user.setFirstName("First");
        user.setLastName("Last");
        user.setPhone("0123");
        user.setBirthDate(LocalDate.of(1990, 1, 1));
        user.setEmergencyContact("Emergency");
        user.setProfilePicture("pic.jpg");
        user.setBio("Bio");
        user.setRating(0f);
        user.setNumberOfRatings(0);
        user.setRole(UserRole.PET_OWNER);
        return user;
    }
}
