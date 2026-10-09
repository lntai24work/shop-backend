package com.tai.shop.catalog.product.image;

import com.tai.shop.catalog.product.image.dto.ProductImageResponse;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

import java.util.List;

@Mapper(componentModel = "spring")
public interface ProductImageMapper {

    @Mapping(target = "isThumbnail", source = "thumbnail")
    ProductImageResponse toResponse(ProductImage image);

    List<ProductImageResponse> toResponseList(List<ProductImage> images);
}
