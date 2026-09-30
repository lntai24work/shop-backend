package com.tai.shop.common.exception;

import lombok.Getter;

/**
 * Exception nghiệp vụ duy nhất. Ném AppException(ErrorCode.XXX) thay vì dùng nhiều loại exception.
 * GlobalExceptionHandler sẽ bắt và trả về response JSON chuẩn.
 */
@Getter
public class AppException extends RuntimeException {

    private final ErrorCode errorCode;

    public AppException(ErrorCode errorCode) {
        super(errorCode.getMessage());
        this.errorCode = errorCode;
    }

    public AppException(ErrorCode errorCode, String customMessage) {
        super(customMessage);
        this.errorCode = errorCode;
    }
}
