-- F04: Tạo bảng sản phẩm (products)

CREATE TABLE products (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    category_id BIGINT NOT NULL,
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(280) NOT NULL UNIQUE,
    description LONGTEXT NULL,
    short_description VARCHAR(500) NULL,
    price DECIMAL(15,2) NOT NULL,
    original_price DECIMAL(15,2) NULL,
    stock INT NOT NULL DEFAULT 0,
    sold_count INT NOT NULL DEFAULT 0,
    thumbnail_url VARCHAR(255) NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    version BIGINT NOT NULL DEFAULT 0,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL,
    INDEX idx_products_category_status_price (category_id, status, price),
    INDEX idx_products_slug (slug),
    INDEX idx_products_status (status),
    FULLTEXT INDEX ft_products_name (name),
    CONSTRAINT fk_products_category FOREIGN KEY (category_id) REFERENCES categories (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Seed sản phẩm thời trang mẫu (16 sản phẩm)
INSERT INTO products (id, category_id, name, slug, short_description, description, price, original_price, stock, sold_count, status) VALUES
(1, 4, 'Áo Thun Nam Cổ Tròn Cotton Compact Basic', 'ao-thun-nam-co-tron-cotton-compact-basic', 'Áo thun nam 100% cotton compact mềm mịn, thoáng mát thấm hút mồ hôi tốt.', 'Chất liệu 100% Cotton Compact cao cấp không bai nhão xù lông khi giặt. Kiểu dáng Regular Fit trẻ trung phù hợp đi chơi, đi làm, thể thao.', 199000.00, 250000.00, 100, 25, 'ACTIVE'),
(2, 4, 'Áo Thun Nam Polo Thể Thao Pique Co Giãn', 'ao-thun-nam-polo-the-thao-pique-co-gian', 'Áo polo nam vải cá sấu mắt chim dệt thoáng khí, lịch sự nam tính.', 'Áo thun có cổ polo chất liệu vải dệt cá sấu co giãn 4 chiều, giữ form chuẩn giúp bạn luôn tự tin trong mọi hoàn cảnh.', 299000.00, 380000.00, 80, 42, 'ACTIVE'),
(3, 5, 'Áo Sơ Mi Nam Oxford Trắng Dài Tay Cao Cấp', 'ao-so-mi-nam-oxford-trang-dai-tay-cao-cap', 'Áo sơ mi oxford màu trắng trang nhã, không nhăn, chuẩn form công sở.', 'Vải Oxford dệt dày dặn đứng form, công nghệ chống nhăn Easy-Care giúp tiết kiệm thời gian ủi đồ hàng ngày.', 350000.00, 450000.00, 60, 18, 'ACTIVE'),
(4, 5, 'Áo Sơ Mi Nam Caro Flannel Phong Cách Hàn Quốc', 'ao-so-mi-nam-caro-flannel-phong-cach-han-quoc', 'Áo sơ mi họa tiết kẻ caro flannel năng động, cá tính.', 'Sơ mi kẻ caro flannel chất vải cotton dạ mềm giữ ấm nhẹ nhàng, phối đồ layer cực chất khi dạo phố.', 380000.00, 480000.00, 45, 12, 'ACTIVE'),
(5, 6, 'Quần Jeans Nam Slimfit Xanh Đậm Co Giãn', 'quan-jeans-nam-slimfit-xanh-dam-co-gian', 'Quần jeans nam dáng ôm vừa vặn tôn dáng, màu xanh chàm bền bỉ.', 'Chất liệu Denim 12oz cotton pha spandex co giãn thoải mái khi vận động cả ngày dài.', 450000.00, 550000.00, 75, 30, 'ACTIVE'),
(6, 6, 'Quần Jeans Nam Rách Gối Cá Tính Streetwear', 'quan-jeans-nam-rach-goi-ca-tinh-streetwear', 'Quần bò nam rách gối bụi bặm phong cách đường phố.', 'Thiết kế wash rách gối nhẹ nhàng, form dáng regular straight mang lại vẻ ngoài khỏe khoắn hiện đại.', 490000.00, 590000.00, 35, 8, 'ACTIVE'),
(7, 7, 'Váy Đầm Nữ Dự Tiệc Dáng Xòe Lụa Sang Trọng', 'vay-dam-nu-du-tiec-dang-xoe-lua-sang-trong', 'Đầm xòe dự tiệc chất lụa cao cấp thắt eo tôn dáng.', 'Đầm thiết kế tinh tế với phần eo thắt nơ nhẹ nhàng, chân váy xòe bồng bềnh phù hợp cho các buổi tiệc cưới, sự kiện.', 590000.00, 750000.00, 50, 15, 'ACTIVE'),
(8, 7, 'Váy Hoa Nhí Vintage Dáng Dài Cổ Vuông', 'vay-hoa-nhi-vintage-dang-dai-co-vuong', 'Váy hoa nhí phong cách vintage lãng mạn, nhẹ nhàng mùa hè.', 'Chất liệu voan cát mềm mại có lớp lót kín đáo, họa tiết hoa nhí nữ tính cho nàng thêm rạng rỡ.', 420000.00, 520000.00, 60, 22, 'ACTIVE'),
(9, 8, 'Áo Kiểu Nữ Peplum Cổ V Tôn Dáng Thanh Lịch', 'ao-kieu-nu-peplum-co-v-ton-dang-thanh-lich', 'Áo peplum thắt eo che khuyết điểm bụng cực tốt.', 'Thiết kế peplum xòe nhẹ phần gấu áo giúp che vòng hai hoàn hảo, tạo hiệu ứng vòng eo thon thả.', 320000.00, 390000.00, 70, 35, 'ACTIVE'),
(10, 8, 'Áo Sơ Mi Nữ Công Sở Lụa Satin Tay Bồng', 'ao-so-mi-nu-cong-so-lua-satin-tay-bong', 'Sơ mi lụa satin bóng nhẹ mềm mại, tay bồng thanh thoát.', 'Chất lụa satin cao cấp chống nhăn, cổ đức chỉn chu kết hợp tay áo bồng nhẹ sang trọng.', 360000.00, 450000.00, 55, 19, 'ACTIVE'),
(11, 9, 'Chân Váy Chữ A Cạp Cao Xẻ Tà Nhẹ Thời Trang', 'chan-vay-chu-a-cap-cao-xe-ta-nhe-thoi-trang', 'Chân váy chữ A chất tuyết mưa dày dặn, cạp cao hack dáng.', 'Chân váy chữ A có quần trong bảo hộ an toàn, cạp cao tôn dáng dễ dàng mix cùng áo phông hay sơ mi.', 280000.00, 350000.00, 90, 50, 'ACTIVE'),
(12, 9, 'Chân Váy Xếp Ly Tennis Năng Động Trẻ Trung', 'chan-vay-xep-ly-tennis-nang-dong-tre-trung', 'Chân váy xếp ly dáng xòe ngắn năng động kiểu Hàn Quốc.', 'Chất vải kaki tuyết mưa giữ nếp ly sắc nét sau nhiều lần giặt, phù hợp đi chơi, chụp ảnh dã ngoại.', 250000.00, 320000.00, 85, 60, 'ACTIVE'),
(13, 10, 'Thắt Lưng Nam Da Bò Thật Khóa Tự Động', 'that-lung-nam-da-bo-that-khoa-tu-dong', 'Dây nịt nam da bò nguyên tấm bền đẹp, mặt khóa hợp kim không gỉ.', 'Da bò tự nhiên cao cấp mềm mại, khóa tự động tiện lợi mang lại phong thái lịch lãm cho phái mạnh.', 299000.00, 420000.00, 120, 45, 'ACTIVE'),
(14, 11, 'Ví Da Nữ Cầm Tay Nhiều Ngăn Tiện Dụng', 'vi-da-nu-cam-tay-nhieu-ngan-tien-dung', 'Ví dài cầm tay nữ da PU cao cấp chống thấm nước, nhiều ngăn thẻ.', 'Thiết kế sang trọng với nhiều ngăn chứa tiền, điện thoại và thẻ ngân hàng ngăn nắp gọn gàng.', 350000.00, 460000.00, 40, 14, 'ACTIVE'),
(15, 12, 'Nón Lưỡi Trai Unisex Thêu Nổi Phong Cách Streetwear', 'non-luoi-trai-unisex-theu-noi-phong-cach-streetwear', 'Mũ lưỡi trai vải kaki wash thêu chữ nổi cá tính.', 'Chất vải kaki 100% cotton thoáng khí, khóa kim loại phía sau dễ dàng điều chỉnh kích thước đầu.', 150000.00, 200000.00, 150, 80, 'ACTIVE'),
(16, 12, 'Nón Bucket Vải Canvas Basic Vành Tròn', 'non-bucket-vai-canvas-basic-vanh-tron', 'Mũ tai bèo vành tròn phong cách Ulzzang dễ phối đồ.', 'Mũ bucket canvas hai mặt tiện dụng, vành che nắng tốt thích hợp cho các chuyến du lịch, cắm trại.', 180000.00, 230000.00, 110, 38, 'ACTIVE');
