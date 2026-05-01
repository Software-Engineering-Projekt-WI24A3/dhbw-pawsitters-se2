package com.pawsitters.service;

import com.pawsitters.exception.ForbiddenException;
import com.pawsitters.exception.NotFoundException;
import com.pawsitters.model.User;
import com.pawsitters.model.UserRole;
import com.pawsitters.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.junit.jupiter.api.io.TempDir;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.util.ReflectionTestUtils;

import java.nio.file.Path;
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

    @TempDir
    Path tempDir;

    @BeforeEach
    void setUp() {
        ReflectionTestUtils.setField(userService, "uploadDir", tempDir.toString());
    }

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
    void whenUserNotFound_thenGetUserByIdThrowsNotFoundException() {
        when(userRepository.findById(99L)).thenReturn(Optional.empty());

        assertThrows(NotFoundException.class, () -> userService.getUserById(99L));
    }

    // ===== updateUserForEmail =====

    @Test
    void whenOwnerUpdatesUser_thenUserIsSaved() {
        User user = buildUser(1L, "owner@test.de");
        when(userRepository.findById(1L)).thenReturn(Optional.of(user));
        when(userRepository.save(any(User.class))).thenAnswer(i -> i.getArgument(0));

        User result = userService.updateUserForEmail(
                1L, "owner@test.de",
                "NewFirst", "NewLast", "0123", LocalDate.of(1990, 1, 1),
                "Emergency", "pic.jpg", "Bio text", "Street 1"
        );

        assertEquals("NewFirst", result.getFirstName());
        assertEquals("NewLast", result.getLastName());
        assertEquals("Street 1", result.getAddress());
        verify(userRepository).save(user);
    }

    @Test
    void whenWrongEmailUpdatesUser_thenThrowsForbiddenException() {
        User user = buildUser(1L, "owner@test.de");
        when(userRepository.findById(1L)).thenReturn(Optional.of(user));

        assertThrows(ForbiddenException.class, () ->
                userService.updateUserForEmail(
                        1L, "attacker@test.de",
                        "X", "X", "0", LocalDate.of(1990, 1, 1), "E", "p.jpg", "B", null
                )
        );
        verify(userRepository, never()).save(any());
    }

    // ===== patchUserForEmail =====

    @Test
    void whenNullFieldsPatched_thenFieldsRemainUnchanged() {
        User user = buildUser(1L, "owner@test.de");
        user.setFirstName("Original");
        user.setBio("OriginalBio");
        when(userRepository.findById(1L)).thenReturn(Optional.of(user));
        when(userRepository.save(any(User.class))).thenAnswer(i -> i.getArgument(0));

        User result = userService.patchUserForEmail(
                1L, "owner@test.de",
                null, null, null, null, null, null, null, null
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

        User result = userService.patchUserForEmail(
                1L, "owner@test.de",
                "Updated", null, null, null, null, null, null, null
        );

        assertEquals("Updated", result.getFirstName());
    }

    @Test
    void whenWrongEmailPatches_thenThrowsForbiddenException() {
        User user = buildUser(1L, "owner@test.de");
        when(userRepository.findById(1L)).thenReturn(Optional.of(user));

        assertThrows(ForbiddenException.class, () ->
                userService.patchUserForEmail(
                        1L, "attacker@test.de",
                        "X", null, null, null, null, null, null, null
                )
        );
        verify(userRepository, never()).save(any());
    }

    // ===== deleteUserForEmail =====

    @Test
    void whenOwnerDeletes_thenUserIsDeleted() {
        User user = buildUser(1L, "owner@test.de");
        when(userRepository.findById(1L)).thenReturn(Optional.of(user));

        userService.deleteUserForEmail(1L, "owner@test.de");

        verify(userRepository).delete(user);
    }

    @Test
    void whenWrongEmailDeletes_thenThrowsForbiddenException() {
        User user = buildUser(1L, "owner@test.de");
        when(userRepository.findById(1L)).thenReturn(Optional.of(user));

        assertThrows(ForbiddenException.class, () ->
                userService.deleteUserForEmail(1L, "attacker@test.de")
        );
        verify(userRepository, never()).delete(any());
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
    void whenUserNotFoundForRoleUpdate_thenThrowsNotFoundException() {
        when(userRepository.findById(99L)).thenReturn(Optional.empty());

        assertThrows(NotFoundException.class, () -> userService.updateRole(99L, UserRole.HOST));
    }

    // ===== uploadProfileImageForEmail =====

    @Test
    void whenImageIsEmpty_thenThrowsIllegalArgument() {
        MockMultipartFile emptyFile = new MockMultipartFile("image", new byte[0]);

        assertThrows(IllegalArgumentException.class, () ->
                userService.uploadProfileImageForEmail(1L, "owner@test.de", emptyFile)
        );
    }

    @Test
    void whenContentTypeNotAllowed_thenThrowsIllegalArgument() {
        MockMultipartFile gifFile = new MockMultipartFile(
                "image", "test.gif", "image/gif", new byte[]{0x47, 0x49, 0x46, 0x38}
        );

        assertThrows(IllegalArgumentException.class, () ->
                userService.uploadProfileImageForEmail(1L, "owner@test.de", gifFile)
        );
    }

    @Test
    void whenFileTooLarge_thenThrowsIllegalArgument() {
        byte[] bigContent = new byte[6 * 1024 * 1024]; // 6 MB
        // JPEG magic bytes at start so content-type check passes
        bigContent[0] = (byte) 0xFF;
        bigContent[1] = (byte) 0xD8;
        bigContent[2] = (byte) 0xFF;
        MockMultipartFile bigFile = new MockMultipartFile(
                "image", "big.jpg", "image/jpeg", bigContent
        );

        assertThrows(IllegalArgumentException.class, () ->
                userService.uploadProfileImageForEmail(1L, "owner@test.de", bigFile)
        );
    }

    @Test
    void whenMagicBytesInvalid_thenThrowsIllegalArgument() {
        // Claims to be JPEG but has invalid magic bytes
        byte[] fakeContent = new byte[]{0x00, 0x01, 0x02, 0x03, 0x04};
        MockMultipartFile fakeJpeg = new MockMultipartFile(
                "image", "fake.jpg", "image/jpeg", fakeContent
        );

        assertThrows(IllegalArgumentException.class, () ->
                userService.uploadProfileImageForEmail(1L, "owner@test.de", fakeJpeg)
        );
    }

    @Test
    void whenWrongEmailUploads_thenThrowsForbiddenException() {
        // Valid JPEG magic bytes
        byte[] jpegContent = new byte[100];
        jpegContent[0] = (byte) 0xFF;
        jpegContent[1] = (byte) 0xD8;
        jpegContent[2] = (byte) 0xFF;
        MockMultipartFile validJpeg = new MockMultipartFile(
                "image", "photo.jpg", "image/jpeg", jpegContent
        );

        User user = buildUser(1L, "owner@test.de");
        when(userRepository.findById(1L)).thenReturn(Optional.of(user));

        assertThrows(ForbiddenException.class, () ->
                userService.uploadProfileImageForEmail(1L, "attacker@test.de", validJpeg)
        );
        verify(userRepository, never()).save(any());
    }

    @Test
    void whenValidJpegUploaded_thenProfilePictureIsSet() throws Exception {
        byte[] jpegContent = new byte[100];
        jpegContent[0] = (byte) 0xFF;
        jpegContent[1] = (byte) 0xD8;
        jpegContent[2] = (byte) 0xFF;
        MockMultipartFile validJpeg = new MockMultipartFile(
                "image", "photo.jpg", "image/jpeg", jpegContent
        );

        User user = buildUser(1L, "owner@test.de");
        when(userRepository.findById(1L)).thenReturn(Optional.of(user));
        when(userRepository.save(any(User.class))).thenAnswer(i -> i.getArgument(0));

        User result = userService.uploadProfileImageForEmail(1L, "owner@test.de", validJpeg);

        assertNotNull(result.getProfilePicture());
        assertTrue(result.getProfilePicture().endsWith(".jpg"));
        verify(userRepository).save(user);
    }

    @Test
    void whenValidPngUploaded_thenProfilePictureIsSet() throws Exception {
        byte[] pngContent = new byte[100];
        pngContent[0] = (byte) 0x89;
        pngContent[1] = 0x50;
        pngContent[2] = 0x4E;
        pngContent[3] = 0x47;
        MockMultipartFile validPng = new MockMultipartFile(
                "image", "photo.png", "image/png", pngContent
        );

        User user = buildUser(1L, "owner@test.de");
        when(userRepository.findById(1L)).thenReturn(Optional.of(user));
        when(userRepository.save(any(User.class))).thenAnswer(i -> i.getArgument(0));

        User result = userService.uploadProfileImageForEmail(1L, "owner@test.de", validPng);

        assertNotNull(result.getProfilePicture());
        assertTrue(result.getProfilePicture().endsWith(".png"));
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
        user.setAddress(null);
        user.setRating(0f);
        user.setNumberOfRatings(0);
        user.setRole(UserRole.PET_OWNER);
        return user;
    }
}
