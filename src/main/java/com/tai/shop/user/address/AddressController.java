package com.tai.shop.user.address;

import com.tai.shop.common.dto.ApiResponse;
import com.tai.shop.user.address.dto.AddressRequest;
import com.tai.shop.user.address.dto.AddressResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/v1/users/me/addresses")
@RequiredArgsConstructor
@SecurityRequirement(name = "bearerAuth")
@Tag(name = "User Address", description = "APIs quản lý sổ địa chỉ nhận hàng cá nhân")
public class AddressController {

    private final AddressService addressService;

    @GetMapping
    @Operation(summary = "Lấy danh sách địa chỉ nhận hàng của người dùng hiện tại")
    public ResponseEntity<ApiResponse<List<AddressResponse>>> getAddresses(
            @AuthenticationPrincipal UserDetails userDetails) {
        List<AddressResponse> addresses = addressService.getUserAddresses(userDetails.getUsername());
        return ResponseEntity.ok(ApiResponse.success(addresses));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Lấy chi tiết một địa chỉ nhận hàng theo ID")
    public ResponseEntity<ApiResponse<AddressResponse>> getAddressById(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable Long id) {
        AddressResponse address = addressService.getAddressById(userDetails.getUsername(), id);
        return ResponseEntity.ok(ApiResponse.success(address));
    }

    @PostMapping
    @Operation(summary = "Thêm mới địa chỉ nhận hàng")
    public ResponseEntity<ApiResponse<AddressResponse>> createAddress(
            @AuthenticationPrincipal UserDetails userDetails,
            @Valid @RequestBody AddressRequest request) {
        AddressResponse response = addressService.createAddress(userDetails.getUsername(), request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Thêm địa chỉ mới thành công", response));
    }

    @PutMapping("/{id}")
    @Operation(summary = "Cập nhật thông tin địa chỉ nhận hàng")
    public ResponseEntity<ApiResponse<AddressResponse>> updateAddress(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable Long id,
            @Valid @RequestBody AddressRequest request) {
        AddressResponse response = addressService.updateAddress(userDetails.getUsername(), id, request);
        return ResponseEntity.ok(ApiResponse.success("Cập nhật địa chỉ thành công", response));
    }

    @PatchMapping("/{id}/default")
    @Operation(summary = "Đặt một địa chỉ làm địa chỉ mặc định")
    public ResponseEntity<ApiResponse<AddressResponse>> setDefaultAddress(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable Long id) {
        AddressResponse response = addressService.setDefaultAddress(userDetails.getUsername(), id);
        return ResponseEntity.ok(ApiResponse.success("Đặt địa chỉ mặc định thành công", response));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Xóa địa chỉ nhận hàng")
    public ResponseEntity<ApiResponse<Void>> deleteAddress(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable Long id) {
        addressService.deleteAddress(userDetails.getUsername(), id);
        return ResponseEntity.ok(ApiResponse.success("Xóa địa chỉ thành công", null));
    }
}
