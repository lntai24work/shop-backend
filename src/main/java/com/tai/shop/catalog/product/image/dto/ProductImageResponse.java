package com.tai.shop.catalog.product.image.dto;

import io.swagger.v3.oas.annotations.media.Schema;

import java.time.Instant;

@Schema(description = "Thông tin ảnh sản phẩm")
public record ProductImageResponse(
        @Schema(description = "ID ảnh", example = "1")
        Long id,

        @Schema(description = "Đường dẫn URL của ảnh trên Cloudinary", example = "https://res.cloudinary.com/demo/image/upload/v1/sample.jpg")
        String imageUrl,

        @Schema(description = "Mã định danh publicId trên Cloudinary", example = "shop/products/abc123xyz")
        String publicId,

        @Schema(description = "Thứ tự hiển thị", example = "0")
        Integer displayOrder,

        @Schema(description = "Có phải ảnh đại diện không", example = "true")
        boolean isThumbnail,

        @Schema(description = "Thời gian tải lên")
        Instant createdAt
) {}
