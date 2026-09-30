package com.tai.shop.catalog.category;

import com.tai.shop.catalog.category.dto.CategoryRequest;
import com.tai.shop.catalog.category.dto.CategoryResponse;
import com.tai.shop.catalog.category.dto.CategoryTreeResponse;
import com.tai.shop.common.exception.AppException;
import com.tai.shop.common.exception.ErrorCode;
import com.tai.shop.common.util.SlugUtils;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class CategoryService {

    private final CategoryRepository categoryRepository;
    private final CategoryMapper categoryMapper;

    @Transactional(readOnly = true)
    public List<CategoryTreeResponse> getCategoryTree() {
        List<Category> rootCategories = categoryRepository.findActiveRootCategoriesWithChildren();
        return categoryMapper.toCategoryTreeResponseList(rootCategories);
    }

    @Transactional(readOnly = true)
    public CategoryResponse getBySlug(String slug) {
        Category category = categoryRepository.findBySlug(slug)
                .orElseThrow(() -> new AppException(ErrorCode.CATEGORY_NOT_FOUND));
        return categoryMapper.toCategoryResponse(category);
    }

    @Transactional(readOnly = true)
    public CategoryResponse getById(Long id) {
        Category category = categoryRepository.findById(id)
                .orElseThrow(() -> new AppException(ErrorCode.CATEGORY_NOT_FOUND));
        return categoryMapper.toCategoryResponse(category);
    }

    @Transactional(readOnly = true)
    public List<CategoryResponse> getAllForAdmin() {
        List<Category> categories = categoryRepository.findAllByOrderByDisplayOrderAsc();
        return categoryMapper.toCategoryResponseList(categories);
    }

    @Transactional
    public CategoryResponse createCategory(CategoryRequest request) {
        String slug;
        if (StringUtils.hasText(request.slug())) {
            slug = SlugUtils.toSlug(request.slug());
            if (categoryRepository.existsBySlug(slug)) {
                throw new AppException(ErrorCode.CATEGORY_SLUG_ALREADY_EXISTS);
            }
        } else {
            slug = generateUniqueSlug(request.name(), null);
        }

        Category parent = null;
        if (request.parentId() != null) {
            parent = categoryRepository.findById(request.parentId())
                    .orElseThrow(() -> new AppException(ErrorCode.CATEGORY_NOT_FOUND, "Không tìm thấy danh mục cha"));
        }

        Category category = new Category();
        category.setName(request.name().trim());
        category.setSlug(slug);
        category.setDescription(request.description());
        category.setImageUrl(request.imageUrl());
        category.setDisplayOrder(request.displayOrder() != null ? request.displayOrder() : 0);
        category.setStatus(request.status() != null ? request.status() : CategoryStatus.ACTIVE);
        category.setParent(parent);

        category = categoryRepository.save(category);
        log.info("Created new category: id={}, name={}, slug={}", category.getId(), category.getName(), category.getSlug());

        return categoryMapper.toCategoryResponse(category);
    }

    @Transactional
    public CategoryResponse updateCategory(Long id, CategoryRequest request) {
        Category category = categoryRepository.findById(id)
                .orElseThrow(() -> new AppException(ErrorCode.CATEGORY_NOT_FOUND));

        String slug;
        if (StringUtils.hasText(request.slug())) {
            slug = SlugUtils.toSlug(request.slug());
        } else {
            slug = SlugUtils.toSlug(request.name());
        }

        if (categoryRepository.existsBySlugAndIdNot(slug, id)) {
            throw new AppException(ErrorCode.CATEGORY_SLUG_ALREADY_EXISTS);
        }

        if (request.parentId() != null) {
            if (request.parentId().equals(id)) {
                throw new AppException(ErrorCode.CATEGORY_PARENT_INVALID, "Danh mục không thể chọn chính nó làm danh mục cha");
            }
            Category parent = categoryRepository.findById(request.parentId())
                    .orElseThrow(() -> new AppException(ErrorCode.CATEGORY_NOT_FOUND, "Không tìm thấy danh mục cha"));

            if (isDescendant(category, parent)) {
                throw new AppException(ErrorCode.CATEGORY_PARENT_INVALID, "Danh mục cha không thể là danh mục con của chính nó");
            }
            category.setParent(parent);
        } else {
            category.setParent(null);
        }

        category.setName(request.name().trim());
        category.setSlug(slug);
        category.setDescription(request.description());
        category.setImageUrl(request.imageUrl());
        if (request.displayOrder() != null) {
            category.setDisplayOrder(request.displayOrder());
        }
        if (request.status() != null) {
            category.setStatus(request.status());
        }

        category = categoryRepository.save(category);
        log.info("Updated category: id={}, name={}, slug={}", category.getId(), category.getName(), category.getSlug());

        return categoryMapper.toCategoryResponse(category);
    }

    @Transactional
    public void deleteCategory(Long id) {
        Category category = categoryRepository.findById(id)
                .orElseThrow(() -> new AppException(ErrorCode.CATEGORY_NOT_FOUND));

        category.softDelete();
        categoryRepository.save(category);
        log.info("Soft deleted category id={}", id);
    }

    public String generateUniqueSlug(String name, Long currentId) {
        String baseSlug = SlugUtils.toSlug(name);
        if (baseSlug.isBlank()) {
            baseSlug = "category";
        }
        String slug = baseSlug;
        int counter = 1;
        while (currentId == null ? categoryRepository.existsBySlug(slug) : categoryRepository.existsBySlugAndIdNot(slug, currentId)) {
            slug = baseSlug + "-" + counter;
            counter++;
        }
        return slug;
    }

    private boolean isDescendant(Category category, Category potentialParent) {
        Category current = potentialParent;
        while (current != null) {
            if (current.getId() != null && current.getId().equals(category.getId())) {
                return true;
            }
            current = current.getParent();
        }
        return false;
    }
}
