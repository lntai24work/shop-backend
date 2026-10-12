# Shop — Full-stack E-commerce (CV Project)

Dự án e-commerce full-stack xây dựng để đưa vào CV. Mono-repo gồm backend và frontend riêng biệt.

## Cấu trúc

```
shop/
├── shop-backend/   # Spring Boot 4 + MySQL + Redis
├── shop-frontend/  # Next.js 15 + TypeScript + shadcn/ui
└── docker-compose.yml
```

## Quick Start

### 1. Khởi động databases

```bash
docker compose up -d
```

### 2. Chạy backend

```bash
cd shop-backend
.\mvnw.cmd spring-boot:run
# API: http://localhost:8080
# Swagger: http://localhost:8080/swagger-ui.html
```

### 3. Chạy frontend

```bash
cd shop-frontend
npm run dev
# UI: http://localhost:3000
```

## Tech Stack

| Layer     | Technology                                      |
|-----------|-------------------------------------------------|
| Backend   | Java 17, Spring Boot 4.1, Spring Security 7     |
| Database  | MySQL 8, Flyway, Redis 7                        |
| Storage   | Cloudinary                                      |
| Frontend  | Next.js 15 (App Router), TypeScript             |
| UI        | shadcn/ui, Tailwind CSS                         |
| Container | Docker, Docker Compose                          |

## Features

- [x] F00 — Foundation (Base entities, Global exception, ApiResponse)
- [x] F01 — Auth (JWT, Refresh Token, BCrypt)
- [x] F02 — Category CRUD (Admin)
- [x] F03 — Product CRUD + Search/Filter (Admin & Public)
- [x] F04 — Product Stock Management
- [x] F05 — Product Image Upload (Cloudinary)
- [x] F06 — User Profile & Address Management
- [ ] F07 — Shopping Cart
- [ ] F08 — Order & Checkout (COD)
