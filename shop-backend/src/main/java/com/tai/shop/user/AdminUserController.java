package com.tai.shop.user;

import com.tai.shop.common.dto.ApiResponse;
import com.tai.shop.common.dto.PageResponse;
import com.tai.shop.user.dto.AdminCreateUserRequest;
import com.tai.shop.user.dto.UpdateUserRolesRequest;
import com.tai.shop.user.dto.UpdateUserStatusRequest;
import com.tai.shop.user.dto.UserFilterRequest;
import com.tai.shop.user.dto.UserResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.ModelAttribute;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/admin/users")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
@SecurityRequirement(name = "bearerAuth")
@Tag(name = "User Management - Admin", description = "APIs quản trị người dùng hệ thống (Yêu cầu quyền ADMIN)")
public class AdminUserController {

    private final AdminUserService adminUserService;

    @GetMapping
    @Operation(summary = "Quản trị viên lấy danh sách người dùng có phân trang và bộ lọc",
            description = "Hỗ trợ tìm kiếm theo từ khóa (tên/email/SĐT), lọc theo vai trò (ROLE_ADMIN/ROLE_USER) và trạng thái (ACTIVE/BLOCKED)")
    public ResponseEntity<ApiResponse<PageResponse<UserResponse>>> getUsers(
            @ModelAttribute UserFilterRequest filter,
            @PageableDefault(size = 10, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {
        PageResponse<UserResponse> response = adminUserService.getUsers(filter, pageable);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Quản trị viên xem chi tiết người dùng theo ID")
    public ResponseEntity<ApiResponse<UserResponse>> getUserById(@PathVariable Long id) {
        UserResponse response = adminUserService.getUserById(id);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @PatchMapping("/{id}/status")
    @Operation(summary = "Cập nhật trạng thái người dùng (Khóa / Mở khóa)",
            description = "Admin không thể tự khóa tài khoản của chính mình")
    public ResponseEntity<ApiResponse<UserResponse>> updateUserStatus(
            @PathVariable Long id,
            @Valid @RequestBody UpdateUserStatusRequest request,
            @AuthenticationPrincipal UserDetails userDetails) {
        UserResponse response = adminUserService.updateUserStatus(id, request, userDetails.getUsername());
        return ResponseEntity.ok(ApiResponse.success("Cập nhật trạng thái người dùng thành công", response));
    }

    @PatchMapping("/{id}/roles")
    @Operation(summary = "Cập nhật vai trò / phân quyền người dùng",
            description = "Thăng cấp lên Admin hoặc hạ xuống Khách hàng. Admin không thể tự tước quyền của chính mình")
    public ResponseEntity<ApiResponse<UserResponse>> updateUserRoles(
            @PathVariable Long id,
            @Valid @RequestBody UpdateUserRolesRequest request,
            @AuthenticationPrincipal UserDetails userDetails) {
        UserResponse response = adminUserService.updateUserRoles(id, request, userDetails.getUsername());
        return ResponseEntity.ok(ApiResponse.success("Cập nhật vai trò người dùng thành công", response));
    }

    @PostMapping
    @Operation(summary = "Quản trị viên tạo tài khoản người dùng mới")
    public ResponseEntity<ApiResponse<UserResponse>> createUser(
            @Valid @RequestBody AdminCreateUserRequest request) {
        UserResponse response = adminUserService.createUser(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Tạo tài khoản người dùng thành công", response));
    }
}
