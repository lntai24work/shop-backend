package com.tai.shop.user.dto;

import com.tai.shop.user.UserStatus;

public record UserFilterRequest(
        String keyword,
        String role,
        UserStatus status,
        Integer page,
        Integer size,
        String sort
) {}
