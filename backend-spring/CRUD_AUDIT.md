# Báo cáo kiểm tra CRUD – Backend Spring vs Node

## ✅ Controller đủ CRUD (khớp với Node)

### AuthController (`/api/auth`)
| Method | Path | Node | Spring |
|--------|------|------|--------|
| POST | /register | ✓ | ✓ |
| POST | /login | ✓ | ✓ |
| POST | /logout | ✓ | ✓ |
| GET | /me | ✓ | ✓ |
| POST | /forgot-password | ✓ | ✓ |
| POST | /reset-password | ✓ | ✓ |

### ProfilesController (`/api/profiles`)
| Method | Path | Node | Spring |
|--------|------|------|--------|
| GET | / | ✓ | ✓ |
| POST | / | ✓ | ✓ |
| PUT | /:id | ✓ | ✓ |
| DELETE | /:id | ✓ | ✓ |
| POST | /:id/verify-pin | ✓ | ✓ |

### GenresController (`/api/genres`)
| Method | Path | Node | Spring |
|--------|------|------|--------|
| GET | / | ✓ | ✓ |
| GET | /top-with-movies | ✓ | ✓ |
| POST | / | ✓ | ✓ |
| PUT | /:id | ✓ | ✓ |
| DELETE | /:id | ✓ | ✓ |

### PersonsController (`/api/persons`)
| Method | Path | Node | Spring |
|--------|------|------|--------|
| GET | / | ✓ | ✓ |
| GET | /:id | ✓ | ✓ |
| GET | /:id/movies | ✓ | ✓ |
| POST | / | ✓ | ✓ |
| PUT | /:id | ✓ | ✓ |
| DELETE | /:id | ✓ | ✓ |

### MoviesController (`/api/movies`)
| Method | Path | Node | Spring |
|--------|------|------|--------|
| GET | / | ✓ | ✓ |
| GET | /:id | ✓ | ✓ |
| GET | /search | ✓ | ✓ |
| GET | /top-rating | ✓ | ✓ |
| GET | /trending | ✓ | ✓ |
| GET | /random-with-trailer | ✓ | ✓ |
| GET | /:id/suggestions | ✓ | ✓ |
| GET | /:id/like-status | ✓ | ✓ |
| GET | /:id/genres | ✓ | ✓ |
| GET | /:id/cast | ✓ | ✓ |
| POST | / | ✓ | ✓ |
| PUT | /:id | ✓ | ✓ |
| DELETE | /:id | ✓ | ✓ |
| POST | /:id/like | ✓ | ✓ |
| DELETE | /:id/like | ✓ | ✓ |
| POST | /:id/genres | ✓ | ✓ |
| POST | /:id/cast | ✓ | ✓ |
| DELETE | /:movieId/cast/:personId | ✓ | ✓ |

### SeriesController (`/api/series`)
| Method | Path | Node | Spring |
|--------|------|------|--------|
| GET | / | ✓ | ✓ |
| GET | /:id | ✓ | ✓ |
| GET | /search | ✓ | ✓ |
| GET | /episode/:episodeId | ✓ | ✓ |
| GET | /:id/suggestions | ✓ | ✓ |
| GET | /:id/like-status | ✓ | ✓ |
| GET | /:id/episodes | ✓ | ✓ |
| GET | /:id/cast | ✓ | ✓ |
| POST | / | ✓ | ✓ |
| PUT | /:id | ✓ | ✓ |
| DELETE | /:id | ✓ | ✓ |
| POST | /:id/like | ✓ | ✓ |
| DELETE | /:id/like | ✓ | ✓ |
| POST | /:id/genres | ✓ | ✓ |
| POST | /:id/cast | ✓ | ✓ |
| DELETE | /:id/cast/:personId | ✓ | ✓ |
| POST | /episodes | ✓ | ✓ |
| PUT | /episodes/:episodeId | ✓ | ✓ |
| DELETE | /episodes/:episodeId | ✓ | ✓ |
| POST | /:id/seasons | ✓ | ✓ |
| PUT | /:id/seasons/:seasonId | ✓ | ✓ |
| DELETE | /:id/seasons/:seasonId | ✓ | ✓ |

### UploadController (`/api/upload`)
| Method | Path | Node | Spring |
|--------|------|------|--------|
| POST | /video | ✓ | ✓ |
| POST | /image | ✓ | ✓ |
| POST | /episode-video/:episodeId | ✓ | ✓ |
| POST | /episode-thumbnail-from-video/:episodeId | ✓ | ✓ |

### WatchController (`/api/watch`)
| Method | Path | Node | Spring |
|--------|------|------|--------|
| GET | /progress | ✓ | ✓ |
| POST | /progress | ✓ | ✓ |
| GET | /continue | ✓ | ✓ |
| GET | /history | ✓ | ✓ |

### WatchlistController (`/api/watchlist`)
| Method | Path | Node | Spring |
|--------|------|------|--------|
| GET | / | ✓ | ✓ |
| POST | / | ✓ | ✓ |
| DELETE | /:movieId | ✓ | ✓ (hỗ trợ type=series|episode qua query) |

### FavoritesController (`/api/favorites`)
| Method | Path | Node | Spring |
|--------|------|------|--------|
| GET | / | ✓ | ✓ |
| GET | /check | ✓ | ✓ |
| POST | / | ✓ | ✓ |
| DELETE | /:movieId | ✓ | ✓ |

### ReviewsController (`/api/reviews`)
| Method | Path | Node | Spring |
|--------|------|------|--------|
| GET | /movies/:id | ✓ | ✓ |
| GET | /episodes/:id | ✓ | ✓ |
| GET | /series/:id | ✓ | ✓ |
| POST | / | ✓ | ✓ |

### AdminController (`/api/admin`)
| Method | Path | Node | Spring |
|--------|------|------|--------|
| GET | /users | ✓ | ✓ |
| PATCH | /users/:id | ✓ | ✓ |

### NotificationsController (`/api/notifications`)
| Method | Path | Node | Spring |
|--------|------|------|--------|
| GET | / | ✓ | ✓ |
| PATCH | /mark-all-read | ✓ | ✓ |

### CountriesController (`/api/countries`)
| Method | Path | Node | Spring |
|--------|------|------|--------|
| GET | / | ✓ | ✓ |

### HeroController (`/api/hero`)
| Method | Path | Node | Spring |
|--------|------|------|--------|
| GET | /random | ✓ | ✓ |

### EpisodesController (`/api/episodes`)
| Method | Path | Node | Spring |
|--------|------|------|--------|
| GET | /:id/cast | ✓ | ✓ |
| POST | /:id/cast | ✓ | ✓ |
| DELETE | /:episodeId/cast/:personId | ✓ | ✓ |

---

## Tổng kết

- **Tất cả controllers đã đủ CRUD:** Auth, Profiles, Genres, Persons, Movies, Series, Episodes, Upload, Watch, Watchlist, Favorites, Reviews, Admin, Notifications, Countries, Hero.
