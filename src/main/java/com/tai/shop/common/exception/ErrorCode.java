package com.tai.shop.common.exception;

import lombok.Getter;
import org.springframework.http.HttpStatus;

/**
 * Mã lỗi nghiệp vụ. Mỗi code gắn với HTTP status và message mặc định.
 * Thêm code mới khi từng tính năng cần (F01, F02...).
 */
@Getter
public enum ErrorCode {

    // ===== Chung =====
    INTERNAL_ERROR(HttpStatus.INTERNAL_SERVER_ERROR, "Lỗi hệ thống, vui lòng thử lại sau"),
    VALIDATION_ERROR(HttpStatus.BAD_REQUEST, "Dữ liệu không hợp lệ"),
    RESOURCE_NOT_FOUND(HttpStatus.NOT_FOUND, "Không tìm thấy tài nguyên"),
    ACCESS_DENIED(HttpStatus.FORBIDDEN, "Bạn không có quyền thực hiện thao tác này"),
    UNAUTHORIZED(HttpStatus.UNAUTHORIZED, "Bạn cần đăng nhập để thực hiện thao tác này"),

    // ===== F01, F02: Auth & User =====
    EMAIL_ALREADY_EXISTS(HttpStatus.CONFLICT, "Email đã được sử dụng"),
    INVALID_CREDENTIALS(HttpStatus.UNAUTHORIZED, "Email hoặc mật khẩu không chính xác"),
    USER_NOT_FOUND(HttpStatus.NOT_FOUND, "Không tìm thấy người dùng"),
    USER_DISABLED(HttpStatus.FORBIDDEN, "Tài khoản đã bị khóa hoặc chưa kích hoạt"),
    REFRESH_TOKEN_EXPIRED(HttpStatus.UNAUTHORIZED, "Refresh token đã hết hạn"),
    REFRESH_TOKEN_INVALID(HttpStatus.UNAUTHORIZED, "Refresh token không hợp lệ hoặc đã bị thu hồi"),

    // ===== F03: Category =====
    CATEGORY_NOT_FOUND(HttpStatus.NOT_FOUND, "Không tìm thấy danh mục"),
    CATEGORY_SLUG_ALREADY_EXISTS(HttpStatus.CONFLICT, "Slug danh mục đã tồn tại"),
    CATEGORY_PARENT_INVALID(HttpStatus.BAD_REQUEST, "Danh mục cha không hợp lệ hoặc gây vòng lặp"),

    // ===== F04: Product =====
    PRODUCT_NOT_FOUND(HttpStatus.NOT_FOUND, "Không tìm thấy sản phẩm"),
    PRODUCT_SLUG_ALREADY_EXISTS(HttpStatus.CONFLICT, "Slug sản phẩm đã tồn tại"),
    INVALID_PRICE(HttpStatus.BAD_REQUEST, "Giá bán không thể lớn hơn giá gốc"),
    INVALID_STOCK(HttpStatus.BAD_REQUEST, "Số lượng tồn kho không hợp lệ");


    private final HttpStatus httpStatus;
    private final String message;

    ErrorCode(HttpStatus httpStatus, String message) {
        this.httpStatus = httpStatus;
        this.message = message;
    }
}
