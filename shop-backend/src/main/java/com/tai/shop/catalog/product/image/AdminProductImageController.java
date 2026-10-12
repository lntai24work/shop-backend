package com.tai.shop.catalog.product.image;

import com.tai.shop.catalog.product.image.dto.ProductImageResponse;
import com.tai.shop.common.dto.ApiResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@RestController
@RequestMapping("/api/v1/admin/products/{id}/images")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
@SecurityRequirement(name = "bearerAuth")
@Tag(name = "Product Image - Admin", description = "APIs quản lý album ảnh và upload Cloudinary cho sản phẩm")
public class AdminProductImageController {

    private final ProductImageService productImageService;

    @GetMapping
    @Operation(summary = "Lấy danh sách toàn bộ ảnh của sản phẩm")
    public ResponseEntity<ApiResponse<List<ProductImageResponse>>> getProductImages(@PathVariable Long id) {
        List<ProductImageResponse> images = productImageService.getProductImages(id);
        return ResponseEntity.ok(ApiResponse.success(images));
    }

    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @Operation(summary = "Upload 1 hoặc nhiều ảnh cho sản phẩm lên Cloudinary",
            description = "Chấp nhận định dạng JPEG, PNG, WEBP, dung lượng tối đa 5MB/file")
    public ResponseEntity<ApiResponse<List<ProductImageResponse>>> uploadImages(
            @PathVariable Long id,
            @Parameter(description = "Danh sách file ảnh cần tải lên",
                    content = @Content(mediaType = MediaType.MULTIPART_FORM_DATA_VALUE,
                            schema = @Schema(type = "string", format = "binary")))
            @RequestParam("files") List<MultipartFile> files) {
        List<ProductImageResponse> response = productImageService.uploadImages(id, files);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Tải ảnh lên thành công", response));
    }

    @DeleteMapping("/{imageId}")
    @Operation(summary = "Xóa ảnh khỏi sản phẩm và xóa file trên Cloudinary")
    public ResponseEntity<ApiResponse<Void>> deleteImage(
            @PathVariable Long id,
            @PathVariable Long imageId) {
        productImageService.deleteImage(id, imageId);
        return ResponseEntity.ok(ApiResponse.success("Xóa ảnh thành công", null));
    }

    @PatchMapping("/{imageId}/thumbnail")
    @Operation(summary = "Đặt ảnh làm ảnh đại diện (thumbnail) chính cho sản phẩm")
    public ResponseEntity<ApiResponse<ProductImageResponse>> setThumbnail(
            @PathVariable Long id,
            @PathVariable Long imageId) {
        ProductImageResponse response = productImageService.setThumbnail(id, imageId);
        return ResponseEntity.ok(ApiResponse.success("Đặt ảnh đại diện thành công", response));
    }
}
