package com.tai.shop.auth;

import com.tai.shop.auth.dto.LoginRequest;
import com.tai.shop.auth.dto.RefreshTokenRequest;
import com.tai.shop.auth.dto.RegisterRequest;
import com.tai.shop.support.AbstractIntegrationTest;
import jakarta.servlet.http.Cookie;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.web.context.WebApplicationContext;
import tools.jackson.databind.ObjectMapper;

import static org.assertj.core.api.Assertions.assertThat;
import static org.hamcrest.Matchers.is;
import static org.hamcrest.Matchers.notNullValue;
import static org.springframework.security.test.web.servlet.setup.SecurityMockMvcConfigurers.springSecurity;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.cookie;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

class AuthIntegrationTest extends AbstractIntegrationTest {

    @Autowired
    private WebApplicationContext context;

    private MockMvc mockMvc;
    private final ObjectMapper objectMapper = new ObjectMapper();

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders
                .webAppContextSetup(context)
                .apply(springSecurity())
                .build();
    }

    @Test
    @DisplayName("POST /api/v1/auth/register: should return 201 Created, JWT token and HttpOnly cookie")
    void register_validUser_shouldReturn201() throws Exception {
        RegisterRequest request = new RegisterRequest(
                "newuser@shop.com",
                "password123",
                "New User",
                "0912345678"
        );

        mockMvc.perform(post("/api/v1/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.data.accessToken", notNullValue()))
                .andExpect(jsonPath("$.data.user.email", is("newuser@shop.com")))
                .andExpect(cookie().exists("refreshToken"))
                .andExpect(cookie().httpOnly("refreshToken", true));
    }

    @Test
    @DisplayName("POST /api/v1/auth/register: should return 409 Conflict when email exists")
    void register_duplicateEmail_shouldReturn409() throws Exception {
        RegisterRequest request = new RegisterRequest(
                "admin@shop.com",
                "password123",
                "Duplicate Admin",
                "0912345678"
        );

        mockMvc.perform(post("/api/v1/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.success", is(false)));
    }

    @Test
    @DisplayName("POST /api/v1/auth/register: should return 400 Bad Request when validation fails")
    void register_invalidData_shouldReturn400() throws Exception {
        RegisterRequest request = new RegisterRequest(
                "invalid-email",
                "123",
                "",
                "0912345678"
        );

        mockMvc.perform(post("/api/v1/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.success", is(false)));
    }

    @Test
    @DisplayName("POST /api/v1/auth/login: should return 200 OK and set refreshToken cookie")
    void login_adminUser_shouldReturn200() throws Exception {
        LoginRequest request = new LoginRequest("admin@shop.com", "admin123");

        mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.data.accessToken", notNullValue()))
                .andExpect(jsonPath("$.data.user.email", is("admin@shop.com")))
                .andExpect(cookie().exists("refreshToken"))
                .andExpect(cookie().httpOnly("refreshToken", true));
    }

    @Test
    @DisplayName("POST /api/v1/auth/login: should return 401 Unauthorized for wrong password")
    void login_wrongPassword_shouldReturn401() throws Exception {
        LoginRequest request = new LoginRequest("admin@shop.com", "wrongpassword");

        mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.success", is(false)));
    }

    @Test
    @DisplayName("POST /api/v1/auth/refresh: should rotate token and return new access token via cookie")
    void refresh_validCookie_shouldRotateAndReturnNewToken() throws Exception {
        LoginRequest loginRequest = new LoginRequest("admin@shop.com", "admin123");

        MvcResult loginResult = mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(loginRequest)))
                .andExpect(status().isOk())
                .andReturn();

        Cookie refreshCookie = loginResult.getResponse().getCookie("refreshToken");
        assertThat(refreshCookie).isNotNull();

        MvcResult refreshResult = mockMvc.perform(post("/api/v1/auth/refresh")
                        .cookie(refreshCookie))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.data.accessToken", notNullValue()))
                .andExpect(cookie().exists("refreshToken"))
                .andReturn();

        // Thử dùng lại token cũ -> phải bị từ chối 401 do reuse detection
        mockMvc.perform(post("/api/v1/auth/refresh")
                        .cookie(refreshCookie))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.success", is(false)));
    }

    @Test
    @DisplayName("POST /api/v1/auth/logout: should clear cookie and revoke refresh token")
    void logout_validCookie_shouldClearCookieAndRevokeToken() throws Exception {
        LoginRequest loginRequest = new LoginRequest("admin@shop.com", "admin123");

        MvcResult loginResult = mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(loginRequest)))
                .andExpect(status().isOk())
                .andReturn();

        Cookie refreshCookie = loginResult.getResponse().getCookie("refreshToken");
        assertThat(refreshCookie).isNotNull();

        // Logout
        mockMvc.perform(post("/api/v1/auth/logout")
                        .cookie(refreshCookie))
                .andExpect(status().isOk())
                .andExpect(cookie().maxAge("refreshToken", 0));

        // Sau khi logout, refresh bằng cookie cũ phải thất bại
        mockMvc.perform(post("/api/v1/auth/refresh")
                        .cookie(refreshCookie))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.success", is(false)));
    }

    @Test
    @DisplayName("GET /api/v1/users/me: should return user profile with valid access token")
    void getMe_withValidToken_shouldReturnProfile() throws Exception {
        LoginRequest loginRequest = new LoginRequest("admin@shop.com", "admin123");

        MvcResult loginResult = mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(loginRequest)))
                .andExpect(status().isOk())
                .andReturn();

        String responseBody = loginResult.getResponse().getContentAsString();
        String token = com.jayway.jsonpath.JsonPath.read(responseBody, "$.data.accessToken");

        mockMvc.perform(get("/api/v1/users/me")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.data.email", is("admin@shop.com")))
                .andExpect(jsonPath("$.data.fullName", is("Admin User")));
    }

    @Test
    @DisplayName("GET /api/v1/users/me: should return 401 without token")
    void getMe_withoutToken_shouldReturn401() throws Exception {
        mockMvc.perform(get("/api/v1/users/me"))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.success", is(false)));
    }

    @Test
    @DisplayName("GET /api/v1/admin/ping: should return 401 Unauthorized without token")
    void adminPing_withoutToken_shouldReturn401() throws Exception {
        mockMvc.perform(get("/api/v1/admin/ping"))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.success", is(false)));
    }

    @Test
    @DisplayName("GET /api/v1/admin/ping: should return 403 Forbidden with USER token")
    void adminPing_withUserToken_shouldReturn403() throws Exception {
        RegisterRequest registerRequest = new RegisterRequest(
                "regular@shop.com",
                "password123",
                "Regular User",
                "0912345678"
        );

        MvcResult result = mockMvc.perform(post("/api/v1/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(registerRequest)))
                .andExpect(status().isCreated())
                .andReturn();

        String responseBody = result.getResponse().getContentAsString();
        String token = com.jayway.jsonpath.JsonPath.read(responseBody, "$.data.accessToken");

        mockMvc.perform(get("/api/v1/admin/ping")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.success", is(false)));
    }

    @Test
    @DisplayName("GET /api/v1/admin/ping: should return 200 OK with ADMIN token")
    void adminPing_withAdminToken_shouldReturn200() throws Exception {
        LoginRequest loginRequest = new LoginRequest("admin@shop.com", "admin123");

        MvcResult result = mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(loginRequest)))
                .andExpect(status().isOk())
                .andReturn();

        String responseBody = result.getResponse().getContentAsString();
        String token = com.jayway.jsonpath.JsonPath.read(responseBody, "$.data.accessToken");

        mockMvc.perform(get("/api/v1/admin/ping")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.data", is("PONG")));
    }
}
