# 🎬 ThungPhim

> Ứng dụng xem phim & series kiểu Netflix — banner hero có trailer, duyệt theo thể loại, xem phim/tập, "Danh sách của tôi", yêu thích, khu vực admin quản lý nội dung.

[![Java](https://img.shields.io/badge/Java-17+-ED8B00?logo=openjdk)](https://openjdk.org/)
[![Spring Boot](https://img.shields.io/badge/Spring_Boot-3.2-6DB33F?logo=spring)](https://spring.io/projects/spring-boot)
[![React](https://img.shields.io/badge/React-19-61DAFB?logo=react)](https://react.dev/)
[![MySQL](https://img.shields.io/badge/MySQL-8+-4479A1?logo=mysql)](https://www.mysql.com/)

---

## 📋 Mục lục

- [Yêu cầu hệ thống](#-yêu-cầu-hệ-thống)
- [Clone & chạy nhanh](#-clone--chạy-nhanh)
- [Hướng dẫn chi tiết](#-hướng-dẫn-chi-tiết)
- [Cấu trúc dự án](#-cấu-trúc-dự-án)
- [Tính năng](#-tính-năng)
- [Công nghệ](#-công-nghệ)
- [Biến môi trường](#-biến-môi-trường)
- [API](#-api)
- [Lỗi thường gặp](#-lỗi-thường-gặp)

---

## ✅ Yêu cầu hệ thống

| Công cụ | Phiên bản |
|---------|-----------|
| Java | 17 trở lên |
| Maven | 3.6+ |
| Node.js | 18+ |
| MySQL | 8+ |

---

## 🚀 Clone & chạy nhanh

```bash
# 1. Clone
git clone https://github.com/vinzboiz/ThungPhim---FilmWeb.git
cd ThungPhim---FilmWeb

# 2. Tạo database và chạy schema
# Mở HeidiSQL / MySQL Workbench → tạo DB "thungphim" → chạy file backend-spring/src/main/resources/schema.sql

# 3. Tạo thư mục upload
mkdir -p uploads/images uploads/videos

# 4. Chạy backend (Terminal 1)
cd backend-spring
mvn spring-boot:run

# 5. Chạy frontend (Terminal 2)
cd frontend
npm install
npm run dev
```

- **Backend API:** http://localhost:5000  
- **Frontend:** http://localhost:8080  

---

## 📖 Hướng dẫn chi tiết

### Bước 1: Clone repository

```bash
git clone https://github.com/vinzboiz/ThungPhim---FilmWeb.git
cd ThungPhim---FilmWeb
```

### Bước 2: Tạo database MySQL

1. Mở **HeidiSQL** (hoặc MySQL Workbench / MySQL client).
2. Kết nối MySQL, tạo database:

```sql
CREATE DATABASE thungphim CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

3. Chọn database `thungphim`.
4. Chạy file schema:
   - **HeidiSQL:** File → Run SQL file... → chọn `backend-spring/src/main/resources/schema.sql` → Run (F9)
   - **Hoặc:** Mở file `schema.sql` → copy nội dung → dán vào Query → Run

### Bước 3: Cấu hình backend (nếu cần)

Sửa `backend-spring/src/main/resources/application.properties` khi MySQL khác mặc định:

| Thuộc tính | Mặc định | Mô tả |
|------------|----------|-------|
| `server.port` | 5000 | Port API |
| `DB_HOST` | 127.0.0.1 | Host MySQL |
| `DB_PORT` | 3306 | Port MySQL |
| `DB_USER` | root | User MySQL |
| `DB_PASSWORD` | (trống) | Mật khẩu MySQL |
| `DB_NAME` | thungphim | Tên database |
| `jwt.secret` | (có sẵn) | **Production:** đổi ≥ 32 ký tự |
| `app.google.client-id` | (có sẵn) | Client ID Google OAuth (xem mục [Đăng nhập Google](#đăng-nhập-bằng-google)) |

### Bước 4: Tạo thư mục upload

Backend lưu ảnh và video vào thư mục `uploads/` ở thư mục gốc project:

```bash
mkdir -p uploads/images uploads/videos
```

> **Lưu ý:** Thư mục `uploads/` nằm trong `.gitignore`, clone mới sẽ không có. Bạn phải tạo thủ công.

### Bước 5: Cấu hình frontend (nếu dùng Google đăng nhập)

```bash
cd frontend
cp .env.example .env
```

Sửa `frontend/.env`:

```
VITE_GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
```

### Bước 6: Chạy ứng dụng

**Terminal 1 — Backend:**

```bash
cd backend-spring
mvn spring-boot:run
```

→ API: http://localhost:5000  

**Terminal 2 — Frontend:**

```bash
cd frontend
npm install
npm run dev
```

→ Web: http://localhost:8080  

### Đăng nhập bằng Google

1. Vào [Google Cloud Console](https://console.cloud.google.com/apis/credentials) → tạo dự án (hoặc chọn dự án có sẵn).
2. **APIs & Services** → **Credentials** → **Create Credentials** → **OAuth client ID**.
3. Chọn **Web application**.
4. **Authorized JavaScript origins:** `http://localhost:8080` (thêm domain khi deploy production).
5. **Authorized redirect URIs:** để trống (dùng Google Identity Services không cần redirect).
6. Copy **Client ID** (dạng `xxx.apps.googleusercontent.com`).
7. Cấu hình:
   - **Backend:** `application.properties` → `app.google.client-id=YOUR_CLIENT_ID`
   - **Frontend:** `.env` → `VITE_GOOGLE_CLIENT_ID=YOUR_CLIENT_ID`
8. Restart backend và frontend.

---

## 📁 Cấu trúc dự án

```
ThungPhim/
├── backend-spring/          # API Spring Boot (Java 17, Maven)
│   ├── src/main/java/com/thungphim/
│   │   ├── controller/     # REST API (Auth, Movies, Series, Genres, ...)
│   │   ├── service/        # Business logic
│   │   ├── entity/         # JPA entities
│   │   ├── repository/     # Spring Data JPA
│   │   ├── config/         # Security, CORS, WebConfig
│   │   ├── security/       # JWT filter, JwtUtil
│   │   └── dto/            # DTOs
│   ├── src/main/resources/
│   │   ├── application.properties
│   │   └── schema.sql      # Schema database
│   └── pom.xml
│
├── frontend/                # React + Vite
│   ├── src/
│   │   ├── apis/           # API client (client.js)
│   │   ├── components/     # Layout, HeroBanner, GoogleSignInButton, ...
│   │   ├── pages/          # HomePage, ContentDetailPage, Admin*, ...
│   │   ├── providers/      # AuthContext
│   │   ├── router/         # AppRouter
│   │   ├── styles/
│   │   └── utils/
│   ├── .env.example        # Mẫu biến môi trường
│   ├── package.json
│   └── vite.config.js      # Port 8080, COOP header
│
├── uploads/                 # Media (gitignore — tạo thủ công)
│   ├── images/             # Poster, banner, avatar
│   └── videos/             # Phim, trailer, tập
│
├── .gitignore
└── README.md
```

---

## ✨ Tính năng

| Khu vực | Mô tả |
|---------|-------|
| **Trang chủ** | Hero banner ngẫu nhiên có trailer, các hàng Top rating / Mới / Theo thể loại, tìm kiếm. Chế độ: Tất cả, Chỉ phim, Chỉ series, Mới & phổ biến. |
| **Chi tiết phim/series** | Thông tin đầy đủ (diễn viên, đạo diễn, thể loại, trailer). Hành động: Phát, Thêm vào danh sách, Thích. Series: danh sách season và tập. |
| **Xem phim / tập** | Video player, tiếp tục xem, đánh giá & review, gợi ý xem tiếp. |
| **Tài khoản & hồ sơ** | Đăng ký, đăng nhập, đăng nhập Google, nhiều hồ sơ mỗi tài khoản. Admin: khóa tài khoản. |
| **Danh sách của tôi / Yêu thích** | Thêm/bỏ phim, series. Hiển thị dạng thẻ ngang như trang chủ. |
| **Thể loại** | Lọc theo thể loại, năm, quốc gia; hỗ trợ phim và series. |
| **Thông báo** | Chuông thông báo trong app (thêm watchlist, favorites, ...). |
| **Lịch sử xem** | Hàng "Tiếp tục xem" và trang lịch sử. |
| **Admin** | Quản lý phim, series, tập, thể loại, người dùng. Upload poster, banner, trailer, video. |

---

## 🛠 Công nghệ

| Thành phần | Công nghệ |
|------------|-----------|
| **Frontend** | React 19, React Router 7, Vite 7 |
| **Backend** | Java 17, Spring Boot 3.2, Spring Security, Spring Data JPA |
| **Database** | MySQL 8 |
| **Upload** | Spring Multipart — ảnh: `uploads/images`, video: `uploads/videos` |
| **Auth** | JWT (JJWT), BCrypt, Google OAuth 2.0 (xác thực ID token phía backend) |

---

## 🔐 Biến môi trường

### Backend (application.properties hoặc biến môi trường)

| Biến | Mặc định | Mô tả |
|------|----------|-------|
| `DB_HOST` | 127.0.0.1 | MySQL host |
| `DB_PORT` | 3306 | MySQL port |
| `DB_USER` | root | MySQL user |
| `DB_PASSWORD` | (trống) | MySQL password |
| `DB_NAME` | thungphim | Tên database |
| `jwt.secret` | (có sẵn) | Secret JWT — **≥ 32 ký tự** cho production |

### Frontend (.env)

| Biến | Bắt buộc | Mô tả |
|------|----------|-------|
| `VITE_GOOGLE_CLIENT_ID` | Không | Client ID Google OAuth — cần khi dùng đăng nhập Google |

Copy từ `.env.example` sang `.env` rồi điền giá trị.

---

## 📡 API

| Nhóm | Ví dụ endpoint | Mô tả |
|------|----------------|-------|
| **Auth** | `POST /api/auth/login`, `POST /api/auth/register`, `POST /api/auth/google` | Đăng nhập, đăng ký, Google |
| **Phim** | `GET /api/movies`, `GET /api/movies/:id` | Danh sách, chi tiết |
| **Series** | `GET /api/series`, `GET /api/series/:id/episodes` | Danh sách, chi tiết, tập |
| **Hero** | `GET /api/hero/random?type=movie|series|featured` | Item random cho banner |
| **Thể loại** | `GET /api/genres`, `GET /api/genres/top-with-movies` | Danh sách, top thể loại |
| **Upload** | `POST /api/upload/image`, `POST /api/upload/video` | Upload ảnh, video |
| **Watchlist** | `GET /api/watchlist`, `POST /api/watchlist` | Danh sách của tôi |
| **Favorites** | `GET /api/favorites`, `POST /api/favorites` | Yêu thích |
| **Watch** | `GET /api/watch/continue`, `POST /api/watch/progress` | Tiếp tục xem, lưu tiến độ |
| **Admin** | `GET /api/admin/users`, `PATCH /api/admin/users/:id` | Quản lý người dùng |

Chi tiết đầy đủ: `backend-spring/src/main/java/com/thungphim/controller/`.

---

## 🔧 Lỗi thường gặp

| Triệu chứng | Cách xử lý |
|-------------|------------|
| **Port 5000 đã sử dụng** | Tắt process chiếm port hoặc đổi `server.port` trong `application.properties`. |
| **Không kết nối được MySQL** | Kiểm tra MySQL đang chạy; kiểm tra `DB_HOST`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`. |
| **Login 500 / WeakKeyException** | Đặt `jwt.secret` ≥ 32 ký tự trong `application.properties`. |
| **Frontend không gọi được API** | Backend chạy port 5000; kiểm tra `API_BASE` trong `frontend/src/apis/client.js` là `http://localhost:5000`. |
| **Lỗi CORS** | Backend CORS đã cấu hình `http://localhost:8080`. Đảm bảo frontend chạy đúng port. |
| **Upload 404 / ảnh không hiện** | Tạo thư mục `uploads/images` và `uploads/videos` ở thư mục gốc project. |
| **Google đăng nhập lỗi** | Kiểm tra Client ID khớp, Authorized JavaScript origins có `http://localhost:8080`. |

---

## 📜 Scripts

**Backend (`backend-spring/`):**

| Lệnh | Mô tả |
|------|-------|
| `mvn spring-boot:run` | Chạy server |
| `mvn package` | Build JAR |
| `mvn compile` | Chỉ compile |

**Frontend (`frontend/`):**

| Script | Mô tả |
|--------|-------|
| `npm run dev` | Chạy dev server (port 8080) |
| `npm run build` | Build production |
| `npm run preview` | Xem trước build |
| `npm run lint` | ESLint |

---

## 📄 License & Liên hệ

- **License:** ISC
- **Liên hệ:** [GitHub Issues](https://github.com/vinzboiz/ThungPhim---FilmWeb/issues)

---

*ThungPhim — xây dựng với React, Spring Boot và MySQL.*
