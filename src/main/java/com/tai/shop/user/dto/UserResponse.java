package com.tai.shop.user.dto;

import java.util.Set;

public record UserResponse(
        Long id,
        String email,
        String fullName,
        String phone,
        String avatarUrl,
        Set<String> roles
) {}
