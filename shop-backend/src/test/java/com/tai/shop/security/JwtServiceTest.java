package com.tai.shop.security;

import com.tai.shop.config.properties.JwtProperties;
import com.tai.shop.user.Role;
import com.tai.shop.user.RoleType;
import com.tai.shop.user.User;
import com.tai.shop.user.UserStatus;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.util.Set;

import static org.assertj.core.api.Assertions.assertThat;

class JwtServiceTest {

    private JwtService jwtService;
    private JwtProperties jwtProperties;

    @BeforeEach
    void setUp() {
        jwtProperties = new JwtProperties();
        jwtProperties.setSecret("404E635266556A586E3272357538782F413F4428472B4B6250645367566B5970");
        jwtProperties.setAccessTokenExpirationMs(900000); // 15 mins
        jwtService = new JwtService(jwtProperties);
    }

    private CustomUserDetails createTestUserDetails() {
        User user = new User();
        user.setId(1L);
        user.setEmail("user@shop.com");
        user.setPassword("password123");
        user.setStatus(UserStatus.ACTIVE);
        Role role = new Role(RoleType.ROLE_USER, "User role");
        user.setRoles(Set.of(role));
        return CustomUserDetails.build(user);
    }

    @Test
    @DisplayName("generateAccessToken: should generate valid token with correct claims")
    void generateAccessToken_validUser_shouldGenerateValidToken() {
        CustomUserDetails userDetails = createTestUserDetails();

        String token = jwtService.generateAccessToken(userDetails, userDetails.getId());

        assertThat(token).isNotBlank();
        assertThat(jwtService.validateToken(token)).isTrue();
        assertThat(jwtService.extractUsername(token)).isEqualTo("user@shop.com");
        assertThat(jwtService.extractUserId(token)).isEqualTo(1L);
        assertThat(jwtService.isTokenValid(token, userDetails)).isTrue();
    }

    @Test
    @DisplayName("validateToken: should return false for malformed token")
    void validateToken_malformedToken_shouldReturnFalse() {
        boolean isValid = jwtService.validateToken("invalid.token.structure");

        assertThat(isValid).isFalse();
    }

    @Test
    @DisplayName("validateToken: should return false for expired token")
    void validateToken_expiredToken_shouldReturnFalse() {
        jwtProperties.setAccessTokenExpirationMs(-1000); // Expired 1 second ago
        JwtService expiredJwtService = new JwtService(jwtProperties);

        CustomUserDetails userDetails = createTestUserDetails();
        String expiredToken = expiredJwtService.generateAccessToken(userDetails, userDetails.getId());

        assertThat(jwtService.validateToken(expiredToken)).isFalse();
    }
}
