package com.tai.shop.common.dto;

import org.springframework.data.domain.Page;

import java.util.List;

/**
 * Bọc danh sách có phân trang.
 * Dùng: PageResponse.of(page) từ Spring Data Page<T>.
 */
public record PageResponse<T>(
        List<T> content,
        int page,
        int size,
        long totalElements,
        int totalPages,
        boolean last
) {
    public static <T> PageResponse<T> of(Page<T> page) {
        return new PageResponse<>(
                page.getContent(),
                page.getNumber(),
                page.getSize(),
                page.getTotalElements(),
                page.getTotalPages(),
                page.isLast()
        );
    }
}
