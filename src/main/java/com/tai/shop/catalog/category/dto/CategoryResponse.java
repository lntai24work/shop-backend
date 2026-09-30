package com.tai.shop.catalog.category.dto;

import com.tai.shop.catalog.category.CategoryStatus;

public record CategoryResponse(
        Long id,
        String name,
        String slug,
        String description,
        String imageUrl,
        Long parentId,
        String parentName,
        CategoryStatus status,
        Integer displayOrder
) {}
