# ThungPhim

A web application for browsing and watching movies and series (catalogue-style UX similar to major streaming platforms): home hero with trailer, genre and filter browsing, detail pages, playback, personal lists, favorites, watch history, and an admin area for content management.

**Primary stack:** React (Vite), Spring Boot, MySQL.

---

## Contents

1. [Prerequisites](#prerequisites)
2. [Quick start](#quick-start)
3. [Detailed setup](#detailed-setup)
4. [Project structure](#project-structure)
5. [Features](#features)
6. [Technology stack](#technology-stack)
7. [Environment variables](#environment-variables)
8. [API overview](#api-overview)
9. [Troubleshooting](#troubleshooting)
10. [Common commands](#common-commands)

---

## Prerequisites

| Tool | Suggested version |
|------|-------------------|
| Java | 17 or newer |
| Maven | 3.6+ |
| Node.js | 18+ |
| MySQL | 8+ |

---

## Quick start

```bash
git clone <repository-url>
cd MOVIE

# Create the database and apply schema
# Create a database named thungphim (utf8mb4), then run:
# backend-spring/src/main/resources/schema.sql

# Upload directories (create manually; not committed)
mkdir -p uploads/images uploads/videos

# Terminal 1 — Backend
cd backend-spring
mvn spring-boot:run

# Terminal 2 — Frontend
cd frontend
npm install
npm run dev
```

- **API:** `http://localhost:5000` (see `application.properties`)
- **Web UI:** `http://localhost:8080` (see `frontend/vite.config.js`)

The frontend calls the API using `API_BASE` in `frontend/src/apis/client.js` (default `http://localhost:5000`).

---

## Detailed setup

### 1. Database

1. Create the database:

```sql
CREATE DATABASE thungphim CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

2. Run `backend-spring/src/main/resources/schema.sql` against that database.

3. Optional: apply extra SQL migrations under `backend-spring/src/main/resources/db/` when documented (e.g. skip-intro or other schema updates).

### 2. Spring backend

Configuration file: `backend-spring/src/main/resources/application.properties`.

| Setting | Notes |
|---------|--------|
| `server.port` | Default `5000` |
| `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME` | MySQL connection (overridable via environment) |
| `jwt.secret` | **Production:** use a long random secret (32+ characters recommended) |
| `app.google.client-id` | Google OAuth web client ID (backend verifies Google sign-in) |
| `app.upload.root` | Upload root (default `../uploads` relative to the backend module) |

Ensure `uploads/images` and `uploads/videos` exist (typically at the repo root next to `backend-spring` and `frontend`).

### 3. Frontend

```bash
cd frontend
cp .env.example .env
```

Edit `.env` if you use Google sign-in:

```env
VITE_GOOGLE_CLIENT_ID=<client-id>.apps.googleusercontent.com
```

The value must match `app.google.client-id` on the backend and **Authorized JavaScript origins** in Google Cloud Console (e.g. `http://localhost:8080` for local dev).

### 4. Google sign-in (summary)

1. Google Cloud Console → APIs & Services → Credentials → OAuth 2.0 Client ID (Web application).
2. **Authorized JavaScript origins:** add your frontend origin (dev: `http://localhost:8080`).
3. Sync the Client ID into `application.properties` and `frontend/.env`, then restart backend and frontend.

---

## Project structure

```
MOVIE/
├── backend/                 # Optional Node.js + Express API (same MySQL schema)
├── backend-spring/          # Primary API (Spring Boot 3, Java 17)
│   ├── src/main/java/com/thungphim/
│   │   ├── controller/
│   │   ├── service/
│   │   ├── entity/
│   │   ├── repository/
│   │   ├── config/
│   │   ├── security/        # JWT, etc.
│   │   └── dto/
│   └── src/main/resources/
│       ├── application.properties
│       ├── schema.sql
│       └── db/              # Optional extra SQL migrations
├── frontend/                # React + Vite
│   ├── src/
│   │   ├── apis/            # HTTP client, token, profile helpers
│   │   ├── components/
│   │   ├── hooks/
│   │   ├── pages/
│   │   ├── providers/
│   │   ├── router/
│   │   ├── styles/
│   │   └── utils/
│   ├── .env.example
│   └── vite.config.js
├── uploads/                 # Uploaded media (gitignored; create locally)
│   ├── images/
│   └── videos/
└── README.md
```

---

## Features

| Area | Description |
|------|-------------|
| Home | Hero trailer banner, content rows, search; context filters (e.g. movies / series / new). |
| Detail | Movie or series metadata, trailer, cast; series include seasons and episodes. |
| Playback | Watch pages, progress, reviews, recommendations; intro / skip-intro depends on backend and schema. |
| Account | Register, login, Google sign-in, profile selection; account page. |
| Personalization | Watchlist, favorites, watch history, in-app notifications. |
| Discovery | Genres, browse routes, dedicated search page. |
| Admin | CRUD for movies, series, episodes, genres, people, users; image and video uploads. |

---

## Technology stack

| Layer | Technology |
|-------|------------|
| Frontend | React 19, React Router 7, Vite 7, ESLint |
| Backend | Java 17, Spring Boot 3.2, Spring Security, Spring Data JPA |
| Database | MySQL 8 |
| Auth | JWT (JJWT), BCrypt; Google OAuth (ID token verified on the server) |
| Upload | Multipart; files stored under `uploads/` |

---

## Environment variables

### Backend (`application.properties` or equivalent env vars)

| `DB_*` variable | Purpose |
|-----------------|---------|
| `DB_HOST` | MySQL host |
| `DB_PORT` | MySQL port |
| `DB_USER` / `DB_PASSWORD` | MySQL credentials |
| `DB_NAME` | Database name |

### Frontend (`.env`)

| Variable | Required | Description |
|----------|----------|-------------|
| `VITE_GOOGLE_CLIENT_ID` | No | Required only if Google sign-in is enabled in the UI |

---

## API overview

Typical REST groups (prefix `/api`):

| Group | Examples | Notes |
|-------|----------|--------|
| Auth | `POST /api/auth/login`, `POST /api/auth/register`, `POST /api/auth/google` | Returns JWT to the client |
| Movies / Series | `GET /api/movies`, `GET /api/series`, `GET /api/series/:id/episodes` | Lists and detail |
| Hero | `GET /api/hero/random` | Home banner |
| Genres / Countries | `GET /api/genres`, `GET /api/countries` | Metadata |
| Watchlist / Favorites | `GET` / `POST` / `DELETE` ... | Personal lists |
| Watch progress | `GET` / `POST` ... `/watch/...` | Continue watching, save progress |
| Upload | `POST /api/upload/image`, `POST /api/upload/video` | Authenticated uploads |
| Admin | `GET` / `PATCH` ... `/api/admin/...` | User management, etc. |

See `backend-spring/src/main/java/com/thungphim/controller/` for full endpoints.

---

## Troubleshooting

| Symptom | What to check |
|---------|----------------|
| Port 5000 in use | Change `server.port` or stop the process using the port. |
| Cannot connect to MySQL | MySQL service, `DB_*` values, firewall. |
| JWT errors / weak key | Set a long `jwt.secret` in production. |
| Frontend cannot reach API | Backend running; `API_BASE` in `client.js` matches the API URL. |
| CORS | Backend must allow the frontend origin (e.g. `http://localhost:8080`). |
| Uploads / images missing | Create `uploads/images` and `uploads/videos`; verify `app.upload.*` paths. |
| Google sign-in fails | Client ID and JavaScript origins in Google Console; restart both apps. |

---

## Common commands

**Backend (`backend-spring/`):**

| Command | Description |
|---------|-------------|
| `mvn spring-boot:run` | Run the dev server |
| `mvn package -DskipTests` | Build the JAR |
| `mvn compile` | Compile only |

**Frontend (`frontend/`):**

| Command | Description |
|---------|-------------|
| `npm run dev` | Dev server (port 8080) |
| `npm run build` | Production build |
| `npm run preview` | Preview production build |
| `npm run lint` | Run ESLint |

---

## License and contributions

Follow the conventions of this repository (Issues, Pull Requests). Add a `LICENSE` file at the repo root if you need an explicit license statement.

---

*This document describes the ThungPhim monorepo at a high level. Production deployment (HTTPS, reverse proxy, secrets management) should be documented for your own environment.*
