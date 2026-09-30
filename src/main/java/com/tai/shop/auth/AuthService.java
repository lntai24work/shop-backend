package com.tai.shop.auth;

import com.tai.shop.auth.dto.AuthResponse;
import com.tai.shop.auth.dto.AuthResult;
import com.tai.shop.auth.dto.LoginRequest;
import com.tai.shop.auth.dto.RegisterRequest;
import com.tai.shop.common.exception.AppException;
import com.tai.shop.common.exception.ErrorCode;
import com.tai.shop.common.util.HashUtils;
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
import org.springframework.util.StringUtils;

import java.time.Instant;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final RefreshTokenRepository refreshTokenRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final AuthenticationManager authenticationManager;
    private final UserMapper userMapper;
    private final JwtProperties jwtProperties;

    @Transactional
    public AuthResult register(RegisterRequest request) {
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
        String accessToken = jwtService.generateAccessToken(userDetails, user.getId());
        String rawRefreshToken = createAndSaveRefreshToken(user);
        UserResponse userResponse = userMapper.toUserResponse(user);

        AuthResponse authResponse = AuthResponse.of(accessToken, jwtProperties.getAccessTokenExpirationMs(), userResponse);
        return new AuthResult(authResponse, rawRefreshToken);
    }

    @Transactional
    public AuthResult login(LoginRequest request) {
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
        String accessToken = jwtService.generateAccessToken(userDetails, user.getId());
        String rawRefreshToken = createAndSaveRefreshToken(user);
        UserResponse userResponse = userMapper.toUserResponse(user);

        log.info("User {} logged in successfully", user.getEmail());
        AuthResponse authResponse = AuthResponse.of(accessToken, jwtProperties.getAccessTokenExpirationMs(), userResponse);
        return new AuthResult(authResponse, rawRefreshToken);
    }

    @Transactional
    public AuthResult refreshToken(String rawRefreshToken) {
        if (!StringUtils.hasText(rawRefreshToken)) {
            throw new AppException(ErrorCode.REFRESH_TOKEN_INVALID);
        }

        String tokenHash = HashUtils.sha256(rawRefreshToken);
        RefreshToken refreshToken = refreshTokenRepository.findByTokenHash(tokenHash)
                .orElseThrow(() -> new AppException(ErrorCode.REFRESH_TOKEN_INVALID));

        // Reuse Detection: Nếu token đã bị thu hồi trước đó -> cảnh báo bảo mật và thu hồi toàn bộ token của user
        if (refreshToken.isRevoked()) {
            log.warn("Security Alert: Reuse detection triggered for user id: {}. Revoking all refresh tokens.",
                    refreshToken.getUser().getId());
            refreshTokenRepository.revokeAllByUserId(refreshToken.getUser().getId());
            throw new AppException(ErrorCode.REFRESH_TOKEN_INVALID);
        }

        // Hết hạn
        if (refreshToken.isExpired()) {
            refreshToken.revoke();
            refreshTokenRepository.save(refreshToken);
            throw new AppException(ErrorCode.REFRESH_TOKEN_EXPIRED);
        }

        User user = refreshToken.getUser();
        if (user.getStatus() != UserStatus.ACTIVE) {
            throw new AppException(ErrorCode.USER_DISABLED);
        }

        // Token Rotation: Thu hồi token hiện tại và sinh token mới
        refreshToken.revoke();
        refreshTokenRepository.save(refreshToken);

        String newRawRefreshToken = createAndSaveRefreshToken(user);
        CustomUserDetails userDetails = CustomUserDetails.build(user);
        String newAccessToken = jwtService.generateAccessToken(userDetails, user.getId());
        UserResponse userResponse = userMapper.toUserResponse(user);

        AuthResponse authResponse = AuthResponse.of(newAccessToken, jwtProperties.getAccessTokenExpirationMs(), userResponse);
        return new AuthResult(authResponse, newRawRefreshToken);
    }

    @Transactional
    public void logout(String rawRefreshToken) {
        if (StringUtils.hasText(rawRefreshToken)) {
            String tokenHash = HashUtils.sha256(rawRefreshToken);
            refreshTokenRepository.findByTokenHash(tokenHash).ifPresent(token -> {
                token.revoke();
                refreshTokenRepository.save(token);
                log.info("Revoked refresh token for user id: {}", token.getUser().getId());
            });
        }
    }

    private String createAndSaveRefreshToken(User user) {
        String rawToken = UUID.randomUUID().toString().replace("-", "") + UUID.randomUUID().toString().replace("-", "");
        String tokenHash = HashUtils.sha256(rawToken);
        Instant expiryDate = Instant.now().plusMillis(jwtProperties.getRefreshTokenExpirationMs());

        RefreshToken refreshToken = new RefreshToken(user, tokenHash, expiryDate);
        refreshTokenRepository.save(refreshToken);
        return rawToken;
    }
}
