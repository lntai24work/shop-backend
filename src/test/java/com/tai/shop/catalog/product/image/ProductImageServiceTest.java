package com.tai.shop.catalog.product.image;

import com.tai.shop.catalog.category.Category;
import com.tai.shop.catalog.product.Product;
import com.tai.shop.catalog.product.ProductRepository;
import com.tai.shop.catalog.product.ProductStatus;
import com.tai.shop.catalog.product.image.dto.ProductImageResponse;
import com.tai.shop.common.exception.AppException;
import com.tai.shop.common.exception.ErrorCode;
import com.tai.shop.storage.StorageService;
import com.tai.shop.storage.UploadResult;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.web.multipart.MultipartFile;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyList;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class ProductImageServiceTest {

    @Mock
    private ProductRepository productRepository;

    @Mock
    private ProductImageRepository productImageRepository;

    @Mock
    private ProductImageMapper productImageMapper;

    @Mock
    private StorageService storageService;

    @InjectMocks
    private ProductImageService productImageService;

    private Product product;
    private ProductImage productImage;

    @BeforeEach
    void setUp() {
        Category category = new Category("Áo Thun Nam", "ao-thun-nam", "Áo thun", null);
        category.setId(4L);

        product = new Product(
                category,
                "Áo Thun Nam Basic",
                "ao-thun-nam-basic",
                "Mô tả ngắn",
                "Mô tả chi tiết",
                new BigDecimal("199000.00"),
                new BigDecimal("250000.00"),
                100,
                null,
                ProductStatus.ACTIVE
        );
        product.setId(1L);

        productImage = new ProductImage(
                product,
                "https://res.cloudinary.com/test/image/upload/v1/img1.jpg",
                "shop/products/img1",
                0,
                true
        );
        productImage.setId(10L);
    }

    @Test
    @DisplayName("uploadImages: should upload files and set first as thumbnail when product has no thumbnail")
    void uploadImages_success_shouldSaveImagesAndSetThumbnail() {
        MockMultipartFile file1 = new MockMultipartFile("files", "img1.jpg", "image/jpeg", "image content 1".getBytes());
        UploadResult uploadResult = new UploadResult("https://res.cloudinary.com/test/image/upload/v1/img1.jpg", "shop/products/img1");
        ProductImageResponse responseDto = new ProductImageResponse(10L, uploadResult.url(), uploadResult.publicId(), 0, true, null);

        when(productRepository.findByIdAndDeletedAtIsNull(1L)).thenReturn(Optional.of(product));
        when(productImageRepository.findByProductIdOrderByDisplayOrderAsc(1L)).thenReturn(List.of());
        when(storageService.uploadImage(any(MultipartFile.class), anyString())).thenReturn(uploadResult);
        when(productImageRepository.saveAll(anyList())).thenReturn(List.of(productImage));
        when(productImageMapper.toResponseList(anyList())).thenReturn(List.of(responseDto));

        List<ProductImageResponse> results = productImageService.uploadImages(1L, List.of(file1));

        assertThat(results).hasSize(1);
        assertThat(product.getThumbnailUrl()).isEqualTo("https://res.cloudinary.com/test/image/upload/v1/img1.jpg");
        verify(productRepository).save(product);
        verify(productImageRepository).saveAll(anyList());
    }

    @Test
    @DisplayName("uploadImages: should throw AppException when files list is empty")
    void uploadImages_emptyFiles_shouldThrowAppException() {
        assertThatThrownBy(() -> productImageService.uploadImages(1L, List.of()))
                .isInstanceOf(AppException.class)
                .hasFieldOrPropertyWithValue("errorCode", ErrorCode.FILE_EMPTY);
    }

    @Test
    @DisplayName("uploadImages: should throw AppException when product not found")
    void uploadImages_productNotFound_shouldThrowAppException() {
        MockMultipartFile file1 = new MockMultipartFile("files", "img1.jpg", "image/jpeg", "img".getBytes());
        when(productRepository.findByIdAndDeletedAtIsNull(999L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> productImageService.uploadImages(999L, List.of(file1)))
                .isInstanceOf(AppException.class)
                .hasFieldOrPropertyWithValue("errorCode", ErrorCode.PRODUCT_NOT_FOUND);
    }

    @Test
    @DisplayName("deleteImage: should delete image and call storage delete")
    void deleteImage_existingImage_shouldDeleteAndCallStorage() {
        when(productRepository.findByIdAndDeletedAtIsNull(1L)).thenReturn(Optional.of(product));
        when(productImageRepository.findByIdAndProductId(10L, 1L)).thenReturn(Optional.of(productImage));

        productImageService.deleteImage(1L, 10L);

        verify(productImageRepository).delete(productImage);
        verify(storageService).deleteImage("shop/products/img1");
    }

    @Test
    @DisplayName("setThumbnail: should update thumbnail for product and images")
    void setThumbnail_existingImage_shouldUpdateThumbnail() {
        ProductImageResponse responseDto = new ProductImageResponse(10L, productImage.getImageUrl(), productImage.getPublicId(), 0, true, null);

        when(productRepository.findByIdAndDeletedAtIsNull(1L)).thenReturn(Optional.of(product));
        when(productImageRepository.findByIdAndProductId(10L, 1L)).thenReturn(Optional.of(productImage));
        when(productImageRepository.findByProductIdOrderByDisplayOrderAsc(1L)).thenReturn(List.of(productImage));
        when(productImageMapper.toResponse(productImage)).thenReturn(responseDto);

        ProductImageResponse result = productImageService.setThumbnail(1L, 10L);

        assertThat(result).isNotNull();
        assertThat(product.getThumbnailUrl()).isEqualTo(productImage.getImageUrl());
        verify(productRepository).save(product);
    }
}
