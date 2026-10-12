package com.tai.shop.common.util;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

class SlugUtilsTest {

    @Test
    @DisplayName("toSlug: should convert Vietnamese text with accents to slug")
    void toSlug_vietnameseText_shouldConvertCorrectly() {
        assertThat(SlugUtils.toSlug("Thời trang Nam")).isEqualTo("thoi-trang-nam");
        assertThat(SlugUtils.toSlug("Váy & Đầm Nữ")).isEqualTo("vay-dam-nu");
        assertThat(SlugUtils.toSlug("Áo sơ mi tay dài")).isEqualTo("ao-so-mi-tay-dai");
        assertThat(SlugUtils.toSlug("Đồng hồ & Phụ kiện")).isEqualTo("dong-ho-phu-kien");
    }

    @Test
    @DisplayName("toSlug: should remove special characters and collapse hyphens")
    void toSlug_specialCharacters_shouldHandleProperly() {
        assertThat(SlugUtils.toSlug("Quần Jeans @2026 -- New!")).isEqualTo("quan-jeans-2026-new");
        assertThat(SlugUtils.toSlug("  ---Áo khoác hoodie---  ")).isEqualTo("ao-khoac-hoodie");
    }

    @Test
    @DisplayName("toSlug: should return empty string for null or blank input")
    void toSlug_blankOrNull_shouldReturnEmpty() {
        assertThat(SlugUtils.toSlug(null)).isEqualTo("");
        assertThat(SlugUtils.toSlug("   ")).isEqualTo("");
    }
}
