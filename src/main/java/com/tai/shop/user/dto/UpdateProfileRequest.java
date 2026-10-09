package com.tai.shop.user.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

@Schema(description = "Request cập nhật thông tin cá nhân")
public record UpdateProfileRequest(
        @Schema(description = "Họ và tên", example = "Nguyễn Văn A")
        @NotBlank(message = "Họ và tên không được để trống")
        @Size(max = 100, message = "Họ và tên không được vượt quá 100 ký tự")
        String fullName,

        @Schema(description = "Số điện thoại", example = "0912345678")
        @Pattern(regexp = "^(0|\\+84)[35789][0-9]{8}$", message = "Số điện thoại không đúng định dạng Việt Nam")
        String phone
) {}
