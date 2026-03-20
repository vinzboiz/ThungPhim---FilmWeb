# 🎬 ThungPhim

> A Netflix‑style movie & series web app — hero banner with trailer, browse by genre, watch movies/episodes, "My List", favorites, and an admin area to manage content.

[![Java](https://img.shields.io/badge/Java-17+-ED8B00?logo=openjdk)](https://openjdk.org/)
[![Spring Boot](https://img.shields.io/badge/Spring_Boot-3.2-6DB33F?logo=spring)](https://spring.io/projects/spring-boot)
[![React](https://img.shields.io/badge/React-19-61DAFB?logo=react)](https://react.dev/)
[![MySQL](https://img.shields.io/badge/MySQL-8+-4479A1?logo=mysql)](https://www.mysql.com/)

---

## 📋 Table of contents

- [Quick start](#-quick-start)
- [Features](#-features)
- [Tech stack](#-tech-stack)
- [Detailed setup](#-detailed-setup)
- [Environment variables](#-environment-variables)
- [Project structure](#-project-structure)
- [API overview](#-api-overview)
- [Scripts](#-scripts)
- [Common issues](#-common-issues)
- [Contributing](#-contributing)
- [License & contact](#-license--contact)

---

## 🚀 Quick start

Bạn cần **Java 17+**, **Maven** và **MySQL 8+**. Tạo database xong chạy:

```bash
# Backend (Spring Boot)
cd backend-spring
mvn spring-boot:run
# → http://localhost:5000

# Frontend (terminal mới)
cd frontend
npm install && npm run dev
# → http://localhost:5173
```

Mở `http://localhost:5173` trên trình duyệt.

**Repository:** [github.com/vinzboiz/ThungPhim---FilmWeb](https://github.com/vinzboiz/ThungPhim---FilmWeb)

---

## ✨ Features

| Area | Description |
|------|-------------|
| **Home page** | Random hero banner with trailer, rows for Top rating / New / By genre, search. Modes: All, Movies only, Series only, New & popular. |
| **Movie/series detail** | Full info (cast, director, genres, trailer), actions: Play, Add to list, Like. For series: seasons and episodes list. |
| **Watch movie / episode** | Video player, resume progress, rating & reviews, next‑watch suggestions. |
| **Accounts & profiles** | Register, login, multiple profiles per account. "My List" and Favorites per profile. |
| **My List / Favorites** | Same horizontal cards as home; hover panel with Play / + / Like / More, opens HeroBanner modal. |
| **Genres** | Filter by genre, year, country; supports both movies and series; genre banner when coming from detail page. |
| **Notifications** | In‑app notification bell for actions like adding to watchlist, favorites, etc. |
| **Watch history** | "Continue watching" row and history page powered by watch progress. |
| **Admin area** | Manage movies, series, episodes, genres, people. Add/edit movies & series, upload poster, banner, trailer, main video, and auto‑generate episode thumbnails from video. |

---

## 🛠 Tech stack

| Layer | Technologies |
|-------|--------------|
| **Frontend** | React 19, React Router 7, Vite 7 |
| **Backend** | Java 17+, Spring Boot 3.2 |
| **Database** | MySQL 8, Spring Data JPA |
| **Upload** | Spring Multipart — images in `uploads/images`, videos in `uploads/videos` |
| **Auth** | JWT (JJWT), BCryptPasswordEncoder |

---

## 📦 Detailed setup

### 1. Clone repo and enter folder

```bash
git clone https://github.com/vinzboiz/ThungPhim---FilmWeb.git
cd ThungPhim---FilmWeb
```

### 2. Create MySQL database

```sql
CREATE DATABASE thungphim CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

### 3. Backend configuration (backend-spring)

Cấu hình qua biến môi trường hoặc file `backend-spring/src/main/resources/application.properties`:

| Biến | Mặc định | Mô tả |
|------|----------|-------|
| `DB_HOST` | 127.0.0.1 | MySQL host |
| `DB_PORT` | 3306 | MySQL port |
| `DB_USER` | root | MySQL user |
| `DB_PASSWORD` | (trống) | MySQL password |
| `DB_NAME` | thungphim | Tên database |
| `jwt.secret` | (có fallback) | Secret JWT — **phải ≥ 32 ký tự** cho HS256 |

Thư mục upload: `uploads/` ở root project. Tạo nếu chưa có:

```bash
mkdir -p uploads/images uploads/videos
```

*Lưu ý: Database schema phải tồn tại trước (tạo bảng qua migration SQL hoặc JPA `ddl-auto=create` khi lần đầu chạy).*

### 4. Chạy backend

```bash
cd backend-spring
mvn spring-boot:run
```

API: `http://localhost:5000`

### 5. Cài đặt frontend

```bash
cd frontend
npm install
```

### 6. Chạy ứng dụng

- **Terminal 1:** `cd backend-spring && mvn spring-boot:run` → API: `http://localhost:5000`
- **Terminal 2:** `cd frontend && npm run dev` → Web: `http://localhost:5173`

Nếu backend chạy host/port khác, cập nhật `API_BASE` trong `frontend/src/apis/client.js`.

---

## 🔐 Environment variables

Backend Spring Boot dùng biến môi trường (hoặc `application.properties`):

| Biến | Mặc định | Mô tả |
|------|----------|-------|
| `DB_HOST` | 127.0.0.1 | MySQL host |
| `DB_PORT` | 3306 | MySQL port |
| `DB_USER` | root | MySQL user |
| `DB_PASSWORD` | (trống) | MySQL password |
| `DB_NAME` | thungphim | Tên database |
| `jwt.secret` | (có fallback) | Secret JWT — **≥ 32 ký tự** cho HS256 |

---

## 📁 Project structure

```
ThungPhim/
├── backend-spring/             # API Spring Boot (Java 17, Maven)
│   ├── src/main/java/com/thungphim/
│   │   ├── controller/        # REST API controllers
│   │   ├── service/           # Business logic
│   │   ├── entity/            # JPA entities
│   │   ├── repository/        # Spring Data JPA
│   │   ├── config/            # Security, CORS, WebConfig
│   │   └── security/          # JWT filter, JwtUtil
│   └── src/main/resources/
│       └── application.properties
│
├── frontend/                   # Ứng dụng React (Vite)
│   ├── src/
│   │   ├── apis/              # API client, getToken, getProfileId
│   │   ├── components/        # Layout, HeroBanner, HomeMovieRow, ...
│   │   ├── pages/             # HomePage, ContentDetailPage, Watch*, Admin*, ...
│   │   └── router/            # AppRouter
│   └── index.html
│
├── uploads/                    # Media files (images, videos)
│   ├── images/
│   └── videos/
│
└── README.md
```

---

## 📡 API overview

| Group | Example endpoint | Description |
|-------|------------------|-------------|
| **Auth** | `POST /api/auth/login`, `POST /api/auth/register` | Login, register |
| **Movies** | `GET /api/movies`, `GET /api/movies/:id`, `PUT /api/movies/:id` | List, detail, update movie |
| **Series** | `GET /api/series`, `GET /api/series/:id`, `GET /api/series/:id/episodes` | List, detail, episodes of a series |
| **Suggestions** | `GET /api/movies/:id/suggestions`, `GET /api/series/:id/suggestions` | Suggestions by shared genres + fallback content |
| **Hero** | `GET /api/hero/random?type=movie\|series\|featured` | Random item for home hero banner |
| **Genres** | `GET /api/genres`, `GET /api/genres/top-with-movies` | List genres, top genres with movies/series |
| **Upload** | `POST /api/upload/image`, `POST /api/upload/video` | Upload image (`image` field) or video (`video` field) |
| **Watchlist** | `GET /api/watchlist?profile_id=`, `POST /api/watchlist` | User watchlist |
| **Favorites** | `GET /api/favorites?profile_id=`, `POST /api/favorites` | User favorites |
| **Watch** | `GET /api/watch/continue`, `POST /api/watch/progress`, `GET /api/watch/history` | Continue watching, history, save watch progress |
| **Notifications** | `GET /api/notifications?profile_id=`, `PATCH /api/notifications/mark-all-read` | In‑app notifications |

Chi tiết routes trong `backend-spring/src/main/java/com/thungphim/controller/`.

---

## 📜 Scripts

**Backend (`backend-spring/`)**

| Lệnh | Mô tả |
|------|-------|
| `mvn spring-boot:run` | Chạy server Spring Boot |
| `mvn package` | Build JAR |

**Frontend (`frontend/`)**

| Script | Mô tả |
|--------|-------|
| `npm run dev` | Chạy Vite dev server |
| `npm run build` | Build production |
| `npm run preview` | Xem trước build |
| `npm run lint` | Chạy ESLint |

---

## 🔧 Common issues

| Triệu chứng | Cách xử lý |
|-------------|------------|
| **Port 5000 đã được sử dụng** | Tắt process đang chiếm port hoặc đổi `server.port` trong `application.properties`. |
| **Cannot connect to MySQL** | Kiểm tra `DB_HOST`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`; đảm bảo MySQL đang chạy. |
| **Login 500 / WeakKeyException** | Đặt `jwt.secret` ≥ 32 ký tự trong `application.properties` hoặc biến môi trường. |
| **Frontend không kết nối API** | Xác nhận backend chạy trên port 5000 và `API_BASE` trong `frontend/src/apis/client.js` khớp. |
| **CORS errors** | Backend đã cấu hình CORS cho `http://localhost:5173`. Kiểm tra origin frontend. |

---

## 🤝 Contributing

1. **Fork** repository và clone về máy.
2. Tạo **feature branch**: `git checkout -b feature/your-feature-name`.
3. Cài đặt & chạy theo [Detailed setup](#-detailed-setup).
4. **Commit** với message rõ ràng, **push** lên branch.
5. Mở **Pull Request** vào `main`.

Báo lỗi hoặc đề xuất: dùng **GitHub Issues**.

---

## 📄 License & contact

- **License:** ISC.
- **Contact:** [GitHub Issues](https://github.com/vinzboiz/ThungPhim---FilmWeb/issues).

---

*ThungPhim — built with React, Spring Boot and MySQL.*
