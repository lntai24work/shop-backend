package com.tai.shop.user;

import com.tai.shop.common.dto.PageResponse;
import com.tai.shop.common.exception.AppException;
import com.tai.shop.common.exception.ErrorCode;
import com.tai.shop.user.dto.AdminCreateUserRequest;
import com.tai.shop.user.dto.UpdateUserRolesRequest;
import com.tai.shop.user.dto.UpdateUserStatusRequest;
import com.tai.shop.user.dto.UserFilterRequest;
import com.tai.shop.user.dto.UserResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.CollectionUtils;

import java.util.HashSet;
import java.util.Set;

@Slf4j
@Service
@RequiredArgsConstructor
public class AdminUserService {

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final UserMapper userMapper;
    private final PasswordEncoder passwordEncoder;

    @Transactional(readOnly = true)
    public PageResponse<UserResponse> getUsers(UserFilterRequest filter, Pageable pageable) {
        log.debug("Admin lấy danh sách người dùng với bộ lọc: {}", filter);
        Specification<User> spec = UserSpecification.filter(filter);
        Page<User> userPage = userRepository.findAll(spec, pageable);
        return PageResponse.of(userPage.map(userMapper::toUserResponse));
    }

    @Transactional(readOnly = true)
    public UserResponse getUserById(Long id) {
        log.debug("Admin lấy thông tin chi tiết user ID: {}", id);
        User user = userRepository.findWithRolesById(id)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));
        return userMapper.toUserResponse(user);
    }

    @Transactional
    public UserResponse updateUserStatus(Long id, UpdateUserStatusRequest request, String currentAdminEmail) {
        log.info("Admin '{}' cập nhật trạng thái user ID {} thành {}", currentAdminEmail, id, request.status());
        User user = userRepository.findWithRolesById(id)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));

        if (user.getEmail().equalsIgnoreCase(currentAdminEmail)) {
            throw new AppException(ErrorCode.CANNOT_BLOCK_SELF);
        }

        user.setStatus(request.status());
        User savedUser = userRepository.save(user);
        return userMapper.toUserResponse(savedUser);
    }

    @Transactional
    public UserResponse updateUserRoles(Long id, UpdateUserRolesRequest request, String currentAdminEmail) {
        log.info("Admin '{}' cập nhật vai trò user ID {} thành {}", currentAdminEmail, id, request.roles());
        User user = userRepository.findWithRolesById(id)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));

        boolean willHaveAdminRole = request.roles().stream()
                .anyMatch(r -> r.equalsIgnoreCase("ROLE_ADMIN") || r.equalsIgnoreCase("ADMIN"));

        if (user.getEmail().equalsIgnoreCase(currentAdminEmail) && !willHaveAdminRole) {
            throw new AppException(ErrorCode.CANNOT_DEMOTE_SELF);
        }

        Set<Role> roles = new HashSet<>();
        for (String roleName : request.roles()) {
            String normalized = roleName.toUpperCase().trim();
            if (!normalized.startsWith("ROLE_")) {
                normalized = "ROLE_" + normalized;
            }
            try {
                RoleType roleType = RoleType.valueOf(normalized);
                Role role = roleRepository.findByName(roleType)
                        .orElseThrow(() -> new AppException(ErrorCode.ROLE_NOT_FOUND));
                roles.add(role);
            } catch (IllegalArgumentException e) {
                throw new AppException(ErrorCode.ROLE_NOT_FOUND);
            }
        }

        user.setRoles(roles);
        User savedUser = userRepository.save(user);
        return userMapper.toUserResponse(savedUser);
    }

    @Transactional
    public UserResponse createUser(AdminCreateUserRequest request) {
        log.info("Admin tạo người dùng mới với email: {}", request.email());

        if (userRepository.existsByEmail(request.email().trim().toLowerCase())) {
            throw new AppException(ErrorCode.EMAIL_ALREADY_EXISTS);
        }

        User user = new User();
        user.setEmail(request.email().trim().toLowerCase());
        user.setPassword(passwordEncoder.encode(request.password()));
        user.setFullName(request.fullName().trim());
        user.setPhone(request.phone() != null ? request.phone().trim() : null);
        user.setStatus(UserStatus.ACTIVE);

        Set<Role> roles = new HashSet<>();
        if (CollectionUtils.isEmpty(request.roles())) {
            Role userRole = roleRepository.findByName(RoleType.ROLE_USER)
                    .orElseThrow(() -> new AppException(ErrorCode.ROLE_NOT_FOUND));
            roles.add(userRole);
        } else {
            for (String roleName : request.roles()) {
                String normalized = roleName.toUpperCase().trim();
                if (!normalized.startsWith("ROLE_")) {
                    normalized = "ROLE_" + normalized;
                }
                try {
                    RoleType roleType = RoleType.valueOf(normalized);
                    Role role = roleRepository.findByName(roleType)
                            .orElseThrow(() -> new AppException(ErrorCode.ROLE_NOT_FOUND));
                    roles.add(role);
                } catch (IllegalArgumentException e) {
                    throw new AppException(ErrorCode.ROLE_NOT_FOUND);
                }
            }
        }

        user.setRoles(roles);
        User savedUser = userRepository.save(user);
        return userMapper.toUserResponse(savedUser);
    }
}
