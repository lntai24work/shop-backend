package com.tai.shop.auth.dto;

public record AuthResult(
        AuthResponse authResponse,
        String rawRefreshToken
) {}
