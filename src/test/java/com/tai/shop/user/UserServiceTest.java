package com.tai.shop.user;

import com.tai.shop.common.exception.AppException;
import com.tai.shop.common.exception.ErrorCode;
import com.tai.shop.user.dto.UserResponse;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;
import java.util.Set;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class UserServiceTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private UserMapper userMapper;

    @InjectMocks
    private UserService userService;

    private User sampleUser;
    private UserResponse sampleUserResponse;

    @BeforeEach
    void setUp() {
        sampleUser = new User();
        sampleUser.setId(1L);
        sampleUser.setEmail("test@shop.com");
        sampleUser.setFullName("Test User");

        sampleUserResponse = new UserResponse(1L, "test@shop.com", "Test User", null, null, Set.of("ROLE_USER"));
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
}
