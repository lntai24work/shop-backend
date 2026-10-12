package com.tai.shop;

import com.tai.shop.support.AbstractIntegrationTest;
import org.junit.jupiter.api.Test;

/**
 * Kiểm tra Spring context load được với Testcontainers MySQL thật.
 */
class ShopApplicationTests extends AbstractIntegrationTest {

    @Test
    void contextLoads() {
        // Nếu không throw exception thì context load thành công
    }
}
