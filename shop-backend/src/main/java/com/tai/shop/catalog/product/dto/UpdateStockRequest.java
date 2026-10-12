package com.tai.shop.catalog.product.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

@Schema(description = "Request cập nhật nhanh số lượng tồn kho")
public record UpdateStockRequest(
        @Schema(description = "Số lượng tồn kho mới", example = "50")
        @NotNull(message = "Số lượng tồn kho không được để trống")
        @Min(value = 0, message = "Số lượng tồn kho phải lớn hơn hoặc bằng 0")
        Integer stock
) {}
