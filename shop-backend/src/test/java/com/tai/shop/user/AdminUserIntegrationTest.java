package com.tai.shop.user;

import com.tai.shop.auth.dto.LoginRequest;
import com.tai.shop.auth.dto.RegisterRequest;
import com.tai.shop.support.AbstractIntegrationTest;
import com.tai.shop.user.dto.AdminCreateUserRequest;
import com.tai.shop.user.dto.UpdateUserRolesRequest;
import com.tai.shop.user.dto.UpdateUserStatusRequest;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.web.context.WebApplicationContext;
import tools.jackson.databind.JsonNode;
import tools.jackson.databind.ObjectMapper;

import java.util.Set;

import static org.hamcrest.Matchers.greaterThanOrEqualTo;
import static org.hamcrest.Matchers.hasItem;
import static org.hamcrest.Matchers.is;
import static org.springframework.security.test.web.servlet.setup.SecurityMockMvcConfigurers.springSecurity;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

class AdminUserIntegrationTest extends AbstractIntegrationTest {

    @Autowired
    private WebApplicationContext context;

    private MockMvc mockMvc;
    private final ObjectMapper objectMapper = new ObjectMapper();

    private String adminToken;
    private String userToken;
    private Long normalUserId;
    private String normalUserEmail;

    @BeforeEach
    void setUp() throws Exception {
        mockMvc = MockMvcBuilders
                .webAppContextSetup(context)
                .apply(springSecurity())
                .build();

        // 1. Lấy token Admin mặc định
        LoginRequest adminLogin = new LoginRequest("admin@shop.com", "admin123");
        MvcResult adminRes = mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(adminLogin)))
                .andExpect(status().isOk())
                .andReturn();

        JsonNode adminJson = objectMapper.readTree(adminRes.getResponse().getContentAsString());
        adminToken = adminJson.get("data").get("accessToken").asText();

        // 2. Tạo một user thường ngẫu nhiên
        long nano = System.nanoTime();
        normalUserEmail = "testuser_" + nano + "@shop.com";
        RegisterRequest registerReq = new RegisterRequest(
                normalUserEmail,
                "password123",
                "Normal Test User",
                "0912345678"
        );
        MvcResult regRes = mockMvc.perform(post("/api/v1/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(registerReq)))
                .andExpect(status().isCreated())
                .andReturn();

        JsonNode regJson = objectMapper.readTree(regRes.getResponse().getContentAsString());
        userToken = regJson.get("data").get("accessToken").asText();
        normalUserId = regJson.get("data").get("user").get("id").asLong();
    }

    @Test
    @DisplayName("GET /api/v1/admin/users: chưa đăng nhập phải trả về 401")
    void getUsers_unauthenticated_shouldReturn401() throws Exception {
        mockMvc.perform(get("/api/v1/admin/users"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @DisplayName("GET /api/v1/admin/users: user thường truy cập phải trả về 403")
    void getUsers_asUser_shouldReturn403() throws Exception {
        mockMvc.perform(get("/api/v1/admin/users")
                        .header("Authorization", "Bearer " + userToken))
                .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("GET /api/v1/admin/users: admin truy cập trả về danh sách phân trang 200")
    void getUsers_asAdmin_shouldReturn200() throws Exception {
        mockMvc.perform(get("/api/v1/admin/users")
                        .header("Authorization", "Bearer " + adminToken)
                        .param("page", "0")
                        .param("size", "10"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.content.length()", greaterThanOrEqualTo(2)))
                .andExpect(jsonPath("$.data.page", is(0)));
    }

    @Test
    @DisplayName("PATCH /api/v1/admin/users/{id}/status: admin khóa tài khoản user thành công")
    void updateUserStatus_blockUser_shouldSucceed() throws Exception {
        UpdateUserStatusRequest req = new UpdateUserStatusRequest(UserStatus.BLOCKED);

        mockMvc.perform(patch("/api/v1/admin/users/{id}/status", normalUserId)
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.status", is("BLOCKED")));

        // Kiểm tra user bị khóa không thể đăng nhập
        LoginRequest blockedLogin = new LoginRequest(normalUserEmail, "password123");
        mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(blockedLogin)))
                .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("PATCH /api/v1/admin/users/{id}/status: admin không thể tự khóa tài khoản của chính mình")
    void updateUserStatus_blockSelf_shouldReturn400() throws Exception {
        UpdateUserStatusRequest req = new UpdateUserStatusRequest(UserStatus.BLOCKED);

        // ID 1 là admin@shop.com
        mockMvc.perform(patch("/api/v1/admin/users/1/status")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message", is("Bạn không thể tự khóa tài khoản của chính mình")));
    }

    @Test
    @DisplayName("PATCH /api/v1/admin/users/{id}/roles: admin thăng cấp user thành ADMIN")
    void updateUserRoles_promoteToAdmin_shouldSucceed() throws Exception {
        UpdateUserRolesRequest req = new UpdateUserRolesRequest(Set.of("ROLE_ADMIN", "ROLE_USER"));

        mockMvc.perform(patch("/api/v1/admin/users/{id}/roles", normalUserId)
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.roles", hasItem("ROLE_ADMIN")));
    }

    @Test
    @DisplayName("POST /api/v1/admin/users: admin tạo người dùng mới thành công")
    void createUser_asAdmin_shouldReturn201() throws Exception {
        long nano = System.nanoTime();
        AdminCreateUserRequest req = new AdminCreateUserRequest(
                "created_" + nano + "@shop.com",
                "adminCreatedPw",
                "Admin Created Person",
                "0987654321",
                Set.of("ROLE_USER")
        );

        mockMvc.perform(post("/api/v1/admin/users")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.data.email", is(req.email())))
                .andExpect(jsonPath("$.data.fullName", is("Admin Created Person")));
    }
}
