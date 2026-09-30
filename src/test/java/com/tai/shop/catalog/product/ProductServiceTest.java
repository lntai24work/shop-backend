package com.tai.shop.catalog.product;

import com.tai.shop.catalog.category.Category;
import com.tai.shop.catalog.category.CategoryRepository;
import com.tai.shop.catalog.product.dto.ProductFilterRequest;
import com.tai.shop.catalog.product.dto.ProductRequest;
import com.tai.shop.catalog.product.dto.ProductResponse;
import com.tai.shop.common.dto.PageResponse;
import com.tai.shop.common.exception.AppException;
import com.tai.shop.common.exception.ErrorCode;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class ProductServiceTest {

    @Mock
    private ProductRepository productRepository;

    @Mock
    private CategoryRepository categoryRepository;

    @Mock
    private ProductMapper productMapper;

    @InjectMocks
    private ProductService productService;

    private Category category;
    private Product product;
    private ProductResponse productResponse;

    @BeforeEach
    void setUp() {
        category = new Category("Áo Thun Nam", "ao-thun-nam", "Áo thun", null);
        category.setId(4L);

        product = new Product(
                category,
                "Áo Thun Nam Cổ Tròn Cotton Compact Basic",
                "ao-thun-nam-co-tron-cotton-compact-basic",
                "Áo thun nam 100% cotton compact",
                "Chất liệu 100% Cotton Compact",
                new BigDecimal("199000.00"),
                new BigDecimal("250000.00"),
                100,
                "https://example.com/thumb.jpg",
                ProductStatus.ACTIVE
        );
        product.setId(1L);

        productResponse = new ProductResponse(
                1L,
                4L,
                "Áo Thun Nam",
                "Áo Thun Nam Cổ Tròn Cotton Compact Basic",
                "ao-thun-nam-co-tron-cotton-compact-basic",
                "Áo thun nam 100% cotton compact",
                "Chất liệu 100% Cotton Compact",
                new BigDecimal("199000.00"),
                new BigDecimal("250000.00"),
                100,
                0,
                "https://example.com/thumb.jpg",
                ProductStatus.ACTIVE,
                null,
                null
        );
    }

    @Test
    @DisplayName("getProducts: should return PageResponse of products")
    void getProducts_validFilter_shouldReturnPageResponse() {
        ProductFilterRequest filter = new ProductFilterRequest("cotton", 4L, new BigDecimal("100000"), new BigDecimal("300000"), ProductStatus.ACTIVE);
        Pageable pageable = PageRequest.of(0, 10);
        Page<Product> page = new PageImpl<>(List.of(product), pageable, 1);

        when(categoryRepository.findById(4L)).thenReturn(Optional.of(category));
        when(productRepository.findAll(any(Specification.class), eq(pageable))).thenReturn(page);
        when(productMapper.toResponse(product)).thenReturn(productResponse);

        PageResponse<ProductResponse> result = productService.getProducts(filter, pageable);

        assertThat(result).isNotNull();
        assertThat(result.content()).hasSize(1);
        assertThat(result.content().get(0).name()).isEqualTo("Áo Thun Nam Cổ Tròn Cotton Compact Basic");
        assertThat(result.totalElements()).isEqualTo(1);
    }

    @Test
    @DisplayName("getBySlug: should return product response when active")
    void getBySlug_existingActiveProduct_shouldReturnProductResponse() {
        when(productRepository.findWithCategoryBySlugAndDeletedAtIsNull("ao-thun-nam-co-tron-cotton-compact-basic"))
                .thenReturn(Optional.of(product));
        when(productMapper.toResponse(product)).thenReturn(productResponse);

        ProductResponse result = productService.getBySlug("ao-thun-nam-co-tron-cotton-compact-basic");

        assertThat(result).isNotNull();
        assertThat(result.slug()).isEqualTo("ao-thun-nam-co-tron-cotton-compact-basic");
    }

    @Test
    @DisplayName("getBySlug: should throw AppException when product not found")
    void getBySlug_notFound_shouldThrowAppException() {
        when(productRepository.findWithCategoryBySlugAndDeletedAtIsNull("not-found"))
                .thenReturn(Optional.empty());

        assertThatThrownBy(() -> productService.getBySlug("not-found"))
                .isInstanceOf(AppException.class)
                .hasFieldOrPropertyWithValue("errorCode", ErrorCode.PRODUCT_NOT_FOUND);
    }

    @Test
    @DisplayName("getBySlug: should throw AppException when product is inactive")
    void getBySlug_inactiveProduct_shouldThrowAppException() {
        product.setStatus(ProductStatus.INACTIVE);
        when(productRepository.findWithCategoryBySlugAndDeletedAtIsNull("inactive-slug"))
                .thenReturn(Optional.of(product));

        assertThatThrownBy(() -> productService.getBySlug("inactive-slug"))
                .isInstanceOf(AppException.class)
                .hasFieldOrPropertyWithValue("errorCode", ErrorCode.PRODUCT_NOT_FOUND);
    }

    @Test
    @DisplayName("createProduct: should create product with unique slug")
    void createProduct_validRequest_shouldCreateWithUniqueSlug() {
        ProductRequest request = new ProductRequest(
                4L,
                "Áo Polo Nam Thể Thao",
                "Mô tả ngắn",
                "Mô tả chi tiết",
                new BigDecimal("299000.00"),
                new BigDecimal("350000.00"),
                50,
                "thumb.jpg",
                ProductStatus.ACTIVE
        );

        when(categoryRepository.findById(4L)).thenReturn(Optional.of(category));
        when(productRepository.existsBySlug("ao-polo-nam-the-thao")).thenReturn(false);
        when(productRepository.save(any(Product.class))).thenReturn(product);
        when(productMapper.toResponse(any(Product.class))).thenReturn(productResponse);

        ProductResponse result = productService.createProduct(request);

        assertThat(result).isNotNull();
        verify(productRepository).save(any(Product.class));
    }

    @Test
    @DisplayName("createProduct: should throw AppException when price > originalPrice")
    void createProduct_priceGreaterThanOriginalPrice_shouldThrowAppException() {
        ProductRequest request = new ProductRequest(
                4L,
                "Áo Polo Nam Thể Thao",
                "Mô tả ngắn",
                "Mô tả chi tiết",
                new BigDecimal("400000.00"),
                new BigDecimal("350000.00"),
                50,
                "thumb.jpg",
                ProductStatus.ACTIVE
        );

        assertThatThrownBy(() -> productService.createProduct(request))
                .isInstanceOf(AppException.class)
                .hasFieldOrPropertyWithValue("errorCode", ErrorCode.INVALID_PRICE);
    }

    @Test
    @DisplayName("createProduct: should throw AppException when category not found")
    void createProduct_categoryNotFound_shouldThrowAppException() {
        ProductRequest request = new ProductRequest(
                999L,
                "Áo Polo Nam Thể Thao",
                "Mô tả ngắn",
                "Mô tả chi tiết",
                new BigDecimal("299000.00"),
                new BigDecimal("350000.00"),
                50,
                "thumb.jpg",
                ProductStatus.ACTIVE
        );

        when(categoryRepository.findById(999L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> productService.createProduct(request))
                .isInstanceOf(AppException.class)
                .hasFieldOrPropertyWithValue("errorCode", ErrorCode.CATEGORY_NOT_FOUND);
    }

    @Test
    @DisplayName("updateProduct: should update product fields and regenerate slug if name changes")
    void updateProduct_validRequest_shouldUpdate() {
        ProductRequest updateReq = new ProductRequest(
                4L,
                "Áo Thun Nam Cổ Tim Mới",
                "Mô tả mới",
                "Chi tiết mới",
                new BigDecimal("210000.00"),
                new BigDecimal("260000.00"),
                80,
                "new-thumb.jpg",
                ProductStatus.ACTIVE
        );

        when(productRepository.findByIdAndDeletedAtIsNull(1L)).thenReturn(Optional.of(product));
        when(categoryRepository.findById(4L)).thenReturn(Optional.of(category));
        when(productRepository.existsBySlugAndIdNot("ao-thun-nam-co-tim-moi", 1L)).thenReturn(false);
        when(productRepository.save(product)).thenReturn(product);
        when(productMapper.toResponse(product)).thenReturn(productResponse);

        ProductResponse result = productService.updateProduct(1L, updateReq);

        assertThat(result).isNotNull();
        assertThat(product.getName()).isEqualTo("Áo Thun Nam Cổ Tim Mới");
        assertThat(product.getSlug()).isEqualTo("ao-thun-nam-co-tim-moi");
        verify(productRepository).save(product);
    }

    @Test
    @DisplayName("updateStock: should update stock and auto change status when stock is 0")
    void updateStock_zeroStock_shouldChangeStatusToOutOfStock() {
        when(productRepository.findByIdAndDeletedAtIsNull(1L)).thenReturn(Optional.of(product));
        when(productRepository.save(product)).thenReturn(product);
        when(productMapper.toResponse(product)).thenReturn(productResponse);

        productService.updateStock(1L, 0);

        assertThat(product.getStock()).isZero();
        assertThat(product.getStatus()).isEqualTo(ProductStatus.OUT_OF_STOCK);
        verify(productRepository).save(product);
    }

    @Test
    @DisplayName("updateStock: should throw AppException when stock < 0")
    void updateStock_negativeStock_shouldThrowAppException() {
        assertThatThrownBy(() -> productService.updateStock(1L, -5))
                .isInstanceOf(AppException.class)
                .hasFieldOrPropertyWithValue("errorCode", ErrorCode.INVALID_STOCK);
    }

    @Test
    @DisplayName("deleteProduct: should soft delete product")
    void deleteProduct_existingId_shouldSoftDelete() {
        when(productRepository.findByIdAndDeletedAtIsNull(1L)).thenReturn(Optional.of(product));

        productService.deleteProduct(1L);

        assertThat(product.isDeleted()).isTrue();
        verify(productRepository).save(product);
    }
}
