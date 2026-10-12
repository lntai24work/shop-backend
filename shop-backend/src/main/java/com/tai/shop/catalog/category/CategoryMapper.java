package com.tai.shop.catalog.category;

import com.tai.shop.catalog.category.dto.CategoryResponse;
import com.tai.shop.catalog.category.dto.CategoryTreeResponse;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

import java.util.List;

@Mapper(componentModel = "spring")
public interface CategoryMapper {

    @Mapping(target = "parentId", source = "parent.id")
    @Mapping(target = "parentName", source = "parent.name")
    CategoryResponse toCategoryResponse(Category category);

    List<CategoryResponse> toCategoryResponseList(List<Category> categories);

    @Mapping(target = "children", source = "children")
    CategoryTreeResponse toCategoryTreeResponse(Category category);

    List<CategoryTreeResponse> toCategoryTreeResponseList(List<Category> categories);
}
