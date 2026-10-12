package com.tai.shop.catalog.product.dto;

import com.tai.shop.catalog.product.ProductStatus;
import io.swagger.v3.oas.annotations.media.Schema;

import java.math.BigDecimal;

@Schema(description = "Tiêu chí lọc sản phẩm")
public record ProductFilterRequest(
        @Schema(description = "Từ khóa tìm kiếm theo tên hoặc mô tả", example = "cotton")
        String keyword,

        @Schema(description = "ID danh mục cần lọc", example = "4")
        Long categoryId,

        @Schema(description = "Mức giá tối thiểu", example = "100000")
        BigDecimal minPrice,

        @Schema(description = "Mức giá tối đa", example = "500000")
        BigDecimal maxPrice,

        @Schema(description = "Trạng thái sản phẩm (Admin có thể truyền để lọc)", example = "ACTIVE")
        ProductStatus status
) {}
