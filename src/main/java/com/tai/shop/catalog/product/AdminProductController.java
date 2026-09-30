package com.tai.shop.catalog.product;

import com.tai.shop.catalog.product.dto.ProductFilterRequest;
import com.tai.shop.catalog.product.dto.ProductRequest;
import com.tai.shop.catalog.product.dto.ProductResponse;
import com.tai.shop.catalog.product.dto.UpdateStockRequest;
import com.tai.shop.common.dto.ApiResponse;
import com.tai.shop.common.dto.PageResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.ModelAttribute;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/admin/products")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
@SecurityRequirement(name = "bearerAuth")
@Tag(name = "Product - Admin", description = "APIs quản trị sản phẩm (Yêu cầu quyền ADMIN)")
public class AdminProductController {

    private final ProductService productService;

    @GetMapping
    @Operation(summary = "Quản trị viên lấy danh sách sản phẩm với bộ lọc",
            description = "Hỗ trợ lọc theo mọi trạng thái, danh mục, từ khóa, khoảng giá kèm phân trang")
    public ResponseEntity<ApiResponse<PageResponse<ProductResponse>>> getProducts(
            @ModelAttribute ProductFilterRequest filter,
            @PageableDefault(size = 10, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {
        PageResponse<ProductResponse> response = productService.getProductsAdmin(filter, pageable);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Quản trị viên lấy chi tiết sản phẩm theo ID")
    public ResponseEntity<ApiResponse<ProductResponse>> getProductById(@PathVariable Long id) {
        ProductResponse response = productService.getById(id);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @PostMapping
    @Operation(summary = "Tạo sản phẩm mới", description = "Tạo sản phẩm mới và tự động sinh slug thân thiện độc nhất")
    public ResponseEntity<ApiResponse<ProductResponse>> createProduct(@Valid @RequestBody ProductRequest request) {
        ProductResponse response = productService.createProduct(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Tạo sản phẩm mới thành công", response));
    }

    @PutMapping("/{id}")
    @Operation(summary = "Cập nhật thông tin sản phẩm", description = "Cập nhật chi tiết sản phẩm và cập nhật lại slug nếu đổi tên")
    public ResponseEntity<ApiResponse<ProductResponse>> updateProduct(
            @PathVariable Long id,
            @Valid @RequestBody ProductRequest request) {
        ProductResponse response = productService.updateProduct(id, request);
        return ResponseEntity.ok(ApiResponse.success("Cập nhật sản phẩm thành công", response));
    }

    @PatchMapping("/{id}/stock")
    @Operation(summary = "Cập nhật nhanh số lượng tồn kho",
            description = "Cập nhật số lượng tồn kho và tự động đổi trạng thái OUT_OF_STOCK khi stock = 0")
    public ResponseEntity<ApiResponse<ProductResponse>> updateStock(
            @PathVariable Long id,
            @Valid @RequestBody UpdateStockRequest request) {
        ProductResponse response = productService.updateStock(id, request.stock());
        return ResponseEntity.ok(ApiResponse.success("Cập nhật tồn kho thành công", response));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Xóa mềm sản phẩm theo ID")
    public ResponseEntity<ApiResponse<Void>> deleteProduct(@PathVariable Long id) {
        productService.deleteProduct(id);
        return ResponseEntity.ok(ApiResponse.success("Xóa mềm sản phẩm thành công", null));
    }
}
