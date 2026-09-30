package com.tai.shop.catalog.product;

import com.tai.shop.catalog.product.dto.ProductFilterRequest;
import com.tai.shop.catalog.product.dto.ProductResponse;
import com.tai.shop.common.dto.ApiResponse;
import com.tai.shop.common.dto.PageResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.ModelAttribute;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/products")
@RequiredArgsConstructor
@Tag(name = "Product - Public", description = "APIs xem, tìm kiếm, lọc và phân trang sản phẩm công khai")
public class ProductController {

    private final ProductService productService;

    @GetMapping
    @Operation(summary = "Lấy danh sách sản phẩm với bộ lọc động và phân trang",
            description = "Cho phép tìm kiếm theo keyword, lọc theo categoryId (bao gồm cả category con), khoảng giá minPrice - maxPrice")
    public ResponseEntity<ApiResponse<PageResponse<ProductResponse>>> getProducts(
            @ModelAttribute ProductFilterRequest filter,
            @PageableDefault(size = 12, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {
        PageResponse<ProductResponse> response = productService.getProducts(filter, pageable);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @GetMapping("/{slug}")
    @Operation(summary = "Lấy chi tiết sản phẩm theo slug",
            description = "Trả về thông tin chi tiết của sản phẩm thông qua đường dẫn thân thiện (slug)")
    public ResponseEntity<ApiResponse<ProductResponse>> getProductBySlug(@PathVariable String slug) {
        ProductResponse response = productService.getBySlug(slug);
        return ResponseEntity.ok(ApiResponse.success(response));
    }
}
