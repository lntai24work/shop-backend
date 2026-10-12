package com.tai.shop.storage;

import com.cloudinary.Cloudinary;
import com.cloudinary.utils.ObjectUtils;
import com.tai.shop.common.exception.AppException;
import com.tai.shop.common.exception.ErrorCode;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.List;
import java.util.Map;

@Slf4j
@Service
@RequiredArgsConstructor
public class CloudinaryStorageService implements StorageService {

    private static final long MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
    private static final List<String> ALLOWED_CONTENT_TYPES = List.of(
            "image/jpeg",
            "image/png",
            "image/webp"
    );

    private final Cloudinary cloudinary;

    @Override
    public UploadResult uploadImage(MultipartFile file, String folder) {
        validateImageFile(file);

        try {
            log.info("Bắt đầu upload file '{}' vào thư mục Cloudinary '{}'", file.getOriginalFilename(), folder);
            Map<?, ?> uploadParams = ObjectUtils.asMap(
                    "folder", folder,
                    "resource_type", "image"
            );

            Map<?, ?> result = cloudinary.uploader().upload(file.getBytes(), uploadParams);
            String secureUrl = (String) result.get("secure_url");
            String publicId = (String) result.get("public_id");

            log.info("Upload ảnh thành công lên Cloudinary. Public ID: {}, URL: {}", publicId, secureUrl);
            return new UploadResult(secureUrl, publicId);
        } catch (IOException e) {
            log.error("Lỗi khi upload ảnh lên Cloudinary: {}", e.getMessage(), e);
            throw new AppException(ErrorCode.IMAGE_UPLOAD_FAILED);
        }
    }

    @Override
    public void deleteImage(String publicId) {
        if (!StringUtils.hasText(publicId)) {
            return;
        }

        try {
            log.info("Bắt đầu xóa ảnh trên Cloudinary với publicId: {}", publicId);
            Map<?, ?> result = cloudinary.uploader().destroy(publicId, ObjectUtils.asMap("resource_type", "image"));
            log.info("Kết quả xóa ảnh trên Cloudinary: {}", result);
        } catch (IOException e) {
            log.error("Lỗi khi xóa ảnh trên Cloudinary với publicId {}: {}", publicId, e.getMessage(), e);
            // Không ngắt luồng nếu xóa cloud lỗi, chỉ log lại để tránh block transaction DB
        }
    }

    private void validateImageFile(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new AppException(ErrorCode.FILE_EMPTY);
        }

        if (file.getSize() > MAX_FILE_SIZE) {
            throw new AppException(ErrorCode.FILE_TOO_LARGE);
        }

        String contentType = file.getContentType();
        if (contentType == null || !ALLOWED_CONTENT_TYPES.contains(contentType.toLowerCase())) {
            throw new AppException(ErrorCode.INVALID_FILE_FORMAT);
        }
    }
}
