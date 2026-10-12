package com.tai.shop.auth;

import com.tai.shop.auth.dto.AuthResponse;
import com.tai.shop.auth.dto.AuthResult;
import com.tai.shop.auth.dto.LoginRequest;
import com.tai.shop.auth.dto.RefreshTokenRequest;
import com.tai.shop.auth.dto.RegisterRequest;
import com.tai.shop.common.dto.ApiResponse;
import com.tai.shop.config.properties.JwtProperties;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseCookie;
import org.springframework.http.ResponseEntity;
import org.springframework.util.StringUtils;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/auth")
@RequiredArgsConstructor
@Tag(name = "Auth", description = "APIs liên quan đến đăng ký, đăng nhập và quản lý token")
public class AuthController {

    private static final String REFRESH_TOKEN_COOKIE_NAME = "refreshToken";

    private final AuthService authService;
    private final JwtProperties jwtProperties;

    @PostMapping("/register")
    @Operation(summary = "Đăng ký tài khoản người dùng mới")
    public ResponseEntity<ApiResponse<AuthResponse>> register(
            @Valid @RequestBody RegisterRequest request,
            HttpServletResponse response
    ) {
        AuthResult result = authService.register(request);
        setRefreshTokenCookie(response, result.rawRefreshToken());

        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(ApiResponse.success("Đăng ký tài khoản thành công", result.authResponse()));
    }

    @PostMapping("/login")
    @Operation(summary = "Đăng nhập và nhận Access Token + Refresh Token (Cookie)")
    public ResponseEntity<ApiResponse<AuthResponse>> login(
            @Valid @RequestBody LoginRequest request,
            HttpServletResponse response
    ) {
        AuthResult result = authService.login(request);
        setRefreshTokenCookie(response, result.rawRefreshToken());

        return ResponseEntity.ok(ApiResponse.success("Đăng nhập thành công", result.authResponse()));
    }

    @PostMapping("/refresh")
    @Operation(summary = "Làm mới Access Token bằng Refresh Token (qua HttpOnly Cookie hoặc Request Body)")
    public ResponseEntity<ApiResponse<AuthResponse>> refresh(
            @RequestBody(required = false) RefreshTokenRequest requestBody,
            HttpServletRequest request,
            HttpServletResponse response
    ) {
        String rawRefreshToken = extractRefreshToken(request, requestBody);
        AuthResult result = authService.refreshToken(rawRefreshToken);
        setRefreshTokenCookie(response, result.rawRefreshToken());

        return ResponseEntity.ok(ApiResponse.success("Làm mới token thành công", result.authResponse()));
    }

    @PostMapping("/logout")
    @Operation(summary = "Đăng xuất và thu hồi Refresh Token")
    public ResponseEntity<ApiResponse<Void>> logout(
            @RequestBody(required = false) RefreshTokenRequest requestBody,
            HttpServletRequest request,
            HttpServletResponse response
    ) {
        String rawRefreshToken = extractRefreshToken(request, requestBody);
        authService.logout(rawRefreshToken);
        clearRefreshTokenCookie(response);

        return ResponseEntity.ok(ApiResponse.success("Đăng xuất thành công", null));
    }

    private void setRefreshTokenCookie(HttpServletResponse response, String refreshToken) {
        ResponseCookie cookie = ResponseCookie.from(REFRESH_TOKEN_COOKIE_NAME, refreshToken)
                .httpOnly(true)
                .secure(false)
                .path("/api/v1/auth")
                .maxAge(jwtProperties.getRefreshTokenExpirationMs() / 1000)
                .sameSite("Lax")
                .build();
        response.addHeader(HttpHeaders.SET_COOKIE, cookie.toString());
    }

    private void clearRefreshTokenCookie(HttpServletResponse response) {
        ResponseCookie cookie = ResponseCookie.from(REFRESH_TOKEN_COOKIE_NAME, "")
                .httpOnly(true)
                .secure(false)
                .path("/api/v1/auth")
                .maxAge(0)
                .sameSite("Lax")
                .build();
        response.addHeader(HttpHeaders.SET_COOKIE, cookie.toString());
    }

    private String extractRefreshToken(HttpServletRequest request, RefreshTokenRequest body) {
        if (body != null && StringUtils.hasText(body.refreshToken())) {
            return body.refreshToken();
        }
        if (request.getCookies() != null) {
            for (Cookie cookie : request.getCookies()) {
                if (REFRESH_TOKEN_COOKIE_NAME.equals(cookie.getName())) {
                    return cookie.getValue();
                }
            }
        }
        return null;
    }
}
