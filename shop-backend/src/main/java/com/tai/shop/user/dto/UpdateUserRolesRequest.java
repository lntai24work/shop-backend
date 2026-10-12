package com.tai.shop.user.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotEmpty;

import java.util.Set;

@Schema(description = "Request cập nhật vai trò người dùng")
public record UpdateUserRolesRequest(
        @Schema(description = "Danh sách vai trò", example = "[\"ROLE_ADMIN\", \"ROLE_USER\"]")
        @NotEmpty(message = "Danh sách vai trò không được để trống")
        Set<String> roles
) {}
