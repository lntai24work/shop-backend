package com.tai.shop.catalog.product.image;

import com.tai.shop.auth.dto.LoginRequest;
import com.tai.shop.auth.dto.RegisterRequest;
import com.tai.shop.catalog.product.dto.ProductRequest;
import com.tai.shop.catalog.product.ProductStatus;
import com.tai.shop.storage.StorageService;
import com.tai.shop.storage.UploadResult;
import com.tai.shop.support.AbstractIntegrationTest;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.web.context.WebApplicationContext;
import tools.jackson.databind.ObjectMapper;

import java.math.BigDecimal;

import static org.hamcrest.Matchers.greaterThanOrEqualTo;
import static org.hamcrest.Matchers.is;
import static org.hamcrest.Matchers.notNullValue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.when;
import static org.springframework.security.test.web.servlet.setup.SecurityMockMvcConfigurers.springSecurity;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.multipart;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

class ProductImageIntegrationTest extends AbstractIntegrationTest {

    @Autowired
    private WebApplicationContext context;

    @MockitoBean
    private StorageService storageService;

    private MockMvc mockMvc;
    private final ObjectMapper objectMapper = new ObjectMapper();

    private String adminToken;
    private String userToken;
    private Long testProductId;
    private String testProductSlug;

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
                "imguser@shop.com",
                "password123",
                "Image User",
                "0966666666"
        );
        MvcResult userResult = mockMvc.perform(post("/api/v1/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(userRegister)))
                .andReturn();

        if (userResult.getResponse().getStatus() == 201) {
            userToken = com.jayway.jsonpath.JsonPath.read(userResult.getResponse().getContentAsString(), "$.data.accessToken");
        } else {
            LoginRequest userLogin = new LoginRequest("imguser@shop.com", "password123");
            MvcResult loginRes = mockMvc.perform(post("/api/v1/auth/login")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(userLogin)))
                    .andReturn();
            userToken = com.jayway.jsonpath.JsonPath.read(loginRes.getResponse().getContentAsString(), "$.data.accessToken");
        }

        // Tạo sản phẩm mẫu cho test ảnh
        ProductRequest productReq = new ProductRequest(
                4L,
                "Áo Test Ảnh Upload " + System.currentTimeMillis(),
                "Mô tả ngắn",
                "Mô tả chi tiết",
                new BigDecimal("250000.00"),
                new BigDecimal("300000.00"),
                20,
                null,
                ProductStatus.ACTIVE
        );
        MvcResult prodRes = mockMvc.perform(post("/api/v1/admin/products")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(productReq)))
                .andExpect(status().isCreated())
                .andReturn();

        Integer prodIdInt = com.jayway.jsonpath.JsonPath.read(prodRes.getResponse().getContentAsString(), "$.data.id");
        testProductId = prodIdInt.longValue();
        testProductSlug = com.jayway.jsonpath.JsonPath.read(prodRes.getResponse().getContentAsString(), "$.data.slug");
    }

    @Test
    @DisplayName("POST /api/v1/admin/products/{id}/images: without token should return 401")
    void uploadImages_withoutToken_shouldReturn401() throws Exception {
        MockMultipartFile file = new MockMultipartFile("files", "test.jpg", "image/jpeg", "content".getBytes());

        mockMvc.perform(multipart("/api/v1/admin/products/" + testProductId + "/images")
                        .file(file))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @DisplayName("POST /api/v1/admin/products/{id}/images: with USER token should return 403")
    void uploadImages_withUserToken_shouldReturn403() throws Exception {
        MockMultipartFile file = new MockMultipartFile("files", "test.jpg", "image/jpeg", "content".getBytes());

        mockMvc.perform(multipart("/api/v1/admin/products/" + testProductId + "/images")
                        .file(file)
                        .header("Authorization", "Bearer " + userToken))
                .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("POST /api/v1/admin/products/{id}/images: with ADMIN token should upload images and update thumbnail")
    void uploadImages_withAdminToken_shouldReturn201() throws Exception {
        MockMultipartFile file1 = new MockMultipartFile("files", "img1.png", "image/png", "img content 1".getBytes());
        MockMultipartFile file2 = new MockMultipartFile("files", "img2.png", "image/png", "img content 2".getBytes());

        when(storageService.uploadImage(any(), anyString()))
                .thenReturn(new UploadResult("https://res.cloudinary.com/test/img1.png", "shop/products/img1"))
                .thenReturn(new UploadResult("https://res.cloudinary.com/test/img2.png", "shop/products/img2"));

        mockMvc.perform(multipart("/api/v1/admin/products/" + testProductId + "/images")
                        .file(file1)
                        .file(file2)
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.data", notNullValue()))
                .andExpect(jsonPath("$.data.length()", is(2)))
                .andExpect(jsonPath("$.data[0].isThumbnail", is(true)))
                .andExpect(jsonPath("$.data[1].isThumbnail", is(false)));

        // Kiểm tra xem public GET sản phẩm theo slug có trả về kèm images không
        mockMvc.perform(get("/api/v1/products/" + testProductSlug))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.data.images.length()", is(2)))
                .andExpect(jsonPath("$.data.thumbnailUrl", is("https://res.cloudinary.com/test/img1.png")));
    }

    @Test
    @DisplayName("PATCH /api/v1/admin/products/{id}/images/{imageId}/thumbnail: should set new thumbnail")
    void setThumbnail_withAdminToken_shouldUpdateThumbnail() throws Exception {
        MockMultipartFile file1 = new MockMultipartFile("files", "img1.png", "image/png", "content".getBytes());
        MockMultipartFile file2 = new MockMultipartFile("files", "img2.png", "image/png", "content".getBytes());

        when(storageService.uploadImage(any(), anyString()))
                .thenReturn(new UploadResult("https://res.cloudinary.com/test/img1.png", "shop/products/img1"))
                .thenReturn(new UploadResult("https://res.cloudinary.com/test/img2.png", "shop/products/img2"));

        MvcResult uploadRes = mockMvc.perform(multipart("/api/v1/admin/products/" + testProductId + "/images")
                        .file(file1)
                        .file(file2)
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isCreated())
                .andReturn();

        Integer secondImageId = com.jayway.jsonpath.JsonPath.read(uploadRes.getResponse().getContentAsString(), "$.data[1].id");

        mockMvc.perform(patch("/api/v1/admin/products/" + testProductId + "/images/" + secondImageId + "/thumbnail")
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.data.isThumbnail", is(true)))
                .andExpect(jsonPath("$.data.imageUrl", is("https://res.cloudinary.com/test/img2.png")));
    }

    @Test
    @DisplayName("DELETE /api/v1/admin/products/{id}/images/{imageId}: should delete image")
    void deleteImage_withAdminToken_shouldDeleteSuccessfully() throws Exception {
        MockMultipartFile file1 = new MockMultipartFile("files", "img1.png", "image/png", "content".getBytes());

        when(storageService.uploadImage(any(), anyString()))
                .thenReturn(new UploadResult("https://res.cloudinary.com/test/img1.png", "shop/products/img1"));

        MvcResult uploadRes = mockMvc.perform(multipart("/api/v1/admin/products/" + testProductId + "/images")
                        .file(file1)
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isCreated())
                .andReturn();

        Integer imageId = com.jayway.jsonpath.JsonPath.read(uploadRes.getResponse().getContentAsString(), "$.data[0].id");

        mockMvc.perform(delete("/api/v1/admin/products/" + testProductId + "/images/" + imageId)
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)));
    }
}
