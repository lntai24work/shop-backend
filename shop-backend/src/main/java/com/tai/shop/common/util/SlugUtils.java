package com.tai.shop.common.util;

import java.text.Normalizer;
import java.util.Locale;
import java.util.regex.Pattern;

public final class SlugUtils {

    private static final Pattern NON_LATIN = Pattern.compile("[^\\w-]");
    private static final Pattern WHITESPACE = Pattern.compile("[\\s]+");
    private static final Pattern MULTIPLE_HYPHENS = Pattern.compile("-+");

    private SlugUtils() {
    }

    public static String toSlug(String input) {
        if (input == null || input.isBlank()) {
            return "";
        }

        String normalized = input.trim();

        // Thay thế ký tự đ, Đ đặc thù trong tiếng Việt
        normalized = normalized.replace("đ", "d").replace("Đ", "d");

        // Chuẩn hóa NFD để tách dấu thanh
        normalized = Normalizer.normalize(normalized, Normalizer.Form.NFD);
        normalized = Pattern.compile("\\p{InCombiningDiacriticalMarks}+").matcher(normalized).replaceAll("");

        // Thay khoảng trắng bằng dấu gạch ngang
        normalized = WHITESPACE.matcher(normalized).replaceAll("-");

        // Loại bỏ ký tự không phải chữ cái, số, hoặc gạch ngang
        normalized = NON_LATIN.matcher(normalized).replaceAll("");

        // Gộp nhiều dấu gạch ngang liền nhau thành một
        normalized = MULTIPLE_HYPHENS.matcher(normalized).replaceAll("-");

        // Loại bỏ gạch ngang ở đầu và cuối chuỗi
        normalized = normalized.replaceAll("^-|-$", "");

        return normalized.toLowerCase(Locale.ROOT);
    }
}
