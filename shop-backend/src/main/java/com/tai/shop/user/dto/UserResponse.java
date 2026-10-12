package com.tai.shop.user.dto;

import com.tai.shop.user.UserStatus;

import java.time.Instant;
import java.util.Set;

public record UserResponse(
        Long id,
        String email,
        String fullName,
        String phone,
        String avatarUrl,
        UserStatus status,
        Set<String> roles,
        Instant createdAt
) {
    public UserResponse(Long id, String email, String fullName, String phone, String avatarUrl, Set<String> roles) {
        this(id, email, fullName, phone, avatarUrl, UserStatus.ACTIVE, roles, null);
    }
}
