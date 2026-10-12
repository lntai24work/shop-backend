package com.tai.shop.catalog.category.dto;

import java.util.List;

public record CategoryTreeResponse(
        Long id,
        String name,
        String slug,
        String description,
        String imageUrl,
        Integer displayOrder,
        List<CategoryTreeResponse> children
) {}
