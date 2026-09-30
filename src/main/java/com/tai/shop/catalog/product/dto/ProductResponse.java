package com.tai.shop.catalog.product.dto;

import com.tai.shop.catalog.product.ProductStatus;
import io.swagger.v3.oas.annotations.media.Schema;

import java.math.BigDecimal;
import java.time.Instant;

@Schema(description = "Thông tin phản hồi sản phẩm")
public record ProductResponse(
        @Schema(description = "ID sản phẩm", example = "1")
        Long id,

        @Schema(description = "ID danh mục", example = "4")
        Long categoryId,

        @Schema(description = "Tên danh mục", example = "Áo Thun Nam")
        String categoryName,

        @Schema(description = "Tên sản phẩm", example = "Áo Thun Nam Cổ Tròn Cotton Compact Basic")
        String name,

        @Schema(description = "Đường dẫn thân thiện (slug)", example = "ao-thun-nam-co-tron-cotton-compact-basic")
        String slug,

        @Schema(description = "Mô tả ngắn", example = "Áo thun nam 100% cotton compact mềm mịn...")
        String shortDescription,

        @Schema(description = "Mô tả chi tiết", example = "Chất liệu 100% Cotton Compact cao cấp...")
        String description,

        @Schema(description = "Giá bán hiện tại", example = "199000.00")
        BigDecimal price,

        @Schema(description = "Giá gốc", example = "250000.00")
        BigDecimal originalPrice,

        @Schema(description = "Số lượng tồn kho", example = "100")
        Integer stock,

        @Schema(description = "Số lượng đã bán", example = "25")
        Integer soldCount,

        @Schema(description = "URL ảnh đại diện", example = "https://res.cloudinary.com/demo/image/upload/v1/product1.jpg")
        String thumbnailUrl,

        @Schema(description = "Trạng thái", example = "ACTIVE")
        ProductStatus status,

        @Schema(description = "Thời gian tạo")
        Instant createdAt,

        @Schema(description = "Thời gian cập nhật gần nhất")
        Instant updatedAt
) {}
