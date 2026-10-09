package com.tai.shop.storage;

import org.springframework.web.multipart.MultipartFile;

public interface StorageService {

    /**
     * Upload ảnh lên hệ thống lưu trữ đám mây.
     *
     * @param file   tệp ảnh MultipartFile
     * @param folder thư mục lưu trữ trên cloud (ví dụ: "shop/products", "shop/avatars")
     * @return UploadResult chứa URL công khai và publicId để quản lý/xóa
     */
    UploadResult uploadImage(MultipartFile file, String folder);

    /**
     * Xóa ảnh khỏi hệ thống lưu trữ đám mây.
     *
     * @param publicId định danh công khai của ảnh trên cloud
     */
    void deleteImage(String publicId);
}
