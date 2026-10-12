package com.tai.shop.storage;

import com.cloudinary.Cloudinary;
import com.cloudinary.Uploader;
import com.tai.shop.common.exception.AppException;
import com.tai.shop.common.exception.ErrorCode;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.mock.web.MockMultipartFile;

import java.io.IOException;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyMap;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class CloudinaryStorageServiceTest {

    @Mock
    private Cloudinary cloudinary;

    @Mock
    private Uploader uploader;

    @InjectMocks
    private CloudinaryStorageService storageService;

    @BeforeEach
    void setUp() {
        // Mock uploader if needed in tests
    }

    @Test
    @DisplayName("uploadImage: should throw AppException when file is empty")
    void uploadImage_emptyFile_shouldThrowAppException() {
        MockMultipartFile emptyFile = new MockMultipartFile("file", "test.jpg", "image/jpeg", new byte[0]);

        assertThatThrownBy(() -> storageService.uploadImage(emptyFile, "folder"))
                .isInstanceOf(AppException.class)
                .hasFieldOrPropertyWithValue("errorCode", ErrorCode.FILE_EMPTY);
    }

    @Test
    @DisplayName("uploadImage: should throw AppException when file exceeds 5MB")
    void uploadImage_largeFile_shouldThrowAppException() {
        byte[] largeBytes = new byte[6 * 1024 * 1024]; // 6MB
        MockMultipartFile largeFile = new MockMultipartFile("file", "large.jpg", "image/jpeg", largeBytes);

        assertThatThrownBy(() -> storageService.uploadImage(largeFile, "folder"))
                .isInstanceOf(AppException.class)
                .hasFieldOrPropertyWithValue("errorCode", ErrorCode.FILE_TOO_LARGE);
    }

    @Test
    @DisplayName("uploadImage: should throw AppException when file format is invalid")
    void uploadImage_invalidFormat_shouldThrowAppException() {
        MockMultipartFile textFile = new MockMultipartFile("file", "test.txt", "text/plain", "hello".getBytes());

        assertThatThrownBy(() -> storageService.uploadImage(textFile, "folder"))
                .isInstanceOf(AppException.class)
                .hasFieldOrPropertyWithValue("errorCode", ErrorCode.INVALID_FILE_FORMAT);
    }

    @Test
    @DisplayName("uploadImage: should upload and return UploadResult when file is valid")
    void uploadImage_validFile_shouldReturnUploadResult() throws IOException {
        MockMultipartFile validFile = new MockMultipartFile("file", "photo.png", "image/png", "valid image content".getBytes());

        when(cloudinary.uploader()).thenReturn(uploader);
        when(uploader.upload(any(byte[].class), anyMap())).thenReturn(Map.of(
                "secure_url", "https://res.cloudinary.com/test/image/upload/v1/photo.png",
                "public_id", "shop/products/photo"
        ));

        UploadResult result = storageService.uploadImage(validFile, "shop/products");

        assertThat(result).isNotNull();
        assertThat(result.url()).isEqualTo("https://res.cloudinary.com/test/image/upload/v1/photo.png");
        assertThat(result.publicId()).isEqualTo("shop/products/photo");
    }

    @Test
    @DisplayName("deleteImage: should call Cloudinary destroy")
    void deleteImage_validPublicId_shouldCallCloudinary() throws IOException {
        when(cloudinary.uploader()).thenReturn(uploader);

        storageService.deleteImage("shop/products/photo");

        verify(uploader).destroy(eq("shop/products/photo"), anyMap());
    }
}
