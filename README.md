# 🎬 ThungPhim

> Ứng dụng xem phim và series kiểu Netflix — trang chủ với banner trailer, khám phá theo thể loại, xem phim/tập, danh sách của tôi, yêu thích và khu vực quản trị nội dung.

[![Node](https://img.shields.io/badge/Node.js-18+-339933?logo=node.js)](https://nodejs.org/)
[![React](https://img.shields.io/badge/React-19-61DAFB?logo=react)](https://react.dev/)
[![MySQL](https://img.shields.io/badge/MySQL-8+-4479A1?logo=mysql)](https://www.mysql.com/)

---

## 📋 Mục lục

- [Bắt đầu nhanh](#-bắt-đầu-nhanh)
- [Tính năng](#-tính-năng)
- [Công nghệ](#-công-nghệ)
- [Cài đặt chi tiết](#-cài-đặt-chi-tiết)
- [Biến môi trường](#-biến-môi-trường)
- [Cấu trúc dự án](#-cấu-trúc-dự-án)
- [API tham khảo](#-api-tham-khảo)
- [Scripts](#-scripts)
- [Xử lý lỗi thường gặp](#-xử-lý-lỗi-thường-gặp)
- [Đóng góp](#-đóng-góp)
- [Giấy phép & Liên hệ](#-giấy-phép--liên-hệ)

---

## 🚀 Bắt đầu nhanh

Chỉ cần **Node.js 18+** và **MySQL 8+**. Sau khi tạo database và file `.env` trong `backend/`:

```bash
# Backend
cd backend && npm install && npx prisma generate && npx prisma db push
npm run dev
# → http://localhost:5000

# Frontend (terminal mới)
cd frontend && npm install && npm run dev
# → http://localhost:5173
```

Mở trình duyệt tại `http://localhost:5173` và bắt đầu xem.

**Repository:** [github.com/vinzboiz/ThungPhim---FilmWeb](https://github.com/vinzboiz/ThungPhim---FilmWeb)

---

## ✨ Tính năng

| Khu vực | Mô tả |
|--------|--------|
| **Trang chủ** | Banner trailer ngẫu nhiên, hàng Top rating / Phim mới / Theo thể loại, tìm kiếm. Chế độ: Tất cả, Chỉ phim, Chỉ series, Mới & phổ biến. |
| **Chi tiết phim/series** | Thông tin đầy đủ, diễn viên, đạo diễn, thể loại, trailer. Nút Phát, Thêm danh sách, Like. Series: chọn mùa và danh sách tập. |
| **Xem phim / xem tập** | Trình phát video, lưu tiến độ, đánh giá & bình luận, gợi ý xem tiếp. |
| **Tài khoản & Profile** | Đăng ký, đăng nhập, nhiều profile (hồ sơ xem). Danh sách của tôi và Yêu thích theo từng profile. |
| **Danh sách / Yêu thích** | Thẻ phim giống trang chủ, hover hiện panel (Phát, +, Like, Xem thêm), mở overlay thông tin (modal HeroBanner). |
| **Thể loại** | Lọc theo thể loại, năm, quốc gia; cả phim và series; banner thể loại khi vào từ trang chi tiết. |
| **Quản trị (Admin)** | Quản lý phim, series, tập, thể loại, diễn viên. Thêm/sửa phim & series, upload ảnh bìa, banner, trailer, video. |

---

## 🛠 Công nghệ

| Phần | Công nghệ |
|------|-----------|
| **Frontend** | React 19, React Router 7, Vite 7 |
| **Backend** | Node.js, Express 5 |
| **Database** | MySQL 8, Prisma ORM |
| **Upload** | Multer — ảnh: `uploads/images`, video: `uploads/videos` |
| **Xác thực** | JWT, bcrypt |

---

## 📦 Cài đặt chi tiết

### 1. Clone và vào thư mục

```bash
git clone https://github.com/vinzboiz/ThungPhim---FilmWeb.git
cd ThungPhim---FilmWeb
```

### 2. Tạo database MySQL

Tạo database (ví dụ tên `thungphim`). Dùng MySQL Client hoặc phpMyAdmin:

```sql
CREATE DATABASE thungphim CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

### 3. Cấu hình backend

Trong thư mục `backend`, tạo file `.env` (xem [Biến môi trường](#-biến-môi-trường) bên dưới). Ví dụ khi MySQL dùng user `root`, không mật khẩu, database `thungphim`:

```env
DB_HOST=127.0.0.1
DB_PORT=3306
DB_USER=root
DB_PASSWORD=
DB_NAME=thungphim

# Prisma dùng chuỗi kết nối (format: mysql://user:password@host:port/database)
DATABASE_URL="mysql://root:@127.0.0.1:3306/thungphim"

# Tùy chọn: cổng backend (mặc định 5000), chuỗi bí mật JWT (nếu không có sẽ dùng giá trị mặc định cho dev)
PORT=5000
JWT_SECRET="mot-chuoi-bi-mat-dai-ngau-nhien"
```

- Nếu MySQL có mật khẩu: đặt `DB_PASSWORD=mat_khau` và trong `DATABASE_URL` dùng `mysql://root:mat_khau@127.0.0.1:3306/thungphim`.
- Đổi `DB_NAME` và tên database trong `DATABASE_URL` nếu bạn đặt tên khác `thungphim`.

### 4. Cài đặt backend và đồng bộ database

```bash
cd backend
npm install
npx prisma generate
npx prisma db push
```

Tạo sẵn thư mục upload (nếu chưa có):

```bash
mkdir -p uploads/images uploads/videos
```

### 5. Cài đặt frontend

```bash
cd ../frontend
npm install
```

### 6. Chạy ứng dụng

- **Terminal 1:** `cd backend && npm run dev` → API: `http://localhost:5000`
- **Terminal 2:** `cd frontend && npm run dev` → Web: `http://localhost:5173`

Nếu backend chạy ở cổng hoặc host khác, sửa `API_BASE` trong `frontend/src/apis/client.js`.

---

## 🔐 Biến môi trường

Tạo file `backend/.env` với các biến sau. Backend dùng `DB_*` cho kết nối MySQL (pool) và `DATABASE_URL` cho Prisma.

| Biến | Bắt buộc | Mô tả |
|------|----------|--------|
| `DB_HOST` | Không (mặc định 127.0.0.1) | Host MySQL |
| `DB_PORT` | Không (mặc định 3306) | Cổng MySQL |
| `DB_USER` | Không (mặc định root) | User MySQL |
| `DB_PASSWORD` | Không | Mật khẩu MySQL (để trống nếu không có) |
| `DB_NAME` | Không (mặc định thungphim) | Tên database |
| `DATABASE_URL` | Có | Chuỗi kết nối cho Prisma: `mysql://USER:PASSWORD@HOST:PORT/DATABASE` (ví dụ: `mysql://root:@127.0.0.1:3306/thungphim`) |
| `PORT` | Không (mặc định 5000) | Cổng chạy server backend |
| `JWT_SECRET` | Không (có giá trị mặc định cho dev) | Chuỗi bí mật để ký JWT; production nên đặt chuỗi dài, ngẫu nhiên |

---

## 📁 Cấu trúc dự án

```
MOVIE/
├── backend/                    # API Node.js + Express
│   ├── prisma/
│   │   └── schema.prisma      # Mô hình dữ liệu (users, movies, series, ...)
│   ├── src/
│   │   ├── app.js             # Express app, CORS, mount routes
│   │   ├── config/            # DB, Prisma client
│   │   ├── controllers/       # Logic: auth, movies, series, genres, ...
│   │   ├── routes/            # Định nghĩa API routes
│   │   ├── middleware/        # Auth, admin, ...
│   │   └── utils/
│   ├── uploads/               # File tĩnh: images/, videos/
│   └── index.js               # Entry point, listen PORT
│
├── frontend/                   # Ứng dụng React (Vite)
│   ├── src/
│   │   ├── apis/              # API client, getToken, getProfileId, ...
│   │   ├── components/       # Layout, HeroBanner, HomeMovieRow, Detail, ...
│   │   ├── pages/            # HomePage, ContentDetailPage, Watch*, Admin*, ...
│   │   ├── router/           # AppRouter (định tuyến)
│   │   ├── styles/           # CSS global, từng trang/component
│   │   └── main.jsx
│   └── index.html
│
└── README.md
```

---

## 📡 API tham khảo

| Nhóm | Endpoint ví dụ | Mô tả |
|------|----------------|--------|
| **Auth** | `POST /api/auth/login`, `POST /api/auth/register` | Đăng nhập, đăng ký |
| **Phim** | `GET /api/movies`, `GET /api/movies/:id`, `PUT /api/movies/:id` | Danh sách, chi tiết, cập nhật |
| **Series** | `GET /api/series`, `GET /api/series/:id`, `GET /api/series/:id/episodes` | Danh sách, chi tiết, danh sách tập |
| **Gợi ý** | `GET /api/movies/:id/suggestions`, `GET /api/series/:id/suggestions` | Gợi ý theo thể loại + fallback |
| **Hero** | `GET /api/hero/random?type=movie\|series\|featured` | Nội dung ngẫu nhiên cho banner trang chủ |
| **Thể loại** | `GET /api/genres`, `GET /api/genres/top-with-movies` | Danh sách thể loại, top kèm phim/series |
| **Upload** | `POST /api/upload/image`, `POST /api/upload/video` | Upload ảnh (field `image`), video (field `video`) |
| **Watchlist** | `GET /api/watchlist?profile_id=`, `POST /api/watchlist` | Danh sách của tôi |
| **Yêu thích** | `GET /api/favorites?profile_id=`, `POST /api/favorites` | Danh sách yêu thích |
| **Xem** | `GET /api/watch/continue`, `POST /api/watch/progress` | Tiếp tục xem, lưu tiến độ |

Chi tiết từng route nằm trong `backend/src/routes/`.

---

## 📜 Scripts

**Backend (`backend/`)**

| Lệnh | Mô tả |
|------|--------|
| `npm run dev` | Chạy server với nodemon (tự reload khi đổi code) |
| `npm start` | Chạy server với node |

**Frontend (`frontend/`)**

| Lệnh | Mô tả |
|------|--------|
| `npm run dev` | Chạy dev server Vite |
| `npm run build` | Build production |
| `npm run preview` | Xem bản build local |
| `npm run lint` | Chạy ESLint |

---

## 🔧 Xử lý lỗi thường gặp

| Triệu chứng | Gợi ý xử lý |
|-------------|-------------|
| **Không kết nối được MySQL** | Kiểm tra `DATABASE_URL` trong `.env`, MySQL đã chạy và user có quyền truy cập database. |
| **Prisma: "Argument id is missing"** | Đảm bảo gọi API với `id` hợp lệ (số). Nếu từ frontend, kiểm tra route có truyền `:id` đúng. |
| **Upload ảnh không đổi URL trên form** | Kiểm tra request `POST /api/upload/image` trong Network: status 200 và response có `image_url`. Nếu ảnh trên thẻ trang chủ không đổi, nhớ upload cả **Banner ngang** (thẻ dùng `banner_url` ưu tiên). |
| **Frontend không gọi được API** | Kiểm tra backend chạy đúng cổng và `API_BASE` trong `frontend/src/apis/client.js` trỏ đúng (ví dụ `http://localhost:5000`). |
| **CORS lỗi** | Backend đã bật `cors()`. Nếu vẫn lỗi, kiểm tra origin frontend (ví dụ `http://localhost:5173`) có bị chặn không. |

---

## 🤝 Đóng góp

1. **Fork** repository và clone về máy.
2. Tạo **nhánh mới** cho tính năng hoặc sửa lỗi: `git checkout -b feature/ten-tinh-nang`.
3. Cài đặt và chạy theo [Cài đặt chi tiết](#-cài-đặt-chi-tiết), đảm bảo không phá tính năng hiện có.
4. **Commit** với message rõ ràng, rồi **push** lên nhánh của bạn.
5. Mở **Pull Request** vào nhánh chính, mô tả thay đổi và lý do. Maintainer sẽ xem xét.

Mọi thắc mắc hoặc báo lỗi có thể gửi qua **Issues** của repository.

---

## 📄 Giấy phép & Liên hệ

- **Giấy phép:** Dự án sử dụng giấy phép ISC. Xem file `license` trong từng package (nếu có).
- **Liên hệ / Báo lỗi / Đề xuất:** Mở [Issue](https://github.com/vinzboiz/ThungPhim---FilmWeb/issues) trên repository.

---

*ThungPhim — xây dựng với React, Express và MySQL.*
