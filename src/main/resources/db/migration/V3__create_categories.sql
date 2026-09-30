-- F03: Tạo bảng danh mục sản phẩm (categories)

CREATE TABLE categories (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    slug VARCHAR(120) NOT NULL UNIQUE,
    description TEXT NULL,
    image_url VARCHAR(255) NULL,
    parent_id BIGINT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    display_order INT NOT NULL DEFAULT 0,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL,
    INDEX idx_categories_slug (slug),
    INDEX idx_categories_parent_id (parent_id),
    INDEX idx_categories_status (status),
    CONSTRAINT fk_categories_parent FOREIGN KEY (parent_id) REFERENCES categories (id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Seed categories cho cửa hàng quần áo / thời trang
INSERT INTO categories (id, name, slug, description, parent_id, status, display_order) VALUES
(1, 'Thời trang Nam', 'thoi-trang-nam', 'Các sản phẩm thời trang dành riêng cho nam giới', NULL, 'ACTIVE', 1),
(2, 'Thời trang Nữ', 'thoi-trang-nu', 'Bộ sưu tập thời trang nữ thanh lịch và hiện đại', NULL, 'ACTIVE', 2),
(3, 'Phụ kiện', 'phu-kien', 'Phụ kiện thời trang cao cấp', NULL, 'ACTIVE', 3);

INSERT INTO categories (id, name, slug, description, parent_id, status, display_order) VALUES
(4, 'Áo thun Nam', 'ao-thun-nam', 'Áo thun cotton thoáng mát, đa dạng kiểu dáng', 1, 'ACTIVE', 1),
(5, 'Áo sơ mi Nam', 'ao-so-mi-nam', 'Áo sơ mi công sở và dạo phố phong cách', 1, 'ACTIVE', 2),
(6, 'Quần Jeans Nam', 'quan-jeans-nam', 'Quần jeans nam form dáng chuẩn, bền đẹp', 1, 'ACTIVE', 3),
(7, 'Váy & Đầm', 'vay-dam', 'Váy đầm dự tiệc, công sở và dạo phố', 2, 'ACTIVE', 1),
(8, 'Áo kiểu Nữ', 'ao-kieu-nu', 'Áo kiểu nữ thiết kế trẻ trung, nữ tính', 2, 'ACTIVE', 2),
(9, 'Chân váy', 'chan-vay', 'Chân váy chữ A, xòe, bút chì thời trang', 2, 'ACTIVE', 3),
(10, 'Thắt lưng', 'that-lung', 'Thắt lưng da nam nữ cao cấp', 3, 'ACTIVE', 1),
(11, 'Ví da', 'vi-da', 'Ví da cầm tay, ví gấp tiện dụng', 3, 'ACTIVE', 2),
(12, 'Nón / Mũ', 'non-mu', 'Nón lưỡi trai, nón bucket thời trang', 3, 'ACTIVE', 3);
