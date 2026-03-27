# ThungPhim — Backend (Node.js + Express)

API Express + MySQL (`mysql2`), cùng schema với `backend-spring`.

## Chạy nhanh

```bash
cd backend
cp .env.example .env   # chỉnh DB và GOOGLE_CLIENT_ID
npm install
npm run dev
```

Mặc định: **http://localhost:5000** (hoặc `PORT` trong `.env`).

## Đăng nhập Google

1. Tạo OAuth Client ID tại [Google Cloud Console](https://console.cloud.google.com/apis/credentials) (Web application).
2. **Authorized JavaScript origins:** `http://localhost:8080` (frontend Vite).
3. Thêm vào `.env`:

```env
GOOGLE_CLIENT_ID=xxx.apps.googleusercontent.com
```

4. Frontend gửi `POST /api/auth/google` với body `{ "id_token": "<credential từ Google>" }` — giống Spring Boot.

Backend xác minh token qua `https://oauth2.googleapis.com/tokeninfo?id_token=...` và kiểm tra `aud` = `GOOGLE_CLIENT_ID`.

## Yêu cầu

- Node.js **18+** (dùng `fetch` có sẵn)
- MySQL 8, database `thungphim` đã chạy `backend-spring/src/main/resources/schema.sql`

## Biến môi trường

| Biến | Mô tả |
|------|--------|
| `DB_*` | Kết nối MySQL |
| `JWT_SECRET` | Ký JWT (nên ≥ 32 ký tự production) |
| `GOOGLE_CLIENT_ID` | Client ID OAuth — bắt buộc để bật đăng nhập Google |
| `PORT` | Port server (mặc định 5000) |
