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
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.DisabledException;
import org.springframework.security.authentication.LockedException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Slf4j
@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final AuthenticationManager authenticationManager;
    private final UserMapper userMapper;
    private final JwtProperties jwtProperties;

    @Transactional
    public AuthResponse register(RegisterRequest request) {
        if (userRepository.existsByEmail(request.email())) {
            throw new AppException(ErrorCode.EMAIL_ALREADY_EXISTS);
        }

        Role userRole = roleRepository.findByName(RoleType.ROLE_USER)
                .orElseThrow(() -> new AppException(ErrorCode.RESOURCE_NOT_FOUND, "Không tìm thấy vai trò người dùng mặc định"));

        User user = new User();
        user.setEmail(request.email());
        user.setPassword(passwordEncoder.encode(request.password()));
        user.setFullName(request.fullName());
        user.setPhone(request.phone());
        user.setStatus(UserStatus.ACTIVE);
        user.addRole(userRole);

        user = userRepository.save(user);
        log.info("Registered new user with email: {}", user.getEmail());

        CustomUserDetails userDetails = CustomUserDetails.build(user);
        String token = jwtService.generateAccessToken(userDetails, user.getId());
        UserResponse userResponse = userMapper.toUserResponse(user);

        return AuthResponse.of(token, jwtProperties.getAccessTokenExpirationMs(), userResponse);
    }

    @Transactional(readOnly = true)
    public AuthResponse login(LoginRequest request) {
        try {
            authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(request.email(), request.password())
            );
        } catch (DisabledException | LockedException e) {
            log.warn("Login failed for disabled/locked account: {}", request.email());
            throw new AppException(ErrorCode.USER_DISABLED);
        } catch (AuthenticationException e) {
            log.warn("Login failed: invalid credentials for email {}", request.email());
            throw new AppException(ErrorCode.INVALID_CREDENTIALS);
        }

        User user = userRepository.findWithRolesByEmail(request.email())
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));

        CustomUserDetails userDetails = CustomUserDetails.build(user);
        String token = jwtService.generateAccessToken(userDetails, user.getId());
        UserResponse userResponse = userMapper.toUserResponse(user);

        log.info("User {} logged in successfully", user.getEmail());
        return AuthResponse.of(token, jwtProperties.getAccessTokenExpirationMs(), userResponse);
    }
}
