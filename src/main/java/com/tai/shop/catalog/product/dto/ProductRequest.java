package com.tai.shop.catalog.product.dto;

import com.tai.shop.catalog.product.ProductStatus;
import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;

@Schema(description = "Request tạo hoặc cập nhật sản phẩm")
public record ProductRequest(

        @Schema(description = "ID danh mục sản phẩm", example = "4")
        @NotNull(message = "Danh mục không được để trống")
        Long categoryId,

        @Schema(description = "Tên sản phẩm", example = "Áo Thun Nam Cổ Tròn Cotton Compact Basic")
        @NotBlank(message = "Tên sản phẩm không được để trống")
        @Size(max = 255, message = "Tên sản phẩm không được vượt quá 255 ký tự")
        String name,

        @Schema(description = "Mô tả ngắn sản phẩm", example = "Áo thun nam 100% cotton compact mềm mịn...")
        @Size(max = 500, message = "Mô tả ngắn không được vượt quá 500 ký tự")
        String shortDescription,

        @Schema(description = "Mô tả chi tiết sản phẩm", example = "Chất liệu 100% Cotton Compact cao cấp...")
        String description,

        @Schema(description = "Giá bán hiện tại", example = "199000.00")
        @NotNull(message = "Giá bán không được để trống")
        @DecimalMin(value = "0.0", inclusive = false, message = "Giá bán phải lớn hơn 0")
        BigDecimal price,

        @Schema(description = "Giá gốc (trước khuyến mãi)", example = "250000.00")
        @DecimalMin(value = "0.0", inclusive = false, message = "Giá gốc phải lớn hơn 0")
        BigDecimal originalPrice,

        @Schema(description = "Số lượng tồn kho", example = "100")
        @NotNull(message = "Số lượng tồn kho không được để trống")
        @Min(value = 0, message = "Số lượng tồn kho phải lớn hơn hoặc bằng 0")
        Integer stock,

        @Schema(description = "URL ảnh đại diện sản phẩm", example = "https://res.cloudinary.com/demo/image/upload/v1/product1.jpg")
        @Size(max = 255, message = "URL ảnh không được vượt quá 255 ký tự")
        String thumbnailUrl,

        @Schema(description = "Trạng thái sản phẩm", example = "ACTIVE")
        ProductStatus status
) {}
