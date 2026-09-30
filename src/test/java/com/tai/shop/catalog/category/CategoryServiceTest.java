package com.tai.shop.catalog.category;

import com.tai.shop.catalog.category.dto.CategoryRequest;
import com.tai.shop.catalog.category.dto.CategoryResponse;
import com.tai.shop.catalog.category.dto.CategoryTreeResponse;
import com.tai.shop.common.exception.AppException;
import com.tai.shop.common.exception.ErrorCode;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class CategoryServiceTest {

    @Mock
    private CategoryRepository categoryRepository;

    @Mock
    private CategoryMapper categoryMapper;

    @InjectMocks
    private CategoryService categoryService;

    private Category parentCategory;
    private Category childCategory;

    @BeforeEach
    void setUp() {
        parentCategory = new Category("Thời trang Nam", "thoi-trang-nam", "Nam", null);
        parentCategory.setId(1L);

        childCategory = new Category("Áo thun Nam", "ao-thun-nam", "Áo thun", parentCategory);
        childCategory.setId(2L);
        parentCategory.getChildren().add(childCategory);
    }

    @Test
    @DisplayName("getCategoryTree: should return root categories tree")
    void getCategoryTree_shouldReturnHierarchy() {
        CategoryTreeResponse treeResponse = new CategoryTreeResponse(1L, "Thời trang Nam", "thoi-trang-nam", "Nam", null, 0, List.of());
        when(categoryRepository.findActiveRootCategoriesWithChildren()).thenReturn(List.of(parentCategory));
        when(categoryMapper.toCategoryTreeResponseList(List.of(parentCategory))).thenReturn(List.of(treeResponse));

        List<CategoryTreeResponse> result = categoryService.getCategoryTree();

        assertThat(result).hasSize(1);
        assertThat(result.get(0).name()).isEqualTo("Thời trang Nam");
    }

    @Test
    @DisplayName("getBySlug: should return CategoryResponse when exists")
    void getBySlug_existingSlug_shouldReturnCategory() {
        CategoryResponse response = new CategoryResponse(1L, "Thời trang Nam", "thoi-trang-nam", "Nam", null, null, null, CategoryStatus.ACTIVE, 0);
        when(categoryRepository.findBySlug("thoi-trang-nam")).thenReturn(Optional.of(parentCategory));
        when(categoryMapper.toCategoryResponse(parentCategory)).thenReturn(response);

        CategoryResponse result = categoryService.getBySlug("thoi-trang-nam");

        assertThat(result).isNotNull();
        assertThat(result.slug()).isEqualTo("thoi-trang-nam");
    }

    @Test
    @DisplayName("getBySlug: should throw AppException when not found")
    void getBySlug_notFound_shouldThrowAppException() {
        when(categoryRepository.findBySlug("not-found")).thenReturn(Optional.empty());

        assertThatThrownBy(() -> categoryService.getBySlug("not-found"))
                .isInstanceOf(AppException.class)
                .hasFieldOrPropertyWithValue("errorCode", ErrorCode.CATEGORY_NOT_FOUND);
    }

    @Test
    @DisplayName("createCategory: should auto generate unique slug when slug is empty")
    void createCategory_autoGenerateSlug_success() {
        CategoryRequest request = new CategoryRequest("Quần Jeans Nam", null, "Mô tả", null, null, 1, CategoryStatus.ACTIVE);
        CategoryResponse response = new CategoryResponse(3L, "Quần Jeans Nam", "quan-jeans-nam", "Mô tả", null, null, null, CategoryStatus.ACTIVE, 1);

        when(categoryRepository.existsBySlug("quan-jeans-nam")).thenReturn(false);
        when(categoryRepository.save(any(Category.class))).thenReturn(parentCategory);
        when(categoryMapper.toCategoryResponse(any(Category.class))).thenReturn(response);

        CategoryResponse result = categoryService.createCategory(request);

        assertThat(result).isNotNull();
        assertThat(result.name()).isEqualTo("Quần Jeans Nam");
        verify(categoryRepository).save(any(Category.class));
    }

    @Test
    @DisplayName("createCategory: should throw AppException when specified slug already exists")
    void createCategory_duplicateSlug_shouldThrowAppException() {
        CategoryRequest request = new CategoryRequest("Thời trang Nam", "thoi-trang-nam", "Mô tả", null, null, 1, CategoryStatus.ACTIVE);

        when(categoryRepository.existsBySlug("thoi-trang-nam")).thenReturn(true);

        assertThatThrownBy(() -> categoryService.createCategory(request))
                .isInstanceOf(AppException.class)
                .hasFieldOrPropertyWithValue("errorCode", ErrorCode.CATEGORY_SLUG_ALREADY_EXISTS);
    }

    @Test
    @DisplayName("updateCategory: should throw AppException when parentId is self")
    void updateCategory_selfParent_shouldThrowAppException() {
        CategoryRequest request = new CategoryRequest("Thời trang Nam", "thoi-trang-nam", "Mô tả", null, 1L, 1, CategoryStatus.ACTIVE);

        when(categoryRepository.findById(1L)).thenReturn(Optional.of(parentCategory));

        assertThatThrownBy(() -> categoryService.updateCategory(1L, request))
                .isInstanceOf(AppException.class)
                .hasFieldOrPropertyWithValue("errorCode", ErrorCode.CATEGORY_PARENT_INVALID);
    }

    @Test
    @DisplayName("updateCategory: should throw AppException when parent is child of current category")
    void updateCategory_circularParent_shouldThrowAppException() {
        CategoryRequest request = new CategoryRequest("Thời trang Nam", "thoi-trang-nam", "Mô tả", null, 2L, 1, CategoryStatus.ACTIVE);

        when(categoryRepository.findById(1L)).thenReturn(Optional.of(parentCategory));
        when(categoryRepository.findById(2L)).thenReturn(Optional.of(childCategory));

        assertThatThrownBy(() -> categoryService.updateCategory(1L, request))
                .isInstanceOf(AppException.class)
                .hasFieldOrPropertyWithValue("errorCode", ErrorCode.CATEGORY_PARENT_INVALID);
    }

    @Test
    @DisplayName("deleteCategory: should soft delete category")
    void deleteCategory_existingId_shouldSoftDelete() {
        when(categoryRepository.findById(1L)).thenReturn(Optional.of(parentCategory));

        categoryService.deleteCategory(1L);

        assertThat(parentCategory.isDeleted()).isTrue();
        verify(categoryRepository).save(parentCategory);
    }
}
