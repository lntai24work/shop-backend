# ROADMAP: làm từng tính năng, test xong mới sang tiếp

Cách dùng: trong Antigravity gõ `/new-feature F01`. Nếu workflow không nhận, dán câu:
> Làm tính năng F01 trong docs/ROADMAP.md theo quy trình trong .agent/rules/02-dev-workflow.md. Đưa kế hoạch trước, chờ tôi đồng ý.

Mỗi tính năng: **tạo nhánh Git -> làm -> test tay -> merge/commit -> tick checkbox**.

## Tổng quan

- [x] F00 Nền tảng
- [x] F01 Đăng ký / đăng nhập (JWT)
- [x] F02 Refresh token, đăng xuất, /users/me
- [x] F03 Danh mục (Category)
- [x] F04 Sản phẩm: CRUD, lọc, tìm kiếm
- [ ] F05 Upload ảnh sản phẩm (Cloudinary)
- [ ] F06 Hồ sơ người dùng, địa chỉ, avatar
- [ ] F07 Giỏ hàng
- [ ] F08 Đặt hàng COD + trừ kho an toàn
- [ ] F09 Thanh toán VNPay (sandbox) + IPN
- [ ] F10 Job hủy đơn hết hạn, hoàn kho
- [ ] F11 Email bất đồng bộ (sự kiện đơn hàng)
- [ ] F12 Mã giảm giá
- [ ] F13 Đánh giá sản phẩm, yêu thích
- [ ] F14 Admin: người dùng, dashboard thống kê
- [ ] F15 Google login, quên mật khẩu, xác thực email
- [ ] F16 Redis: cache, rate limit
- [ ] F17 Docker hóa, CI (GitHub Actions), deploy, README

Giai đoạn: F00-F08 là MVP (đủ để demo mua hàng COD). F09-F14 hoàn thiện nghiệp vụ. F15-F17 nâng cao.

---

## F00 Nền tảng

**Mục tiêu:** app chạy được, nối được MySQL, có khung dùng chung.

**Làm:**
- Dùng `application.yml`, `docker-compose.yml`, `.env.example` đã cho. Kiểm tra `pom.xml` đủ dependency (web, data-jpa, validation, security, flyway + MySQL, lombok, actuator, mapstruct, springdoc, test, testcontainers)
- Package `common`: `BaseEntity`, `SoftDeletableEntity`, `ApiResponse`, `PageResponse`, `ErrorCode`, `AppException`, `GlobalExceptionHandler`
- `SecurityConfig` TẠM THỜI cho phép mọi request (nếu không, Spring Security khóa toàn bộ và sinh password ngẫu nhiên). Ghi TODO sẽ thay ở F01
- `CorsConfig` cho `http://localhost:5173`, `OpenApiConfig` (Swagger), `JpaAuditingConfig`

**Test:**
- Test `GlobalExceptionHandler` trả đúng format cho `AppException` và lỗi validation
- `contextLoads` chạy được với Testcontainers MySQL (tạo `AbstractIntegrationTest`)

**Kiểm tra tay:** `GET /actuator/health` trả `UP`. Mở `/swagger-ui.html` thấy giao diện.

---

## F01 Đăng ký / đăng nhập (JWT)

**Phụ thuộc:** F00.
**Migration:** `V1__create_auth_tables.sql`: `users`, `roles`, `user_roles`. Seed 2 role, 1 tài khoản admin (mật khẩu BCrypt, ghi rõ trong README).
**API:** `POST /auth/register`, `POST /auth/login`.
**Làm:** BCrypt, `JwtService` (access token 15 phút), `JwtAuthenticationFilter`, `SecurityConfig` thật (public: auth, swagger, actuator health, GET sản phẩm/danh mục; còn lại cần đăng nhập; `/admin/**` cần ADMIN), trả 401/403 dạng JSON.
**Test:** đăng ký thành công; trùng email trả 409; sai mật khẩu trả 401; token hợp lệ gọi được endpoint bảo vệ; không token trả 401; USER gọi `/admin/**` trả 403.
**Kiểm tra tay:** đăng ký, đăng nhập, copy token, bấm Authorize trong Swagger, gọi endpoint bảo vệ.

## F02 Refresh token, đăng xuất, /users/me

**Phụ thuộc:** F01.
**Migration:** `V2__create_refresh_tokens.sql`.
**API:** `POST /auth/refresh`, `POST /auth/logout`, `GET /users/me`.
**Làm:** refresh token lưu dạng hash, đặt HttpOnly cookie, xoay vòng (rotate) mỗi lần refresh, dùng lại token cũ bị từ chối.
**Test:** refresh thành công; token hết hạn/bị thu hồi bị từ chối; logout xong không refresh được; dùng lại refresh token cũ bị từ chối.

## F03 Danh mục

**Migration:** `V3__create_categories.sql` (có `parent_id`, `slug` UNIQUE).
**API:** `GET /categories` (dạng cây), admin CRUD `/admin/categories`.
**Test:** tạo slug tự động từ tên, trùng slug xử lý đúng, cấu trúc cây đúng, USER không được CRUD.

## F04 Sản phẩm: CRUD, lọc, tìm kiếm

**Migration:** `V4__create_products.sql` (index `category_id,status,price`, FULLTEXT `name`, cột `version`, `deleted_at`).
**API:** `GET /products` (keyword, categoryId, minPrice, maxPrice, sort, page, size), `GET /products/{slug}`, admin CRUD `/admin/products`, `PATCH /admin/products/{id}/stock`.
**Làm:** `ProductSpecification` để lọc động, xóa mềm, phân trang bằng `PageResponse`.
**Test:** từng bộ lọc riêng và kết hợp; sản phẩm đã xóa mềm không hiện; sắp xếp; phân trang; giá âm/thiếu trường bị 400.
**Kiểm tra tay:** thêm khoảng 15-20 sản phẩm mẫu (có thể seed bằng migration `V4_1` hoặc `data.sql` chỉ ở profile dev).

## F05 Upload ảnh sản phẩm

**Phụ thuộc:** F04. Cần tài khoản Cloudinary (miễn phí), đặt key vào `.env`.
**Migration:** `V5__create_product_images.sql`.
**API:** `POST /admin/products/{id}/images`, `DELETE /admin/products/{id}/images/{imageId}`.
**Làm:** `StorageService` là interface, `CloudinaryStorageService` là bản cài đặt. Giới hạn loại file (jpg/png/webp) và dung lượng (5MB). Lưu `public_id` để xóa. Xóa ảnh phải xóa cả trên Cloudinary.
**Test:** unit test với `StorageService` mock; file sai định dạng/quá lớn bị 400. Không gọi Cloudinary thật trong test.

## F06 Hồ sơ người dùng, địa chỉ, avatar

**Migration:** `V6__create_addresses.sql`.
**API:** `PUT /users/me`, `PUT /users/me/password`, `POST /users/me/avatar`, CRUD `/users/me/addresses`, `PATCH .../default`.
**Test:** user A không sửa/xóa được địa chỉ của user B (403/404); luôn chỉ có một địa chỉ mặc định; đổi mật khẩu sai mật khẩu cũ bị từ chối.

## F07 Giỏ hàng

**Migration:** `V7__create_carts.sql` (UNIQUE `cart_id, product_id`).
**API:** `GET /cart`, `POST /cart/items`, `PUT /cart/items/{id}`, `DELETE /cart/items/{id}`, `DELETE /cart`.
**Làm:** thêm sản phẩm đã có thì cộng dồn số lượng; kiểm tra tồn kho và trạng thái sản phẩm; giỏ trả về giá hiện tại từ DB.
**Test:** cộng dồn; vượt tồn kho bị từ chối; sản phẩm ẩn/xóa không thêm được; giỏ của user khác không truy cập được.

## F08 Đặt hàng COD + trừ kho an toàn

**Phụ thuộc:** F06, F07.
**Migration:** `V8__create_orders.sql`: `orders`, `order_items` (snapshot tên/giá/ảnh), `order_status_history`.
**API:** `POST /orders/preview`, `POST /orders`, `GET /orders`, `GET /orders/{orderCode}`, `POST /orders/{orderCode}/cancel`, admin `GET /admin/orders`, `PATCH /admin/orders/{id}/status`.
**Làm:** một `@Transactional`: kiểm tra giỏ, trừ kho bằng atomic UPDATE, tạo order + items, xóa giỏ. Hủy đơn hoàn kho. Chuyển trạng thái chỉ theo luồng hợp lệ (PENDING > CONFIRMED > SHIPPING > DELIVERED, hoặc CANCELLED). Server tự tính tiền, bỏ qua mọi số tiền client gửi.
**Test (quan trọng):**
- Đặt hàng thành công: kho giảm đúng, giỏ rỗng, snapshot giá đúng
- Hết hàng: rollback toàn bộ, kho không đổi
- **Concurrency:** 20 luồng cùng mua sản phẩm còn 5 cái, đúng 5 đơn thành công, kho về 0, không âm
- Hủy đơn hoàn kho; hủy khi đã CONFIRMED bị từ chối
- Chuyển trạng thái sai luồng bị từ chối
**Điểm để phỏng vấn:** giải thích được vì sao dùng atomic UPDATE và vì sao phải snapshot giá.

## F09 Thanh toán VNPay (sandbox) + IPN

**Phụ thuộc:** F08. Đăng ký tài khoản sandbox VNPay, lấy `tmnCode` và `hashSecret` vào `.env`.
**Migration:** `V9__create_payments.sql` (`transaction_no` UNIQUE).
**API:** `POST /payments/vnpay/create`, `GET /payments/vnpay/return`, `GET /payments/vnpay/ipn`, `GET /payments/order/{orderCode}`.
**Làm:** interface `PaymentGateway` + `VnPayGateway` (Strategy). Tạo URL có chữ ký HMAC-SHA512. IPN là nguồn sự thật: verify chữ ký, kiểm tra `orderCode` và số tiền khớp DB, **idempotent** (gọi 2 lần chỉ xử lý 1 lần), trả đúng mã phản hồi cho VNPay. Return URL chỉ để hiển thị.
**Test:** chữ ký đúng/sai; số tiền không khớp bị từ chối; IPN lặp lại không xử lý hai lần; order không tồn tại trả đúng mã lỗi.

## F10 Job hủy đơn hết hạn

**Làm:** `@Scheduled` mỗi vài phút, hủy đơn online còn PENDING quá 30 phút, hoàn kho. Không đụng đơn COD.
**Test:** đơn quá hạn bị hủy và hoàn kho; đơn chưa quá hạn và đơn đã PAID thì giữ nguyên; job chạy lại không hoàn kho hai lần.

## F11 Email bất đồng bộ

**Làm:** Spring Events (`OrderCreatedEvent`, `OrderPaidEvent`) + `@Async` + `@TransactionalEventListener(AFTER_COMMIT)`, template Thymeleaf. Dev dùng Mailtrap hoặc Gmail App Password.
**Test:** listener được gọi sau commit; lỗi gửi mail không làm hỏng đơn hàng.

## F12 Mã giảm giá

**Migration:** `V10__create_coupons.sql`.
**API:** `POST /coupons/validate`, `GET /coupons/available`, admin CRUD.
**Làm:** tích hợp vào `OrderPricingService` (preview và tạo đơn). Tăng `used_count` an toàn khi đồng thời. Hủy đơn thì hoàn lượt dùng.
**Test:** hết hạn, chưa tới hạn, hết lượt, chưa đủ giá trị tối thiểu, giảm theo % có trần `max_discount`.

## F13 Đánh giá, yêu thích

**Migration:** `V11__create_reviews_wishlists.sql`.
**Làm:** chỉ review được khi đã mua (đơn DELIVERED), mỗi order_item một review; cập nhật `avg_rating`, `review_count`.
**Test:** chưa mua thì bị từ chối; review trùng bị từ chối; điểm trung bình tính đúng.

## F14 Admin: người dùng, dashboard

**API:** `/admin/users`, `/admin/dashboard/summary|revenue|top-products`.
**Test:** khóa tài khoản thì không đăng nhập được; số liệu thống kê khớp dữ liệu mẫu; chỉ ADMIN truy cập.

## F15 Google login, quên mật khẩu, xác thực email

Token đặt lại mật khẩu dùng một lần, có hạn. Verify Google id_token phía server.

## F16 Redis

Cache danh sách/chi tiết sản phẩm (xóa cache khi cập nhật), rate limit endpoint đăng nhập, có thể chuyển lưu refresh token sang Redis. Test cache hit/evict.

## F17 Hoàn thiện

`Dockerfile`, cập nhật `docker-compose.yml` thêm service backend, GitHub Actions chạy test, deploy, README tiếng Anh (kiến trúc, ERD, link demo, tài khoản test, mục "Technical challenges").
