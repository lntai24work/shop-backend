package com.tai.shop.catalog.product;

import com.tai.shop.auth.dto.LoginRequest;
import com.tai.shop.auth.dto.RegisterRequest;
import com.tai.shop.catalog.product.dto.ProductRequest;
import com.tai.shop.catalog.product.dto.UpdateStockRequest;
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

import java.math.BigDecimal;

import static org.hamcrest.Matchers.greaterThanOrEqualTo;
import static org.hamcrest.Matchers.is;
import static org.hamcrest.Matchers.notNullValue;
import static org.springframework.security.test.web.servlet.setup.SecurityMockMvcConfigurers.springSecurity;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

class ProductIntegrationTest extends AbstractIntegrationTest {

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
                "produser@shop.com",
                "password123",
                "Product User",
                "0977777777"
        );
        MvcResult userResult = mockMvc.perform(post("/api/v1/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(userRegister)))
                .andReturn();

        if (userResult.getResponse().getStatus() == 201) {
            userToken = com.jayway.jsonpath.JsonPath.read(userResult.getResponse().getContentAsString(), "$.data.accessToken");
        } else {
            LoginRequest userLogin = new LoginRequest("produser@shop.com", "password123");
            MvcResult loginRes = mockMvc.perform(post("/api/v1/auth/login")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(userLogin)))
                    .andReturn();
            userToken = com.jayway.jsonpath.JsonPath.read(loginRes.getResponse().getContentAsString(), "$.data.accessToken");
        }
    }

    @Test
    @DisplayName("GET /api/v1/products: public access, should return paginated products")
    void getProducts_public_shouldReturnPaginatedProducts() throws Exception {
        mockMvc.perform(get("/api/v1/products"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.data.content", notNullValue()))
                .andExpect(jsonPath("$.data.content.length()", is(12)))
                .andExpect(jsonPath("$.data.totalElements", greaterThanOrEqualTo(16)))
                .andExpect(jsonPath("$.data.page", is(0)))
                .andExpect(jsonPath("$.data.size", is(12)));
    }

    @Test
    @DisplayName("GET /api/v1/products?keyword=cotton: should filter products by keyword")
    void getProducts_filterByKeyword_shouldReturnMatching() throws Exception {
        mockMvc.perform(get("/api/v1/products")
                        .param("keyword", "cotton"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.data.content.length()", greaterThanOrEqualTo(1)));
    }

    @Test
    @DisplayName("GET /api/v1/products?categoryId=1: should filter products by parent category and children")
    void getProducts_filterByParentCategory_shouldReturnProducts() throws Exception {
        mockMvc.perform(get("/api/v1/products")
                        .param("categoryId", "1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.data.content.length()", greaterThanOrEqualTo(5)));
    }

    @Test
    @DisplayName("GET /api/v1/products?minPrice=200000&maxPrice=400000: should filter products by price range")
    void getProducts_filterByPriceRange_shouldReturnMatching() throws Exception {
        mockMvc.perform(get("/api/v1/products")
                        .param("minPrice", "200000")
                        .param("maxPrice", "400000"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.data.content.length()", greaterThanOrEqualTo(1)));
    }

    @Test
    @DisplayName("GET /api/v1/products/{slug}: public access, should return product details")
    void getBySlug_public_shouldReturnProduct() throws Exception {
        mockMvc.perform(get("/api/v1/products/ao-thun-nam-co-tron-cotton-compact-basic"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.data.name", is("Áo Thun Nam Cổ Tròn Cotton Compact Basic")))
                .andExpect(jsonPath("$.data.categoryName", is("Áo thun Nam")));
    }

    @Test
    @DisplayName("GET /api/v1/products/{slug}: non-existent slug should return 404")
    void getBySlug_notFound_shouldReturn404() throws Exception {
        mockMvc.perform(get("/api/v1/products/san-pham-khong-ton-tai"))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.success", is(false)));
    }

    @Test
    @DisplayName("POST /api/v1/admin/products: without token should return 401")
    void createProduct_withoutToken_shouldReturn401() throws Exception {
        ProductRequest request = new ProductRequest(
                4L,
                "Áo Khoác Nam Bomber",
                "Mô tả ngắn",
                "Mô tả chi tiết",
                new BigDecimal("450000.00"),
                new BigDecimal("600000.00"),
                30,
                "thumb.jpg",
                ProductStatus.ACTIVE
        );

        mockMvc.perform(post("/api/v1/admin/products")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @DisplayName("POST /api/v1/admin/products: with USER token should return 403")
    void createProduct_withUserToken_shouldReturn403() throws Exception {
        ProductRequest request = new ProductRequest(
                4L,
                "Áo Khoác Nam Bomber",
                "Mô tả ngắn",
                "Mô tả chi tiết",
                new BigDecimal("450000.00"),
                new BigDecimal("600000.00"),
                30,
                "thumb.jpg",
                ProductStatus.ACTIVE
        );

        mockMvc.perform(post("/api/v1/admin/products")
                        .header("Authorization", "Bearer " + userToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("POST /api/v1/admin/products: with ADMIN token should create product successfully")
    void createProduct_withAdminToken_shouldReturn201() throws Exception {
        ProductRequest request = new ProductRequest(
                4L,
                "Áo Khoác Nam Bomber Kaki 2 Lớp",
                "Áo khoác bomber kaki thời thượng",
                "Chất vải kaki dày dặn chống gió tốt",
                new BigDecimal("450000.00"),
                new BigDecimal("600000.00"),
                30,
                "https://example.com/bomber.jpg",
                ProductStatus.ACTIVE
        );

        mockMvc.perform(post("/api/v1/admin/products")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.data.name", is("Áo Khoác Nam Bomber Kaki 2 Lớp")))
                .andExpect(jsonPath("$.data.slug", is("ao-khoac-nam-bomber-kaki-2-lop")))
                .andExpect(jsonPath("$.data.stock", is(30)));
    }

    @Test
    @DisplayName("PUT /api/v1/admin/products/{id}: with ADMIN token should update product")
    void updateProduct_withAdminToken_shouldReturn200() throws Exception {
        // Tạo sản phẩm tạm để cập nhật
        ProductRequest createReq = new ProductRequest(
                4L,
                "Áo Hoodie Unisex Nỉ Bông",
                "Áo hoodie form rộng",
                "Chất nỉ bông ấm áp",
                new BigDecimal("320000.00"),
                new BigDecimal("400000.00"),
                20,
                "hoodie.jpg",
                ProductStatus.ACTIVE
        );
        MvcResult createRes = mockMvc.perform(post("/api/v1/admin/products")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(createReq)))
                .andExpect(status().isCreated())
                .andReturn();

        Integer createdId = com.jayway.jsonpath.JsonPath.read(createRes.getResponse().getContentAsString(), "$.data.id");

        ProductRequest updateReq = new ProductRequest(
                4L,
                "Áo Hoodie Unisex Nỉ Bông Có Mũ Premium",
                "Áo hoodie form rộng cao cấp",
                "Chất nỉ bông ấm áp phiên bản nâng cấp",
                new BigDecimal("350000.00"),
                new BigDecimal("420000.00"),
                25,
                "hoodie-premium.jpg",
                ProductStatus.ACTIVE
        );

        mockMvc.perform(put("/api/v1/admin/products/" + createdId)
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(updateReq)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.data.name", is("Áo Hoodie Unisex Nỉ Bông Có Mũ Premium")))
                .andExpect(jsonPath("$.data.slug", is("ao-hoodie-unisex-ni-bong-co-mu-premium")));
    }

    @Test
    @DisplayName("PATCH /api/v1/admin/products/{id}/stock: should update stock and auto change status")
    void updateStock_withAdminToken_shouldUpdateStock() throws Exception {
        // Tạo sản phẩm tạm để cập nhật tồn kho
        ProductRequest createReq = new ProductRequest(
                4L,
                "Áo Khoác Jean Nam Denim",
                "Áo khoác bò",
                "Vải denim xịn",
                new BigDecimal("500000.00"),
                new BigDecimal("650000.00"),
                15,
                "denim.jpg",
                ProductStatus.ACTIVE
        );
        MvcResult createRes = mockMvc.perform(post("/api/v1/admin/products")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(createReq)))
                .andExpect(status().isCreated())
                .andReturn();

        Integer createdId = com.jayway.jsonpath.JsonPath.read(createRes.getResponse().getContentAsString(), "$.data.id");

        // Cập nhật tồn kho về 0 -> kiểm tra status đổi thành OUT_OF_STOCK
        UpdateStockRequest stockReq = new UpdateStockRequest(0);
        mockMvc.perform(patch("/api/v1/admin/products/" + createdId + "/stock")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(stockReq)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.data.stock", is(0)))
                .andExpect(jsonPath("$.data.status", is("OUT_OF_STOCK")));
    }

    @Test
    @DisplayName("DELETE /api/v1/admin/products/{id}: with ADMIN token should soft delete product")
    void deleteProduct_withAdminToken_shouldSoftDelete() throws Exception {
        // Tạo sản phẩm tạm để xóa
        ProductRequest createReq = new ProductRequest(
                4L,
                "Sản phẩm tạm xóa",
                "Mô tả",
                "Chi tiết",
                new BigDecimal("100000.00"),
                new BigDecimal("150000.00"),
                10,
                "temp.jpg",
                ProductStatus.ACTIVE
        );
        MvcResult createRes = mockMvc.perform(post("/api/v1/admin/products")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(createReq)))
                .andExpect(status().isCreated())
                .andReturn();

        Integer createdId = com.jayway.jsonpath.JsonPath.read(createRes.getResponse().getContentAsString(), "$.data.id");
        String slug = com.jayway.jsonpath.JsonPath.read(createRes.getResponse().getContentAsString(), "$.data.slug");

        mockMvc.perform(delete("/api/v1/admin/products/" + createdId)
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)));

        // Sau khi xóa mềm, public query slug phải trả về 404
        mockMvc.perform(get("/api/v1/products/" + slug))
                .andExpect(status().isNotFound());
    }
}
