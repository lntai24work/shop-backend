package com.tai.shop.user.address.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

@Schema(description = "Request tạo hoặc cập nhật địa chỉ giao hàng")
public record AddressRequest(
        @Schema(description = "Tên người nhận", example = "Nguyễn Văn A")
        @NotBlank(message = "Tên người nhận không được để trống")
        @Size(max = 100, message = "Tên người nhận không được vượt quá 100 ký tự")
        String recipientName,

        @Schema(description = "Số điện thoại người nhận", example = "0987654321")
        @NotBlank(message = "Số điện thoại không được để trống")
        @Pattern(regexp = "^(0|\\+84)[35789][0-9]{8}$", message = "Số điện thoại không đúng định dạng Việt Nam")
        String phone,

        @Schema(description = "Tỉnh / Thành phố", example = "Hà Nội")
        @NotBlank(message = "Tỉnh / Thành phố không được để trống")
        @Size(max = 100, message = "Tỉnh / Thành phố không được vượt quá 100 ký tự")
        String province,

        @Schema(description = "Quận / Huyện", example = "Cầu Giấy")
        @NotBlank(message = "Quận / Huyện không được để trống")
        @Size(max = 100, message = "Quận / Huyện không được vượt quá 100 ký tự")
        String district,

        @Schema(description = "Phường / Xã", example = "Dịch Vọng Hậu")
        @NotBlank(message = "Phường / Xã không được để trống")
        @Size(max = 100, message = "Phường / Xã không được vượt quá 100 ký tự")
        String ward,

        @Schema(description = "Địa chỉ chi tiết (số nhà, ngõ, đường)", example = "Số 123 đường Cầu Giấy")
        @NotBlank(message = "Địa chỉ chi tiết không được để trống")
        @Size(max = 255, message = "Địa chỉ chi tiết không được vượt quá 255 ký tự")
        String detailAddress,

        @Schema(description = "Đặt làm địa chỉ mặc định", example = "true")
        boolean isDefault
) {}
