package com.tai.shop.user.dto;

import com.tai.shop.user.UserStatus;
import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotNull;

@Schema(description = "Request cập nhật trạng thái người dùng")
public record UpdateUserStatusRequest(
        @Schema(description = "Trạng thái tài khoản", example = "BLOCKED")
        @NotNull(message = "Trạng thái không được để trống")
        UserStatus status
) {}
