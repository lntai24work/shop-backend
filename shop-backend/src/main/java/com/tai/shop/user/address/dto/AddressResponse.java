package com.tai.shop.user.address.dto;

import io.swagger.v3.oas.annotations.media.Schema;

import java.time.Instant;

@Schema(description = "Thông tin địa chỉ giao hàng")
public record AddressResponse(
        @Schema(description = "ID địa chỉ", example = "1")
        Long id,

        @Schema(description = "Tên người nhận", example = "Nguyễn Văn A")
        String recipientName,

        @Schema(description = "Số điện thoại người nhận", example = "0987654321")
        String phone,

        @Schema(description = "Tỉnh / Thành phố", example = "Hà Nội")
        String province,

        @Schema(description = "Quận / Huyện", example = "Cầu Giấy")
        String district,

        @Schema(description = "Phường / Xã", example = "Dịch Vọng Hậu")
        String ward,

        @Schema(description = "Địa chỉ chi tiết", example = "Số 123 đường Cầu Giấy")
        String detailAddress,

        @Schema(description = "Địa chỉ mặc định", example = "true")
        boolean isDefault,

        @Schema(description = "Thời gian tạo")
        Instant createdAt,

        @Schema(description = "Thời gian cập nhật")
        Instant updatedAt
) {}
