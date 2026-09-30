package com.tai.shop.catalog.category;

import com.tai.shop.auth.dto.LoginRequest;
import com.tai.shop.auth.dto.RegisterRequest;
import com.tai.shop.catalog.category.dto.CategoryRequest;
import com.tai.shop.support.AbstractIntegrationTest;
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

import static org.hamcrest.Matchers.greaterThanOrEqualTo;
import static org.hamcrest.Matchers.is;
import static org.hamcrest.Matchers.notNullValue;
import static org.springframework.security.test.web.servlet.setup.SecurityMockMvcConfigurers.springSecurity;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

class CategoryIntegrationTest extends AbstractIntegrationTest {

    @Autowired
    private WebApplicationContext context;

    private MockMvc mockMvc;
    private final ObjectMapper objectMapper = new ObjectMapper();

    private String adminToken;
    private String userToken;

    @BeforeEach
    void setUp() throws Exception {
        mockMvc = MockMvcBuilders
                .webAppContextSetup(context)
                .apply(springSecurity())
                .build();

        // Lấy admin token
        LoginRequest adminLogin = new LoginRequest("admin@shop.com", "admin123");
        MvcResult adminResult = mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(adminLogin)))
                .andExpect(status().isOk())
                .andReturn();
        adminToken = com.jayway.jsonpath.JsonPath.read(adminResult.getResponse().getContentAsString(), "$.data.accessToken");

        // Lấy user token
        RegisterRequest userRegister = new RegisterRequest(
                "catuser@shop.com",
                "password123",
                "Category User",
                "0988888888"
        );
        MvcResult userResult = mockMvc.perform(post("/api/v1/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(userRegister)))
                .andReturn();

        if (userResult.getResponse().getStatus() == 201) {
            userToken = com.jayway.jsonpath.JsonPath.read(userResult.getResponse().getContentAsString(), "$.data.accessToken");
        } else {
            LoginRequest userLogin = new LoginRequest("catuser@shop.com", "password123");
            MvcResult loginRes = mockMvc.perform(post("/api/v1/auth/login")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(userLogin)))
                    .andReturn();
            userToken = com.jayway.jsonpath.JsonPath.read(loginRes.getResponse().getContentAsString(), "$.data.accessToken");
        }
    }

    @Test
    @DisplayName("GET /api/v1/categories: public access, should return clothing categories tree")
    void getCategoryTree_public_shouldReturnTree() throws Exception {
        mockMvc.perform(get("/api/v1/categories"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.data", notNullValue()))
                .andExpect(jsonPath("$.data.length()", greaterThanOrEqualTo(3)))
                .andExpect(jsonPath("$.data[0].slug", is("thoi-trang-nam")))
                .andExpect(jsonPath("$.data[0].children.length()", greaterThanOrEqualTo(3)));
    }

    @Test
    @DisplayName("GET /api/v1/categories/{slug}: public access, should return category details")
    void getBySlug_public_shouldReturnCategory() throws Exception {
        mockMvc.perform(get("/api/v1/categories/thoi-trang-nam"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.data.name", is("Thời trang Nam")))
                .andExpect(jsonPath("$.data.slug", is("thoi-trang-nam")));
    }

    @Test
    @DisplayName("GET /api/v1/categories/{slug}: not found should return 404")
    void getBySlug_notFound_shouldReturn404() throws Exception {
        mockMvc.perform(get("/api/v1/categories/non-existent-slug"))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.success", is(false)));
    }

    @Test
    @DisplayName("POST /api/v1/admin/categories: without token should return 401")
    void createCategory_withoutToken_shouldReturn401() throws Exception {
        CategoryRequest request = new CategoryRequest("Giày dép", null, "Mô tả", null, null, 10, CategoryStatus.ACTIVE);

        mockMvc.perform(post("/api/v1/admin/categories")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @DisplayName("POST /api/v1/admin/categories: with USER token should return 403")
    void createCategory_withUserToken_shouldReturn403() throws Exception {
        CategoryRequest request = new CategoryRequest("Giày dép", null, "Mô tả", null, null, 10, CategoryStatus.ACTIVE);

        mockMvc.perform(post("/api/v1/admin/categories")
                        .header("Authorization", "Bearer " + userToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("POST /api/v1/admin/categories: with ADMIN token should create category")
    void createCategory_withAdminToken_shouldReturn201() throws Exception {
        CategoryRequest request = new CategoryRequest("Đồ lót & Đồ ngủ", null, "Đồ lót nam nữ", null, null, 5, CategoryStatus.ACTIVE);

        mockMvc.perform(post("/api/v1/admin/categories")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.data.name", is("Đồ lót & Đồ ngủ")))
                .andExpect(jsonPath("$.data.slug", is("do-lot-do-ngu")));
    }

    @Test
    @DisplayName("PUT /api/v1/admin/categories/{id}: with ADMIN token should update category")
    void updateCategory_withAdminToken_shouldReturn200() throws Exception {
        // Tạo category tạm thời để update
        CategoryRequest createReq = new CategoryRequest("Danh mục thử nghiệm", null, "Mô tả", null, null, 10, CategoryStatus.ACTIVE);
        MvcResult createRes = mockMvc.perform(post("/api/v1/admin/categories")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(createReq)))
                .andExpect(status().isCreated())
                .andReturn();

        Integer createdId = com.jayway.jsonpath.JsonPath.read(createRes.getResponse().getContentAsString(), "$.data.id");

        CategoryRequest updateReq = new CategoryRequest("Danh mục đã cập nhật", "danh-muc-da-cap-nhat", "Mô tả mới", null, null, 1, CategoryStatus.ACTIVE);

        mockMvc.perform(put("/api/v1/admin/categories/" + createdId)
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(updateReq)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.data.name", is("Danh mục đã cập nhật")))
                .andExpect(jsonPath("$.data.slug", is("danh-muc-da-cap-nhat")));
    }

    @Test
    @DisplayName("DELETE /api/v1/admin/categories/{id}: with ADMIN token should soft delete")
    void deleteCategory_withAdminToken_shouldReturn200() throws Exception {
        // Tạo category tạm thời để xóa
        CategoryRequest createReq = new CategoryRequest("Danh mục cần xóa", "danh-muc-can-xoa", "Mô tả", null, null, 99, CategoryStatus.ACTIVE);
        MvcResult createRes = mockMvc.perform(post("/api/v1/admin/categories")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(createReq)))
                .andExpect(status().isCreated())
                .andReturn();

        Integer createdId = com.jayway.jsonpath.JsonPath.read(createRes.getResponse().getContentAsString(), "$.data.id");

        mockMvc.perform(delete("/api/v1/admin/categories/" + createdId)
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)));

        // Sau khi xóa mềm, query theo slug phải trả về 404
        mockMvc.perform(get("/api/v1/categories/danh-muc-can-xoa"))
                .andExpect(status().isNotFound());
    }
}
