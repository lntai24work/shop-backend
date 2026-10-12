package com.tai.shop.user.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

import java.util.Set;

@Schema(description = "Request tạo người dùng mới bởi Quản trị viên")
public record AdminCreateUserRequest(
        @Schema(description = "Email đăng nhập", example = "user@example.com")
        @NotBlank(message = "Email không được để trống")
        @Email(message = "Email không đúng định dạng")
        String email,

        @Schema(description = "Mật khẩu ban đầu", example = "password123")
        @NotBlank(message = "Mật khẩu không được để trống")
        @Size(min = 6, max = 100, message = "Mật khẩu phải từ 6 đến 100 ký tự")
        String password,

        @Schema(description = "Họ và tên", example = "Nguyễn Văn A")
        @NotBlank(message = "Họ tên không được để trống")
        @Size(max = 100, message = "Họ tên không được vượt quá 100 ký tự")
        String fullName,

        @Schema(description = "Số điện thoại", example = "0912345678")
        @Pattern(regexp = "^(0|\\+84)[35789][0-9]{8}$", message = "Số điện thoại không đúng định dạng Việt Nam")
        String phone,

        @Schema(description = "Danh sách vai trò", example = "[\"ROLE_USER\"]")
        Set<String> roles
) {}
