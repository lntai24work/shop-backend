package com.tai.shop.catalog.product.image;

import com.tai.shop.catalog.product.Product;
import com.tai.shop.catalog.product.ProductRepository;
import com.tai.shop.catalog.product.image.dto.ProductImageResponse;
import com.tai.shop.common.exception.AppException;
import com.tai.shop.common.exception.ErrorCode;
import com.tai.shop.storage.StorageService;
import com.tai.shop.storage.UploadResult;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.CollectionUtils;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

@Slf4j
@Service
@RequiredArgsConstructor
public class ProductImageService {

    private final ProductRepository productRepository;
    private final ProductImageRepository productImageRepository;
    private final ProductImageMapper productImageMapper;
    private final StorageService storageService;

    @Transactional(readOnly = true)
    public List<ProductImageResponse> getProductImages(Long productId) {
        log.debug("Lấy danh sách ảnh của sản phẩm ID: {}", productId);
        productRepository.findByIdAndDeletedAtIsNull(productId)
                .orElseThrow(() -> new AppException(ErrorCode.PRODUCT_NOT_FOUND));

        List<ProductImage> images = productImageRepository.findByProductIdOrderByDisplayOrderAsc(productId);
        return productImageMapper.toResponseList(images);
    }

    @Transactional
    public List<ProductImageResponse> uploadImages(Long productId, List<MultipartFile> files) {
        log.info("Upload ảnh cho sản phẩm ID: {}, số lượng file: {}", productId, files != null ? files.size() : 0);

        if (CollectionUtils.isEmpty(files)) {
            throw new AppException(ErrorCode.FILE_EMPTY);
        }

        Product product = productRepository.findByIdAndDeletedAtIsNull(productId)
                .orElseThrow(() -> new AppException(ErrorCode.PRODUCT_NOT_FOUND));

        List<ProductImage> existingImages = productImageRepository.findByProductIdOrderByDisplayOrderAsc(productId);
        int currentMaxOrder = existingImages.stream()
                .mapToInt(ProductImage::getDisplayOrder)
                .max()
                .orElse(-1);

        boolean hasThumbnail = existingImages.stream().anyMatch(ProductImage::isThumbnail)
                || StringUtils.hasText(product.getThumbnailUrl());

        List<ProductImage> newImages = new ArrayList<>();
        List<String> uploadedPublicIds = new ArrayList<>();

        try {
            for (MultipartFile file : files) {
                if (file == null || file.isEmpty()) {
                    continue;
                }

                UploadResult uploadResult = storageService.uploadImage(file, "shop/products/" + productId);
                uploadedPublicIds.add(uploadResult.publicId());

                boolean isThumbnail = !hasThumbnail && newImages.isEmpty() && existingImages.isEmpty();
                ProductImage image = new ProductImage(
                        product,
                        uploadResult.url(),
                        uploadResult.publicId(),
                        ++currentMaxOrder,
                        isThumbnail
                );

                newImages.add(image);

                if (isThumbnail) {
                    product.setThumbnailUrl(uploadResult.url());
                    hasThumbnail = true;
                }
            }

            if (newImages.isEmpty()) {
                throw new AppException(ErrorCode.FILE_EMPTY);
            }

            List<ProductImage> savedImages = productImageRepository.saveAll(newImages);
            productRepository.save(product);

            log.info("Đã upload và lưu thành công {} ảnh cho sản phẩm ID: {}", savedImages.size(), productId);
            return productImageMapper.toResponseList(savedImages);
        } catch (Exception e) {
            log.error("Lỗi khi xử lý lưu ảnh sản phẩm ID: {}. Bắt đầu dọn dẹp các ảnh đã upload trên cloud.", productId, e);
            for (String publicId : uploadedPublicIds) {
                try {
                    storageService.deleteImage(publicId);
                } catch (Exception ex) {
                    log.warn("Không thể xóa ảnh rác trên cloud với publicId {}: {}", publicId, ex.getMessage());
                }
            }
            throw e;
        }
    }

    @Transactional
    public void deleteImage(Long productId, Long imageId) {
        log.info("Xóa ảnh ID: {} của sản phẩm ID: {}", imageId, productId);

        Product product = productRepository.findByIdAndDeletedAtIsNull(productId)
                .orElseThrow(() -> new AppException(ErrorCode.PRODUCT_NOT_FOUND));

        ProductImage image = productImageRepository.findByIdAndProductId(imageId, productId)
                .orElseThrow(() -> new AppException(ErrorCode.PRODUCT_IMAGE_NOT_FOUND));

        String publicId = image.getPublicId();
        boolean wasThumbnail = image.isThumbnail();

        productImageRepository.delete(image);
        storageService.deleteImage(publicId);

        if (wasThumbnail) {
            Optional<ProductImage> nextThumbnail = productImageRepository.findFirstByProductIdOrderByDisplayOrderAsc(productId);
            if (nextThumbnail.isPresent()) {
                ProductImage newThumb = nextThumbnail.get();
                newThumb.setThumbnail(true);
                productImageRepository.save(newThumb);
                product.setThumbnailUrl(newThumb.getImageUrl());
            } else {
                product.setThumbnailUrl(null);
            }
            productRepository.save(product);
        }

        log.info("Đã xóa ảnh ID: {} của sản phẩm ID: {} thành công", imageId, productId);
    }

    @Transactional
    public ProductImageResponse setThumbnail(Long productId, Long imageId) {
        log.info("Đặt ảnh ID: {} làm thumbnail chính cho sản phẩm ID: {}", imageId, productId);

        Product product = productRepository.findByIdAndDeletedAtIsNull(productId)
                .orElseThrow(() -> new AppException(ErrorCode.PRODUCT_NOT_FOUND));

        ProductImage targetImage = productImageRepository.findByIdAndProductId(imageId, productId)
                .orElseThrow(() -> new AppException(ErrorCode.PRODUCT_IMAGE_NOT_FOUND));

        List<ProductImage> allImages = productImageRepository.findByProductIdOrderByDisplayOrderAsc(productId);
        for (ProductImage img : allImages) {
            img.setThumbnail(img.getId().equals(imageId));
        }

        productImageRepository.saveAll(allImages);

        product.setThumbnailUrl(targetImage.getImageUrl());
        productRepository.save(product);

        log.info("Đã đặt ảnh ID: {} làm thumbnail cho sản phẩm ID: {}", imageId, productId);
        return productImageMapper.toResponse(targetImage);
    }
}
