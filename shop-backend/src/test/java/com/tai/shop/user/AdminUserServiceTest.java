package com.tai.shop.user;

import com.tai.shop.common.dto.PageResponse;
import com.tai.shop.common.exception.AppException;
import com.tai.shop.common.exception.ErrorCode;
import com.tai.shop.user.dto.AdminCreateUserRequest;
import com.tai.shop.user.dto.UpdateUserRolesRequest;
import com.tai.shop.user.dto.UpdateUserStatusRequest;
import com.tai.shop.user.dto.UserFilterRequest;
import com.tai.shop.user.dto.UserResponse;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.Set;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class AdminUserServiceTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private RoleRepository roleRepository;

    @Mock
    private UserMapper userMapper;

    @Mock
    private PasswordEncoder passwordEncoder;

    @InjectMocks
    private AdminUserService adminUserService;

    private User targetUser;
    private UserResponse targetUserResponse;
    private Role roleAdmin;
    private Role roleUser;

    @BeforeEach
    void setUp() {
        roleAdmin = new Role();
        roleAdmin.setId(1L);
        roleAdmin.setName(RoleType.ROLE_ADMIN);

        roleUser = new Role();
        roleUser.setId(2L);
        roleUser.setName(RoleType.ROLE_USER);

        targetUser = new User();
        targetUser.setId(2L);
        targetUser.setEmail("user@shop.com");
        targetUser.setFullName("Normal User");
        targetUser.setStatus(UserStatus.ACTIVE);
        targetUser.setRoles(Set.of(roleUser));

        targetUserResponse = new UserResponse(
                2L,
                "user@shop.com",
                "Normal User",
                null,
                null,
                UserStatus.ACTIVE,
                Set.of("ROLE_USER"),
                Instant.now()
        );
    }

    @Test
    @DisplayName("getUsers: should return PageResponse of UserResponse")
    void getUsers_shouldReturnPageResponse() {
        Pageable pageable = PageRequest.of(0, 10);
        when(userRepository.findAll(any(Specification.class), eq(pageable)))
                .thenReturn(new PageImpl<>(List.of(targetUser), pageable, 1));
        when(userMapper.toUserResponse(targetUser)).thenReturn(targetUserResponse);

        PageResponse<UserResponse> result = adminUserService.getUsers(new UserFilterRequest(null, null, null, 0, 10, null), pageable);

        assertThat(result).isNotNull();
        assertThat(result.content()).hasSize(1);
        assertThat(result.content().get(0).email()).isEqualTo("user@shop.com");
    }

    @Test
    @DisplayName("getUserById: should return UserResponse when user exists")
    void getUserById_existingUser_shouldReturnUserResponse() {
        when(userRepository.findWithRolesById(2L)).thenReturn(Optional.of(targetUser));
        when(userMapper.toUserResponse(targetUser)).thenReturn(targetUserResponse);

        UserResponse result = adminUserService.getUserById(2L);

        assertThat(result.id()).isEqualTo(2L);
        assertThat(result.email()).isEqualTo("user@shop.com");
    }

    @Test
    @DisplayName("getUserById: should throw USER_NOT_FOUND when user does not exist")
    void getUserById_nonExistingUser_shouldThrowAppException() {
        when(userRepository.findWithRolesById(99L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> adminUserService.getUserById(99L))
                .isInstanceOf(AppException.class)
                .hasFieldOrPropertyWithValue("errorCode", ErrorCode.USER_NOT_FOUND);
    }

    @Test
    @DisplayName("updateUserStatus: should throw CANNOT_BLOCK_SELF when admin tries to block own account")
    void updateUserStatus_blockSelf_shouldThrowAppException() {
        targetUser.setEmail("admin@shop.com");
        when(userRepository.findWithRolesById(1L)).thenReturn(Optional.of(targetUser));

        assertThatThrownBy(() -> adminUserService.updateUserStatus(1L, new UpdateUserStatusRequest(UserStatus.BLOCKED), "admin@shop.com"))
                .isInstanceOf(AppException.class)
                .hasFieldOrPropertyWithValue("errorCode", ErrorCode.CANNOT_BLOCK_SELF);
    }

    @Test
    @DisplayName("updateUserStatus: should successfully block another user")
    void updateUserStatus_blockAnotherUser_shouldSucceed() {
        when(userRepository.findWithRolesById(2L)).thenReturn(Optional.of(targetUser));
        when(userRepository.save(any(User.class))).thenReturn(targetUser);
        when(userMapper.toUserResponse(targetUser)).thenReturn(targetUserResponse);

        UserResponse result = adminUserService.updateUserStatus(2L, new UpdateUserStatusRequest(UserStatus.BLOCKED), "admin@shop.com");

        assertThat(result).isNotNull();
        assertThat(targetUser.getStatus()).isEqualTo(UserStatus.BLOCKED);
        verify(userRepository).save(targetUser);
    }

    @Test
    @DisplayName("updateUserRoles: should throw CANNOT_DEMOTE_SELF when admin removes admin role from self")
    void updateUserRoles_demoteSelf_shouldThrowAppException() {
        targetUser.setEmail("admin@shop.com");
        when(userRepository.findWithRolesById(1L)).thenReturn(Optional.of(targetUser));

        assertThatThrownBy(() -> adminUserService.updateUserRoles(1L, new UpdateUserRolesRequest(Set.of("ROLE_USER")), "admin@shop.com"))
                .isInstanceOf(AppException.class)
                .hasFieldOrPropertyWithValue("errorCode", ErrorCode.CANNOT_DEMOTE_SELF);
    }

    @Test
    @DisplayName("updateUserRoles: should successfully promote user to admin")
    void updateUserRoles_promoteUser_shouldSucceed() {
        when(userRepository.findWithRolesById(2L)).thenReturn(Optional.of(targetUser));
        when(roleRepository.findByName(RoleType.ROLE_ADMIN)).thenReturn(Optional.of(roleAdmin));
        when(roleRepository.findByName(RoleType.ROLE_USER)).thenReturn(Optional.of(roleUser));
        when(userRepository.save(any(User.class))).thenReturn(targetUser);
        when(userMapper.toUserResponse(targetUser)).thenReturn(targetUserResponse);

        UserResponse result = adminUserService.updateUserRoles(2L, new UpdateUserRolesRequest(Set.of("ROLE_ADMIN", "ROLE_USER")), "admin@shop.com");

        assertThat(result).isNotNull();
        assertThat(targetUser.getRoles()).contains(roleAdmin, roleUser);
    }

    @Test
    @DisplayName("createUser: should throw EMAIL_ALREADY_EXISTS when email is duplicated")
    void createUser_duplicateEmail_shouldThrowAppException() {
        when(userRepository.existsByEmail("user@shop.com")).thenReturn(true);

        AdminCreateUserRequest req = new AdminCreateUserRequest("user@shop.com", "pass123", "User", "0912345678", Set.of("ROLE_USER"));

        assertThatThrownBy(() -> adminUserService.createUser(req))
                .isInstanceOf(AppException.class)
                .hasFieldOrPropertyWithValue("errorCode", ErrorCode.EMAIL_ALREADY_EXISTS);
    }

    @Test
    @DisplayName("createUser: should create user successfully")
    void createUser_validRequest_shouldSucceed() {
        when(userRepository.existsByEmail("new@shop.com")).thenReturn(false);
        when(passwordEncoder.encode("pass123")).thenReturn("encodedPassword");
        when(roleRepository.findByName(RoleType.ROLE_USER)).thenReturn(Optional.of(roleUser));
        when(userRepository.save(any(User.class))).thenReturn(targetUser);
        when(userMapper.toUserResponse(any(User.class))).thenReturn(targetUserResponse);

        AdminCreateUserRequest req = new AdminCreateUserRequest("new@shop.com", "pass123", "New User", "0912345678", Set.of("ROLE_USER"));
        UserResponse result = adminUserService.createUser(req);

        assertThat(result).isNotNull();
        verify(userRepository).save(any(User.class));
    }
}
