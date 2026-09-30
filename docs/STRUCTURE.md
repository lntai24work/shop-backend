# Cấu trúc thư mục backend

Nguyên tắc: **tạo dần theo từng tính năng**, không tạo sẵn toàn bộ. Cột "Tính năng" là lúc package đó xuất hiện (xem `ROADMAP.md`).

## Gốc project

```
shop/
├── .agent/
│   ├── rules/                       # quy tắc cho AI (luôn áp dụng)
│   │   ├── 00-project-context.md
│   │   ├── 01-coding-conventions.md
│   │   └── 02-dev-workflow.md
│   └── workflows/                   # lệnh /new-feature, /verify
├── docs/
│   ├── ecommerce-design.md          # luồng, database, API
│   ├── ROADMAP.md                   # danh sách tính năng + checklist
│   └── STRUCTURE.md                 # file này
├── src/
│   ├── main/
│   │   ├── java/com/tai/shop/       # xem bên dưới
│   │   └── resources/
│   │       ├── application.yml
│   │       ├── db/migration/        # Flyway: V1__..., V2__...
│   │       └── templates/           # template email (Thymeleaf)
│   └── test/java/com/tai/shop/      # test đặt cùng cấu trúc package với main
├── docker-compose.yml               # MySQL + Redis cho môi trường dev
├── .env.example                     # mẫu biến môi trường (commit)
├── .env                             # giá trị thật (KHÔNG commit)
├── .gitignore
├── pom.xml
└── README.md
```

## Package Java (`com.tai.shop`)

```
com.tai.shop
├── ShopApplication.java
│
├── common/                          # F00
│   ├── base/        BaseEntity, SoftDeletableEntity
│   ├── dto/         ApiResponse, PageResponse
│   ├── exception/   AppException, ErrorCode, GlobalExceptionHandler
│   └── util/        SlugUtils, OrderCodeGenerator, HmacUtils (thêm khi cần)
│
├── config/                          # F00 trở đi
│   ├── SecurityConfig               # F00 (tạm mở), F01 (JWT thật)
│   ├── CorsConfig, OpenApiConfig, JpaAuditingConfig
│   ├── CloudinaryConfig             # F05
│   ├── RedisConfig                  # F16
│   └── properties/  JwtProperties, VnPayProperties, ...
│
├── security/                        # F01
│   JwtService, JwtAuthenticationFilter, CustomUserDetails(Service),
│   RestAuthenticationEntryPoint, RestAccessDeniedHandler
│
├── auth/                            # F01, F02
│   AuthController, AuthService, RefreshToken(+Repository), dto/
│
├── user/                            # F01 (User, Role), F06 (profile, address)
│   User, Role, UserRepository, UserController, UserService, dto/
│   └── address/   Address, AddressController, AddressService, ...
│
├── catalog/
│   ├── category/                    # F03
│   └── product/                     # F04 (CRUD, lọc), F05 (ảnh)
│       Product, ProductImage, ProductController, AdminProductController,
│       ProductService, ProductRepository, ProductSpecification, ProductMapper, dto/
│
├── storage/                         # F05
│   StorageService (interface), CloudinaryStorageService
│
├── cart/                            # F07
├── order/                           # F08, F10
│   Order, OrderItem, OrderStatus, OrderService, OrderPricingService, scheduler/
├── payment/                         # F09
│   PaymentController, PaymentService, gateway/{PaymentGateway, vnpay/, momo/}
├── notification/                    # F11
│   EmailService, event/, listener/
├── coupon/                          # F12
├── review/  wishlist/               # F13
└── dashboard/                       # F14
```

Mỗi feature đều theo mẫu:

```
feature/
├── XxxController.java        # nhận request, @Valid, gọi service
├── XxxService.java           # logic nghiệp vụ + @Transactional
├── XxxRepository.java        # Spring Data JPA
├── Xxx.java                  # Entity
├── XxxMapper.java            # MapStruct
└── dto/                      # XxxRequest, XxxResponse (record)
```

## Test

```
src/test/java/com/tai/shop/
├── support/AbstractIntegrationTest.java   # Testcontainers MySQL dùng chung
├── common/GlobalExceptionHandlerTest.java
├── auth/AuthServiceTest.java, AuthControllerIT.java
├── order/OrderServiceTest.java, OrderConcurrencyTest.java
└── payment/VnPayUtilsTest.java
```

Quy ước: `XxxServiceTest` là unit test (Mockito), `XxxControllerIT` là integration test.
