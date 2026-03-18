# 🎬 ThungPhim

> A Netflix‑style movie & series web app — hero banner with trailer, browse by genre, watch movies/episodes, \"My List\", favorites, and an admin area to manage content.

[![Node](https://img.shields.io/badge/Node.js-18+-339933?logo=node.js)](https://nodejs.org/)
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

You need **Node.js 18+** and **MySQL 8+**. After creating the database and `.env` file in `backend/`:

```bash
# Backend
cd backend && npm install && npx prisma generate && npx prisma db push
npm run dev
# → http://localhost:5000

# Frontend (terminal mới)
cd frontend && npm install && npm run dev
# → http://localhost:5173
```

Open `http://localhost:5173` in your browser.

**Repository:** [github.com/vinzboiz/ThungPhim---FilmWeb](https://github.com/vinzboiz/ThungPhim---FilmWeb)

---

## ✨ Features

| Area | Description |
|------|-------------|
| **Home page** | Random hero banner with trailer, rows for Top rating / New / By genre, search. Modes: All, Movies only, Series only, New & popular. |
| **Movie/series detail** | Full info (cast, director, genres, trailer), actions: Play, Add to list, Like. For series: seasons and episodes list. |
| **Watch movie / episode** | Video player, resume progress, rating & reviews, next‑watch suggestions. |
| **Accounts & profiles** | Register, login, multiple profiles per account. \"My List\" and Favorites per profile. |
| **My List / Favorites** | Same horizontal cards as home; hover panel with Play / + / Like / More, opens HeroBanner modal. |
| **Genres** | Filter by genre, year, country; supports both movies and series; genre banner when coming from detail page. |
| **Notifications** | In‑app notification bell for actions like adding to watchlist, favorites, etc. |
| **Watch history** | \"Continue watching\" row and history page powered by watch progress. |
| **Admin area** | Manage movies, series, episodes, genres, people. Add/edit movies & series, upload poster, banner, trailer, main video, and auto‑generate episode thumbnails from video. |

---

## 🛠 Tech stack

| Layer | Technologies |
|-------|--------------|
| **Frontend** | React 19, React Router 7, Vite 7 |
| **Backend** | Node.js, Express 5 |
| **Database** | MySQL 8, Prisma ORM |
| **Upload** | Multer — images in `uploads/images`, videos in `uploads/videos` |
| **Auth** | JWT, bcrypt |

---

## 📦 Detailed setup

### 1. Clone repo and enter folder

```bash
git clone https://github.com/vinzboiz/ThungPhim---FilmWeb.git
cd ThungPhim---FilmWeb
```

### 2. Create MySQL database

Create a database (example name `thungphim`). Using any MySQL client:

```sql
CREATE DATABASE thungphim CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

### 3. Backend configuration

In the `backend` folder, create a `.env` file (see [Environment variables](#-environment-variables) below). Example for MySQL user `root`, no password, database `thungphim`:

```env
DB_HOST=127.0.0.1
DB_PORT=3306
DB_USER=root
DB_PASSWORD=
DB_NAME=thungphim

# Prisma connection string (format: mysql://user:password@host:port/database)
DATABASE_URL="mysql://root:@127.0.0.1:3306/thungphim"

# Optional: backend port (default 5000), JWT secret (dev has a default fallback)
PORT=5000
JWT_SECRET="mot-chuoi-bi-mat-dai-ngau-nhien"
```

– If MySQL has a password: set `DB_PASSWORD=your_password` and use `mysql://root:your_password@127.0.0.1:3306/thungphim` in `DATABASE_URL`.\n– Change `DB_NAME` and the database name in `DATABASE_URL` if you don’t use `thungphim`.\n\n### 4. Install backend dependencies & sync database

```bash
cd backend
npm install
npx prisma generate
npx prisma db push
```

Create upload folders if they don’t exist:

```bash
mkdir -p uploads/images uploads/videos
```

### 5. Install frontend

```bash
cd ../frontend
npm install
```

### 6. Run the app

- **Terminal 1:** `cd backend && npm run dev` → API: `http://localhost:5000`\n- **Terminal 2:** `cd frontend && npm run dev` → Web: `http://localhost:5173`\n\nIf the backend uses a different host/port, update `API_BASE` in `frontend/src/apis/client.js`.\n\n---\n\n## 🔐 Environment variables\n\nCreate `backend/.env` with the variables below. Backend uses `DB_*` for the MySQL pool and `DATABASE_URL` for Prisma.\n\n| Variable | Required | Description |\n|----------|----------|-------------|\n| `DB_HOST` | No (default 127.0.0.1) | MySQL host |\n| `DB_PORT` | No (default 3306) | MySQL port |\n| `DB_USER` | No (default root) | MySQL user |\n| `DB_PASSWORD` | No | MySQL password (empty if none) |\n| `DB_NAME` | No (default thungphim) | Database name |\n| `DATABASE_URL` | Yes | Prisma connection string: `mysql://USER:PASSWORD@HOST:PORT/DATABASE` (e.g. `mysql://root:@127.0.0.1:3306/thungphim`) |\n| `PORT` | No (default 5000) | Backend HTTP port |\n| `JWT_SECRET` | No (dev has fallback) | Secret key for signing JWT (use a long random string in production) |\n\n---\n\n## 📁 Project structure

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
│   │   ├── components/        # Layout, HeroBanner, HomeMovieRow, Detail, ...
│   │   ├── pages/             # HomePage, ContentDetailPage, Watch*, Admin*, ...
│   │   ├── router/            # AppRouter (routing)
│   │   ├── styles/            # Global CSS + page/component styles
│   │   └── main.jsx
│   └── index.html
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
| **Notifications** | `GET /api/notifications?profile_id=`, `POST /api/notifications/mark-read` | Per‑profile in‑app notifications |

Full route definitions live in `backend/src/routes/`.

---

## 📜 Scripts

**Backend (`backend/`)**

| Script | Description |
|--------|-------------|
| `npm run dev` | Run server with nodemon (auto‑reload on code changes) |
| `npm start` | Run server with node |

**Frontend (`frontend/`)**

| Script | Description |
|--------|-------------|
| `npm run dev` | Start Vite dev server |
| `npm run build` | Build production bundle |
| `npm run preview` | Preview production build locally |
| `npm run lint` | Run ESLint |

---

## 🔧 Common issues

| Symptom | How to fix |
|---------|-----------|
| **Cannot connect to MySQL** | Check `DATABASE_URL` in `.env`, make sure MySQL is running and user has access to the database. |
| **Prisma: \"Argument id is missing\"** | Make sure you call APIs with a valid numeric `id`. On the frontend check routes using `:id`. |
| **Uploaded image does not update URL in form** | Check `POST /api/upload/image` in Network tab: status must be 200 and response must contain `image_url`. If cards on home still show old image, remember that they prioritize **`banner_url`** (upload banner image as well). |
| **Frontend cannot reach API** | Confirm backend is listening on expected host/port and `API_BASE` in `frontend/src/apis/client.js` matches (e.g. `http://localhost:5000`). |
| **CORS errors** | Backend already uses `cors()`. If still failing, verify the frontend origin (e.g. `http://localhost:5173`) is correct and not blocked by proxies or browser extensions. |

---

## 🤝 Contributing

1. **Fork** this repository and clone it locally.\n2. Create a **feature branch**: `git checkout -b feature/your-feature-name`.\n3. Install & run the project following [Detailed setup](#-detailed-setup), ensure you don’t break existing features.\n4. **Commit** with clear messages and **push** your branch.\n5. Open a **Pull Request** into `main`, describe what you changed and why. Maintainers will review it.

For questions or bug reports, please use **GitHub Issues**.

---

## 📄 License & contact

- **License:** ISC. See the `LICENSE` file in each package (if present) or root of the project.\n- **Contact / Bug reports / Feature requests:** open an [Issue](https://github.com/vinzboiz/ThungPhim---FilmWeb/issues) on GitHub.

---

*ThungPhim — built with React, Express and MySQL.*
