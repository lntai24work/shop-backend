package com.tai.shop.user.address;

import com.tai.shop.user.address.dto.AddressResponse;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

import java.util.List;

@Mapper(componentModel = "spring")
public interface AddressMapper {

    @Mapping(target = "isDefault", source = "default")
    AddressResponse toResponse(Address address);

    List<AddressResponse> toResponseList(List<Address> addresses);
}
