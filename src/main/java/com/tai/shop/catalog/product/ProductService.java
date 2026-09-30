package com.tai.shop.catalog.product;

import com.tai.shop.catalog.category.Category;
import com.tai.shop.catalog.category.CategoryRepository;
import com.tai.shop.catalog.product.dto.ProductFilterRequest;
import com.tai.shop.catalog.product.dto.ProductRequest;
import com.tai.shop.catalog.product.dto.ProductResponse;
import com.tai.shop.common.dto.PageResponse;
import com.tai.shop.common.exception.AppException;
import com.tai.shop.common.exception.ErrorCode;
import com.tai.shop.common.util.SlugUtils;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class ProductService {

    private final ProductRepository productRepository;
    private final CategoryRepository categoryRepository;
    private final ProductMapper productMapper;

    @Transactional(readOnly = true)
    public PageResponse<ProductResponse> getProducts(ProductFilterRequest filter, Pageable pageable) {
        log.debug("Public lấy danh sách sản phẩm với bộ lọc: {}", filter);

        // Với public, nếu không lọc status cụ thể thì mặc định chỉ lấy ACTIVE
        ProductStatus statusToFilter = filter != null && filter.status() != null ? filter.status() : ProductStatus.ACTIVE;
        ProductFilterRequest publicFilter = new ProductFilterRequest(
                filter != null ? filter.keyword() : null,
                filter != null ? filter.categoryId() : null,
                filter != null ? filter.minPrice() : null,
                filter != null ? filter.maxPrice() : null,
                statusToFilter
        );

        List<Long> categoryIds = resolveCategoryHierarchy(publicFilter.categoryId());
        Specification<Product> spec = ProductSpecification.filter(publicFilter, categoryIds);
        Page<Product> productPage = productRepository.findAll(spec, pageable);

        return PageResponse.of(productPage.map(productMapper::toResponse));
    }

    @Transactional(readOnly = true)
    public PageResponse<ProductResponse> getProductsAdmin(ProductFilterRequest filter, Pageable pageable) {
        log.debug("Admin lấy danh sách sản phẩm với bộ lọc: {}", filter);

        List<Long> categoryIds = filter != null ? resolveCategoryHierarchy(filter.categoryId()) : null;
        Specification<Product> spec = ProductSpecification.filter(filter, categoryIds);
        Page<Product> productPage = productRepository.findAll(spec, pageable);

        return PageResponse.of(productPage.map(productMapper::toResponse));
    }

    @Transactional(readOnly = true)
    public ProductResponse getBySlug(String slug) {
        log.debug("Lấy chi tiết sản phẩm theo slug: {}", slug);
        Product product = productRepository.findWithCategoryBySlugAndDeletedAtIsNull(slug)
                .orElseThrow(() -> new AppException(ErrorCode.PRODUCT_NOT_FOUND));

        if (product.getStatus() == ProductStatus.INACTIVE) {
            throw new AppException(ErrorCode.PRODUCT_NOT_FOUND);
        }

        return productMapper.toResponse(product);
    }

    @Transactional(readOnly = true)
    public ProductResponse getById(Long id) {
        log.debug("Admin lấy chi tiết sản phẩm theo ID: {}", id);
        Product product = productRepository.findWithCategoryByIdAndDeletedAtIsNull(id)
                .orElseThrow(() -> new AppException(ErrorCode.PRODUCT_NOT_FOUND));

        return productMapper.toResponse(product);
    }

    @Transactional
    public ProductResponse createProduct(ProductRequest request) {
        log.info("Tạo sản phẩm mới: {}", request.name());

        validatePrice(request);

        Category category = categoryRepository.findById(request.categoryId())
                .orElseThrow(() -> new AppException(ErrorCode.CATEGORY_NOT_FOUND));

        String baseSlug = SlugUtils.toSlug(request.name());
        String uniqueSlug = generateUniqueSlug(baseSlug, null);

        ProductStatus status = request.status() != null ? request.status() : ProductStatus.ACTIVE;
        if (request.stock() == 0 && status == ProductStatus.ACTIVE) {
            status = ProductStatus.OUT_OF_STOCK;
        }

        Product product = new Product(
                category,
                request.name(),
                uniqueSlug,
                request.shortDescription(),
                request.description(),
                request.price(),
                request.originalPrice(),
                request.stock(),
                request.thumbnailUrl(),
                status
        );

        Product savedProduct = productRepository.save(product);
        log.info("Đã tạo sản phẩm thành công với ID: {}, slug: {}", savedProduct.getId(), savedProduct.getSlug());
        return productMapper.toResponse(savedProduct);
    }

    @Transactional
    public ProductResponse updateProduct(Long id, ProductRequest request) {
        log.info("Cập nhật sản phẩm ID: {}", id);

        Product product = productRepository.findByIdAndDeletedAtIsNull(id)
                .orElseThrow(() -> new AppException(ErrorCode.PRODUCT_NOT_FOUND));

        validatePrice(request);

        Category category = categoryRepository.findById(request.categoryId())
                .orElseThrow(() -> new AppException(ErrorCode.CATEGORY_NOT_FOUND));

        if (!product.getName().equals(request.name())) {
            String baseSlug = SlugUtils.toSlug(request.name());
            String uniqueSlug = generateUniqueSlug(baseSlug, id);
            product.setSlug(uniqueSlug);
        }

        product.setCategory(category);
        product.setName(request.name());
        product.setShortDescription(request.shortDescription());
        product.setDescription(request.description());
        product.setPrice(request.price());
        product.setOriginalPrice(request.originalPrice());
        product.setStock(request.stock());
        product.setThumbnailUrl(request.thumbnailUrl());

        if (request.status() != null) {
            product.setStatus(request.status());
        }

        Product updatedProduct = productRepository.save(product);
        log.info("Đã cập nhật sản phẩm thành công với ID: {}", updatedProduct.getId());
        return productMapper.toResponse(updatedProduct);
    }

    @Transactional
    public ProductResponse updateStock(Long id, Integer stock) {
        log.info("Cập nhật tồn kho sản phẩm ID: {} thành {}", id, stock);

        if (stock == null || stock < 0) {
            throw new AppException(ErrorCode.INVALID_STOCK);
        }

        Product product = productRepository.findByIdAndDeletedAtIsNull(id)
                .orElseThrow(() -> new AppException(ErrorCode.PRODUCT_NOT_FOUND));

        product.setStock(stock);

        if (stock == 0 && product.getStatus() == ProductStatus.ACTIVE) {
            product.setStatus(ProductStatus.OUT_OF_STOCK);
        } else if (stock > 0 && product.getStatus() == ProductStatus.OUT_OF_STOCK) {
            product.setStatus(ProductStatus.ACTIVE);
        }

        Product updatedProduct = productRepository.save(product);
        return productMapper.toResponse(updatedProduct);
    }

    @Transactional
    public void deleteProduct(Long id) {
        log.info("Xóa mềm sản phẩm ID: {}", id);

        Product product = productRepository.findByIdAndDeletedAtIsNull(id)
                .orElseThrow(() -> new AppException(ErrorCode.PRODUCT_NOT_FOUND));

        product.softDelete();
        productRepository.save(product);
        log.info("Đã xóa mềm sản phẩm ID: {} thành công", id);
    }

    private void validatePrice(ProductRequest request) {
        if (request.originalPrice() != null && request.price().compareTo(request.originalPrice()) > 0) {
            throw new AppException(ErrorCode.INVALID_PRICE);
        }
    }

    private String generateUniqueSlug(String baseSlug, Long excludeId) {
        String slug = baseSlug;
        int count = 1;
        while (excludeId == null ? productRepository.existsBySlug(slug)
                : productRepository.existsBySlugAndIdNot(slug, excludeId)) {
            slug = baseSlug + "-" + count++;
        }
        return slug;
    }

    private List<Long> resolveCategoryHierarchy(Long categoryId) {
        if (categoryId == null) {
            return null;
        }

        Category category = categoryRepository.findById(categoryId)
                .orElseThrow(() -> new AppException(ErrorCode.CATEGORY_NOT_FOUND));

        List<Long> categoryIds = new ArrayList<>();
        categoryIds.add(category.getId());

        if (category.getChildren() != null && !category.getChildren().isEmpty()) {
            for (Category child : category.getChildren()) {
                categoryIds.add(child.getId());
            }
        }

        return categoryIds;
    }
}
