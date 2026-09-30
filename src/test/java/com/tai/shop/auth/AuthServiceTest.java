package com.tai.shop.auth;

import com.tai.shop.auth.dto.AuthResponse;
import com.tai.shop.auth.dto.LoginRequest;
import com.tai.shop.auth.dto.RegisterRequest;
import com.tai.shop.common.exception.AppException;
import com.tai.shop.common.exception.ErrorCode;
import com.tai.shop.config.properties.JwtProperties;
import com.tai.shop.security.CustomUserDetails;
import com.tai.shop.security.JwtService;
import com.tai.shop.user.Role;
import com.tai.shop.user.RoleRepository;
import com.tai.shop.user.RoleType;
import com.tai.shop.user.User;
import com.tai.shop.user.UserMapper;
import com.tai.shop.user.UserRepository;
import com.tai.shop.user.UserStatus;
import com.tai.shop.user.dto.UserResponse;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.DisabledException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.Optional;
import java.util.Set;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class AuthServiceTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private RoleRepository roleRepository;

    @Mock
    private PasswordEncoder passwordEncoder;

    @Mock
    private JwtService jwtService;

    @Mock
    private AuthenticationManager authenticationManager;

    @Mock
    private UserMapper userMapper;

    @Mock
    private JwtProperties jwtProperties;

    @InjectMocks
    private AuthService authService;

    private User sampleUser;
    private Role userRole;

    @BeforeEach
    void setUp() {
        userRole = new Role(RoleType.ROLE_USER, "User role");
        userRole.setId(2L);

        sampleUser = new User();
        sampleUser.setId(10L);
        sampleUser.setEmail("test@shop.com");
        sampleUser.setPassword("encodedPassword");
        sampleUser.setFullName("Nguyen Van A");
        sampleUser.setPhone("0901234567");
        sampleUser.setStatus(UserStatus.ACTIVE);
        sampleUser.addRole(userRole);
    }

    @Test
    @DisplayName("register: should create user and return AuthResponse when request is valid")
    void register_validRequest_shouldReturnAuthResponse() {
        RegisterRequest request = new RegisterRequest("test@shop.com", "password123", "Nguyen Van A", "0901234567");
        UserResponse expectedUserResponse = new UserResponse(10L, "test@shop.com", "Nguyen Van A", "0901234567", null, Set.of("ROLE_USER"));

        when(userRepository.existsByEmail("test@shop.com")).thenReturn(false);
        when(roleRepository.findByName(RoleType.ROLE_USER)).thenReturn(Optional.of(userRole));
        when(passwordEncoder.encode("password123")).thenReturn("encodedPassword");
        when(userRepository.save(any(User.class))).thenReturn(sampleUser);
        when(jwtProperties.getAccessTokenExpirationMs()).thenReturn(900000L);
        when(jwtService.generateAccessToken(any(CustomUserDetails.class), eq(10L))).thenReturn("mock-access-token");
        when(userMapper.toUserResponse(sampleUser)).thenReturn(expectedUserResponse);

        AuthResponse response = authService.register(request);

        assertThat(response).isNotNull();
        assertThat(response.accessToken()).isEqualTo("mock-access-token");
        assertThat(response.tokenType()).isEqualTo("Bearer");
        assertThat(response.expiresIn()).isEqualTo(900000L);
        assertThat(response.user().email()).isEqualTo("test@shop.com");
        verify(userRepository).save(any(User.class));
    }

    @Test
    @DisplayName("register: should throw AppException when email already exists")
    void register_duplicateEmail_shouldThrowAppException() {
        RegisterRequest request = new RegisterRequest("test@shop.com", "password123", "Nguyen Van A", "0901234567");

        when(userRepository.existsByEmail("test@shop.com")).thenReturn(true);

        assertThatThrownBy(() -> authService.register(request))
                .isInstanceOf(AppException.class)
                .hasFieldOrPropertyWithValue("errorCode", ErrorCode.EMAIL_ALREADY_EXISTS);

        verify(userRepository, never()).save(any());
    }

    @Test
    @DisplayName("login: should return AuthResponse when credentials are correct")
    void login_validCredentials_shouldReturnAuthResponse() {
        LoginRequest request = new LoginRequest("test@shop.com", "password123");
        UserResponse expectedUserResponse = new UserResponse(10L, "test@shop.com", "Nguyen Van A", "0901234567", null, Set.of("ROLE_USER"));

        when(userRepository.findWithRolesByEmail("test@shop.com")).thenReturn(Optional.of(sampleUser));
        when(jwtProperties.getAccessTokenExpirationMs()).thenReturn(900000L);
        when(jwtService.generateAccessToken(any(CustomUserDetails.class), eq(10L))).thenReturn("mock-access-token");
        when(userMapper.toUserResponse(sampleUser)).thenReturn(expectedUserResponse);

        AuthResponse response = authService.login(request);

        assertThat(response).isNotNull();
        assertThat(response.accessToken()).isEqualTo("mock-access-token");
        assertThat(response.user().email()).isEqualTo("test@shop.com");
        verify(authenticationManager).authenticate(any(UsernamePasswordAuthenticationToken.class));
    }

    @Test
    @DisplayName("login: should throw AppException when credentials are invalid")
    void login_invalidCredentials_shouldThrowAppException() {
        LoginRequest request = new LoginRequest("test@shop.com", "wrongPassword");

        when(authenticationManager.authenticate(any(UsernamePasswordAuthenticationToken.class)))
                .thenThrow(new BadCredentialsException("Bad credentials"));

        assertThatThrownBy(() -> authService.login(request))
                .isInstanceOf(AppException.class)
                .hasFieldOrPropertyWithValue("errorCode", ErrorCode.INVALID_CREDENTIALS);
    }

    @Test
    @DisplayName("login: should throw AppException when account is disabled")
    void login_disabledAccount_shouldThrowAppException() {
        LoginRequest request = new LoginRequest("test@shop.com", "password123");

        when(authenticationManager.authenticate(any(UsernamePasswordAuthenticationToken.class)))
                .thenThrow(new DisabledException("User is disabled"));

        assertThatThrownBy(() -> authService.login(request))
                .isInstanceOf(AppException.class)
                .hasFieldOrPropertyWithValue("errorCode", ErrorCode.USER_DISABLED);
    }
}
