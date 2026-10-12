package com.tai.shop.user.address;

import com.tai.shop.auth.dto.LoginRequest;
import com.tai.shop.auth.dto.RegisterRequest;
import com.tai.shop.support.AbstractIntegrationTest;
import com.tai.shop.user.address.dto.AddressRequest;
import com.tai.shop.user.dto.ChangePasswordRequest;
import com.tai.shop.user.dto.UpdateProfileRequest;
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

class AddressIntegrationTest extends AbstractIntegrationTest {

    @Autowired
    private WebApplicationContext context;

    private MockMvc mockMvc;
    private final ObjectMapper objectMapper = new ObjectMapper();

    private String userAEmail;
    private String userAToken;
    private String userBToken;

    @BeforeEach
    void setUp() throws Exception {
        mockMvc = MockMvcBuilders
                .webAppContextSetup(context)
                .apply(springSecurity())
                .build();

        long timestamp = System.nanoTime();

        // Đăng ký và lấy token User A
        userAEmail = "usera_" + timestamp + "@shop.com";
        RegisterRequest userAReq = new RegisterRequest(
                userAEmail,
                "password123",
                "User A",
                "0911111111"
        );
        MvcResult resA = mockMvc.perform(post("/api/v1/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(userAReq)))
                .andExpect(status().isCreated())
                .andReturn();
        userAToken = com.jayway.jsonpath.JsonPath.read(resA.getResponse().getContentAsString(), "$.data.accessToken");

        // Đăng ký và lấy token User B
        String userBEmail = "userb_" + timestamp + "@shop.com";
        RegisterRequest userBReq = new RegisterRequest(
                userBEmail,
                "password123",
                "User B",
                "0922222222"
        );
        MvcResult resB = mockMvc.perform(post("/api/v1/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(userBReq)))
                .andExpect(status().isCreated())
                .andReturn();
        userBToken = com.jayway.jsonpath.JsonPath.read(resB.getResponse().getContentAsString(), "$.data.accessToken");
    }

    @Test
    @DisplayName("GET /api/v1/users/me/addresses: without token should return 401")
    void getAddresses_withoutToken_shouldReturn401() throws Exception {
        mockMvc.perform(get("/api/v1/users/me/addresses"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @DisplayName("Address Management: User A creates addresses, default address management, and ownership isolation")
    void addressFlow_successAndOwnershipIsolation() throws Exception {
        // 1. User A tạo địa chỉ đầu tiên -> tự động là default
        AddressRequest addr1 = new AddressRequest("User A - Nhà riêng", "0911111111", "Hà Nội", "Cầu Giấy", "Dịch Vọng", "Số 1", false);
        MvcResult createRes1 = mockMvc.perform(post("/api/v1/users/me/addresses")
                        .header("Authorization", "Bearer " + userAToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(addr1)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.data.isDefault", is(true)))
                .andReturn();

        Integer addr1Id = com.jayway.jsonpath.JsonPath.read(createRes1.getResponse().getContentAsString(), "$.data.id");

        // 2. User A tạo địa chỉ thứ hai với isDefault = true -> địa chỉ 2 thành default, địa chỉ 1 mất default
        AddressRequest addr2 = new AddressRequest("User A - Cơ quan", "0911111111", "Hà Nội", "Ba Đình", "Kim Mã", "Số 2", true);
        MvcResult createRes2 = mockMvc.perform(post("/api/v1/users/me/addresses")
                        .header("Authorization", "Bearer " + userAToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(addr2)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.data.isDefault", is(true)))
                .andReturn();

        Integer addr2Id = com.jayway.jsonpath.JsonPath.read(createRes2.getResponse().getContentAsString(), "$.data.id");

        // 3. User B cố tình truy cập địa chỉ của User A -> nhận 404
        mockMvc.perform(get("/api/v1/users/me/addresses/" + addr1Id)
                        .header("Authorization", "Bearer " + userBToken))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.success", is(false)));

        // 4. User B cố tình sửa địa chỉ của User A -> nhận 404
        mockMvc.perform(put("/api/v1/users/me/addresses/" + addr1Id)
                        .header("Authorization", "Bearer " + userBToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(addr1)))
                .andExpect(status().isNotFound());

        // 5. User B cố tình xóa địa chỉ của User A -> nhận 404
        mockMvc.perform(delete("/api/v1/users/me/addresses/" + addr1Id)
                        .header("Authorization", "Bearer " + userBToken))
                .andExpect(status().isNotFound());

        // 6. User A chuyển default lại cho địa chỉ 1
        mockMvc.perform(patch("/api/v1/users/me/addresses/" + addr1Id + "/default")
                        .header("Authorization", "Bearer " + userAToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.data.isDefault", is(true)));

        // 7. User A xóa địa chỉ 1 (đang là default) -> địa chỉ 2 tự động được đẩy lên làm default
        mockMvc.perform(delete("/api/v1/users/me/addresses/" + addr1Id)
                        .header("Authorization", "Bearer " + userAToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)));

        mockMvc.perform(get("/api/v1/users/me/addresses/" + addr2Id)
                        .header("Authorization", "Bearer " + userAToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.isDefault", is(true)));
    }

    @Test
    @DisplayName("User Profile & Password Update Flow")
    void userProfileAndChangePasswordFlow() throws Exception {
        // 1. Cập nhật profile
        UpdateProfileRequest profileReq = new UpdateProfileRequest("User A VIP", "0988888888");
        mockMvc.perform(put("/api/v1/users/me")
                        .header("Authorization", "Bearer " + userAToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(profileReq)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.data.fullName", is("User A VIP")))
                .andExpect(jsonPath("$.data.phone", is("0988888888")));

        // 2. Đổi mật khẩu với sai mật khẩu cũ -> 400
        ChangePasswordRequest wrongOldPassReq = new ChangePasswordRequest("wrongOldPass", "newSecret123", "newSecret123");
        mockMvc.perform(put("/api/v1/users/me/password")
                        .header("Authorization", "Bearer " + userAToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(wrongOldPassReq)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.success", is(false)));

        // 3. Đổi mật khẩu thành công
        ChangePasswordRequest validChangePassReq = new ChangePasswordRequest("password123", "newSecret123", "newSecret123");
        mockMvc.perform(put("/api/v1/users/me/password")
                        .header("Authorization", "Bearer " + userAToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(validChangePassReq)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)));

        // 4. Đăng nhập lại với mật khẩu mới thành công
        LoginRequest newLoginReq = new LoginRequest(userAEmail, "newSecret123");
        mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(newLoginReq)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.data.accessToken", notNullValue()));
    }
}
