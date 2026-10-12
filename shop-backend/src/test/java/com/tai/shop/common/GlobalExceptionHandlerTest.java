package com.tai.shop.common;

import com.tai.shop.common.exception.AppException;
import com.tai.shop.common.exception.ErrorCode;
import com.tai.shop.common.exception.GlobalExceptionHandler;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Unit test GlobalExceptionHandler bằng standaloneSetup — không phụ thuộc Boot test slice.
 * Dùng standaloneSetup thay @WebMvcTest vì Boot 4 thay đổi cách đăng ký @ControllerAdvice trong slice test.
 */
class GlobalExceptionHandlerTest {

    private MockMvc mockMvc;

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders
                .standaloneSetup(new TestController())
                .setControllerAdvice(new GlobalExceptionHandler())
                .build();
    }

    // ===== Controller giả để trigger exception =====

    @RestController
    @RequestMapping("/test")
    static class TestController {

        @PostMapping("/app-exception")
        void throwAppException() {
            throw new AppException(ErrorCode.RESOURCE_NOT_FOUND);
        }

        @PostMapping("/validation")
        void throwValidation(@Valid @RequestBody DummyRequest req) {
        }

        record DummyRequest(
                @NotBlank(message = "Tên không được để trống") String name,
                @Email(message = "Email không hợp lệ") @NotBlank(message = "Email không được để trống") String email
        ) {
        }
    }

    // ===== Test cases =====

    @Test
    void throwAppException_returnsCorrectFormat() throws Exception {
        mockMvc.perform(post("/test/app-exception"))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.message").value(ErrorCode.RESOURCE_NOT_FOUND.getMessage()))
                .andExpect(jsonPath("$.data").doesNotExist());
    }

    @Test
    void validationError_returnsCorrectFormat() throws Exception {
        String body = """
                {"name": "", "email": "not-an-email"}
                """;
        mockMvc.perform(post("/test/validation")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.message").isNotEmpty());
    }
}
