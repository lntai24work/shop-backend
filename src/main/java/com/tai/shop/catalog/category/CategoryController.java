package com.tai.shop.catalog.category;

import com.tai.shop.catalog.category.dto.CategoryResponse;
import com.tai.shop.catalog.category.dto.CategoryTreeResponse;
import com.tai.shop.common.dto.ApiResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/v1/categories")
@RequiredArgsConstructor
@Tag(name = "Category", description = "APIs danh mục sản phẩm (công khai)")
public class CategoryController {

    private final CategoryService categoryService;

    @GetMapping
    @Operation(summary = "Lấy toàn bộ cây danh mục sản phẩm")
    public ResponseEntity<ApiResponse<List<CategoryTreeResponse>>> getCategoryTree() {
        List<CategoryTreeResponse> tree = categoryService.getCategoryTree();
        return ResponseEntity.ok(ApiResponse.success(tree));
    }

    @GetMapping("/{slug}")
    @Operation(summary = "Lấy chi tiết danh mục theo slug")
    public ResponseEntity<ApiResponse<CategoryResponse>> getBySlug(@PathVariable String slug) {
        CategoryResponse response = categoryService.getBySlug(slug);
        return ResponseEntity.ok(ApiResponse.success(response));
    }
}
