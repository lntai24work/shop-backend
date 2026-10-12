package com.tai.shop.common.dto;

import com.fasterxml.jackson.annotation.JsonInclude;

/**
 * Bọc mọi response API theo dạng chuẩn:
 * { "success": true/false, "message": "...", "data": { ... } }
 */
@JsonInclude(JsonInclude.Include.NON_NULL)
public record ApiResponse<T>(
        boolean success,
        String message,
        T data
) {
    public static <T> ApiResponse<T> success(T data) {
        return new ApiResponse<>(true, null, data);
    }

    public static <T> ApiResponse<T> success(String message, T data) {
        return new ApiResponse<>(true, message, data);
    }

    public static <T> ApiResponse<T> error(String message) {
        return new ApiResponse<>(false, message, null);
    }
}
