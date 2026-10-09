package com.tai.shop.user.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

@Schema(description = "Request đổi mật khẩu người dùng")
public record ChangePasswordRequest(
        @Schema(description = "Mật khẩu hiện tại", example = "password123")
        @NotBlank(message = "Mật khẩu cũ không được để trống")
        String oldPassword,

        @Schema(description = "Mật khẩu mới (tối thiểu 6 ký tự)", example = "newPassword123")
        @NotBlank(message = "Mật khẩu mới không được để trống")
        @Size(min = 6, max = 100, message = "Mật khẩu mới phải từ 6 đến 100 ký tự")
        String newPassword,

        @Schema(description = "Xác nhận mật khẩu mới", example = "newPassword123")
        @NotBlank(message = "Xác nhận mật khẩu mới không được để trống")
        String confirmPassword
) {}
