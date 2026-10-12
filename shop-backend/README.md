# Shop Backend

Backend API cho website bán hàng — dự án CV cá nhân.

## Tech Stack

| Layer | Công nghệ |
|---|---|
| Language | Java 17 |
| Framework | Spring Boot 4.1.1, Spring Framework 7, Spring Security 7 |
| Persistence | Spring Data JPA, Hibernate 7, Flyway, MySQL 8 |
| Build | Maven (mvnw) |
| API Docs | springdoc-openapi (Swagger UI) |
| Mapping | MapStruct |
| Test | JUnit 5, Mockito, Testcontainers |
| Dev infra | Docker Compose (MySQL + Redis) |

## Yêu cầu

- Java 17+
- Docker Desktop (để chạy MySQL & Redis)
- Maven wrapper đã có sẵn (`mvnw`)

## Khởi động

### 1. Cấu hình môi trường

```bash
cp .env.example .env
# Chỉnh sửa .env nếu cần (mặc định đã dùng port 3307 để tránh xung đột với MySQL local)
```

### 2. Bật database

```bash
docker compose up -d
```

### 3. Chạy ứng dụng

```bash
# Build
.\mvnw.cmd package -DskipTests

# Run
java -jar target\shop-0.0.1-SNAPSHOT.jar
```

### 4. Kiểm tra

| URL | Kết quả |
|---|---|
| `http://localhost:8080/actuator/health` | `{"status":"UP"}` |
| `http://localhost:8080/swagger-ui.html` | Swagger UI |

## Chạy test

```bash
# Yêu cầu Docker đang chạy (Testcontainers tự tạo MySQL riêng)
.\mvnw.cmd test
```

## Cấu trúc thư mục

```
src/main/java/com/tai/shop/
├── common/          # Base entity, DTO, exception handling
├── config/          # Security, CORS, Swagger, JPA Auditing
└── ShopApplication.java

src/main/resources/
├── application.yml
└── db/migration/    # Flyway migrations (V0, V1, ...)
```

## Roadmap

| # | Tính năng | Trạng thái |
|---|---|---|
| F00 | Nền tảng (common layer, config, exception handler) | ✅ |
| F01 | Đăng ký / Đăng nhập (JWT) | 🔄 |
| F02 | Refresh token, đăng xuất, /users/me | ⬜ |
| F03 | Danh mục sản phẩm | ⬜ |
| F04 | Sản phẩm CRUD, lọc, tìm kiếm | ⬜ |
| F05 | Upload ảnh (Cloudinary) | ⬜ |
| F06 | Hồ sơ người dùng, địa chỉ | ⬜ |
| F07 | Giỏ hàng | ⬜ |
| F08 | Đặt hàng COD + trừ kho an toàn | ⬜ |
| F09 | Thanh toán VNPay sandbox | ⬜ |
| F10–F17 | ... | ⬜ |

## Biến môi trường

Xem [`.env.example`](.env.example) để biết danh sách đầy đủ.

| Biến | Mô tả |
|---|---|
| `DB_HOST` | MySQL host (mặc định: localhost) |
| `DB_PORT` | MySQL port (mặc định: 3307) |
| `DB_NAME` | Tên database (mặc định: shop) |
| `DB_USER` / `DB_PASS` | Credentials |
| `JWT_SECRET` | Chuỗi bí mật ≥ 32 ký tự (thêm ở F01) |
