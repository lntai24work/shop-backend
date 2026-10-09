package com.tai.shop.user;

import com.tai.shop.common.exception.AppException;
import com.tai.shop.common.exception.ErrorCode;
import com.tai.shop.storage.StorageService;
import com.tai.shop.storage.UploadResult;
import com.tai.shop.user.dto.ChangePasswordRequest;
import com.tai.shop.user.dto.UpdateProfileRequest;
import com.tai.shop.user.dto.UserResponse;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.Optional;
import java.util.Set;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class UserServiceTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private UserMapper userMapper;

    @Mock
    private PasswordEncoder passwordEncoder;

    @Mock
    private StorageService storageService;

    @InjectMocks
    private UserService userService;

    private User sampleUser;
    private UserResponse sampleUserResponse;

    @BeforeEach
    void setUp() {
        sampleUser = new User();
        sampleUser.setId(1L);
        sampleUser.setEmail("test@shop.com");
        sampleUser.setPassword("encodedOldPassword");
        sampleUser.setFullName("Test User");
        sampleUser.setPhone("0912345678");

        sampleUserResponse = new UserResponse(1L, "test@shop.com", "Test User", "0912345678", null, Set.of("ROLE_USER"));
    }

    @Test
    @DisplayName("getUserProfile: should return UserResponse when user exists")
    void getUserProfile_userExists_shouldReturnUserResponse() {
        when(userRepository.findWithRolesByEmail("test@shop.com")).thenReturn(Optional.of(sampleUser));
        when(userMapper.toUserResponse(sampleUser)).thenReturn(sampleUserResponse);

        UserResponse result = userService.getUserProfile("test@shop.com");

        assertThat(result).isNotNull();
        assertThat(result.email()).isEqualTo("test@shop.com");
        assertThat(result.fullName()).isEqualTo("Test User");
    }

    @Test
    @DisplayName("getUserProfile: should throw AppException when user does not exist")
    void getUserProfile_userNotFound_shouldThrowAppException() {
        when(userRepository.findWithRolesByEmail("notfound@shop.com")).thenReturn(Optional.empty());

        assertThatThrownBy(() -> userService.getUserProfile("notfound@shop.com"))
                .isInstanceOf(AppException.class)
                .hasFieldOrPropertyWithValue("errorCode", ErrorCode.USER_NOT_FOUND);
    }

    @Test
    @DisplayName("updateProfile: should update fullName and phone")
    void updateProfile_validRequest_shouldUpdate() {
        UpdateProfileRequest request = new UpdateProfileRequest("New Name", "0987654321");
        UserResponse updatedResponse = new UserResponse(1L, "test@shop.com", "New Name", "0987654321", null, Set.of("ROLE_USER"));

        when(userRepository.findWithRolesByEmail("test@shop.com")).thenReturn(Optional.of(sampleUser));
        when(userRepository.save(sampleUser)).thenReturn(sampleUser);
        when(userMapper.toUserResponse(sampleUser)).thenReturn(updatedResponse);

        UserResponse result = userService.updateProfile("test@shop.com", request);

        assertThat(result).isNotNull();
        assertThat(result.fullName()).isEqualTo("New Name");
        assertThat(result.phone()).isEqualTo("0987654321");
        verify(userRepository).save(sampleUser);
    }

    @Test
    @DisplayName("changePassword: should change password when old password matches")
    void changePassword_validOldPassword_shouldChange() {
        ChangePasswordRequest request = new ChangePasswordRequest("oldPass", "newPass123", "newPass123");

        when(userRepository.findByEmail("test@shop.com")).thenReturn(Optional.of(sampleUser));
        when(passwordEncoder.matches("oldPass", "encodedOldPassword")).thenReturn(true);
        when(passwordEncoder.matches("newPass123", "encodedOldPassword")).thenReturn(false);
        when(passwordEncoder.encode("newPass123")).thenReturn("encodedNewPassword");

        userService.changePassword("test@shop.com", request);

        assertThat(sampleUser.getPassword()).isEqualTo("encodedNewPassword");
        verify(userRepository).save(sampleUser);
    }

    @Test
    @DisplayName("changePassword: should throw AppException when new and confirm password do not match")
    void changePassword_passwordsDoNotMatch_shouldThrowAppException() {
        ChangePasswordRequest request = new ChangePasswordRequest("oldPass", "newPass123", "differentPass");

        assertThatThrownBy(() -> userService.changePassword("test@shop.com", request))
                .isInstanceOf(AppException.class)
                .hasFieldOrPropertyWithValue("errorCode", ErrorCode.PASSWORDS_DO_NOT_MATCH);
    }

    @Test
    @DisplayName("changePassword: should throw AppException when old password is incorrect")
    void changePassword_wrongOldPassword_shouldThrowAppException() {
        ChangePasswordRequest request = new ChangePasswordRequest("wrongPass", "newPass123", "newPass123");

        when(userRepository.findByEmail("test@shop.com")).thenReturn(Optional.of(sampleUser));
        when(passwordEncoder.matches("wrongPass", "encodedOldPassword")).thenReturn(false);

        assertThatThrownBy(() -> userService.changePassword("test@shop.com", request))
                .isInstanceOf(AppException.class)
                .hasFieldOrPropertyWithValue("errorCode", ErrorCode.OLD_PASSWORD_INCORRECT);
    }

    @Test
    @DisplayName("changePassword: should throw AppException when new password is same as old password")
    void changePassword_samePassword_shouldThrowAppException() {
        ChangePasswordRequest request = new ChangePasswordRequest("oldPass", "oldPass", "oldPass");

        when(userRepository.findByEmail("test@shop.com")).thenReturn(Optional.of(sampleUser));
        when(passwordEncoder.matches("oldPass", "encodedOldPassword")).thenReturn(true);

        assertThatThrownBy(() -> userService.changePassword("test@shop.com", request))
                .isInstanceOf(AppException.class)
                .hasFieldOrPropertyWithValue("errorCode", ErrorCode.NEW_PASSWORD_SAME_AS_OLD);
    }

    @Test
    @DisplayName("updateAvatar: should upload image and update avatarUrl")
    void updateAvatar_validFile_shouldUpdate() {
        MockMultipartFile file = new MockMultipartFile("file", "avatar.jpg", "image/jpeg", "image bytes".getBytes());
        UploadResult uploadResult = new UploadResult("https://res.cloudinary.com/test/avatar.jpg", "shop/avatars/1/avatar");

        when(userRepository.findWithRolesByEmail("test@shop.com")).thenReturn(Optional.of(sampleUser));
        when(storageService.uploadImage(any(), anyString())).thenReturn(uploadResult);
        when(userRepository.save(sampleUser)).thenReturn(sampleUser);
        when(userMapper.toUserResponse(sampleUser)).thenReturn(sampleUserResponse);

        UserResponse result = userService.updateAvatar("test@shop.com", file);

        assertThat(result).isNotNull();
        assertThat(sampleUser.getAvatarUrl()).isEqualTo("https://res.cloudinary.com/test/avatar.jpg");
        verify(userRepository).save(sampleUser);
    }
}
