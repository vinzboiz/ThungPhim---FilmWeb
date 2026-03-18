const { prisma } = require('../config/prisma');
const { pool } = require('../config/db');
const { normalize, escapeLike } = require('../utils/normalize');

async function listMovies(req, res) {
  const { genre_id, profile_id, year_from, year_to, country_code, limit } = req.query;
  try {
    const where = {};

    if (genre_id) {
      where.movie_genres = {
        some: { genre_id: Number(genre_id) },
      };
    }

    const yFrom = year_from != null && year_from !== '' ? Number(year_from) : null;
    const yTo = year_to != null && year_to !== '' ? Number(year_to) : null;
    if (yFrom != null && !Number.isNaN(yFrom) || yTo != null && !Number.isNaN(yTo)) {
      where.release_year = {};
      if (yFrom != null && !Number.isNaN(yFrom)) where.release_year.gte = yFrom;
      if (yTo != null && !Number.isNaN(yTo)) where.release_year.lte = yTo;
    }
    if (country_code != null && country_code !== '') {
      where.country_code = String(country_code).trim();
    }

    // Kids mode / max_maturity_rating filter (optional)
    if (profile_id) {
      const profile = await prisma.profiles.findUnique({
        where: { id: Number(profile_id) },
        select: { max_maturity_rating: true },
      });
      if (profile?.max_maturity_rating) {
        where.OR = [
          { age_rating: null },
          { age_rating: { lte: profile.max_maturity_rating } },
        ];
      }
    }

    const take = Math.min(Number(limit) || 50, 100);

    const movies = await prisma.movies.findMany({
      where,
      orderBy: { id: 'desc' },
      take,
      select: {
        id: true,
        title: true,
        short_intro: true,
        description: true,
        thumbnail_url: true,
        banner_url: true,
        age_rating: true,
        is_featured: true,
        release_year: true,
        country_code: true,
        rating: true,
        created_at: true,
      },
    });

    res.json(movies);
  } catch (err) {
    console.error('listMovies error:', err);
    res.status(500).json({
      message: 'Internal server error',
      error: process.env.NODE_ENV !== 'production' ? err.message : undefined,
    });
  }
}

async function getMovieById(req, res) {
  const { id } = req.params;
  try {
    const movieId = Number(id);
    if (!Number.isInteger(movieId) || movieId <= 0) {
      return res.status(400).json({ message: 'movie id không hợp lệ' });
    }
    const movie = await prisma.movies.findUnique({
      where: { id: movieId },
    });

    if (!movie) {
      return res.status(404).json({ message: 'Movie not found' });
    }

    const [cast, genreRows, countRows] = await Promise.all([
      prisma.cast.findMany({
        where: { movie_id: movieId },
        select: {
          role: true,
          person: {
            select: {
              id: true,
              name: true,
              avatar_url: true,
            },
          },
        },
      }),
      prisma.movie_genres.findMany({
        where: { movie_id: movieId },
        select: { genre: { select: { id: true, name: true } } },
      }),
      pool.query('SELECT COUNT(*) AS cnt FROM reviews WHERE movie_id = ?', [movieId]),
    ]);

    const movieWithCast = {
      ...movie,
      cast: cast.map((c) => ({
        id: c.person.id,
        name: c.person.name,
        avatar_url: c.person.avatar_url,
        role: c.role,
      })),
      genres: (genreRows || []).map((r) => r.genre),
      review_count: Number(countRows[0]?.[0]?.cnt ?? 0),
    };

    res.json(movieWithCast);
  } catch (err) {
    console.error('getMovieById error:', err);
    res.status(500).json({
      message: 'Internal server error',
      error: process.env.NODE_ENV !== 'production' ? err.message : undefined,
    });
  }
}

/** Top 10 phim + series có rating cao nhất. Query: type=movie|series, featured=1 */
async function listTopRatingMovies(req, res) {
  try {
    const limit = Math.min(Number(req.query.limit) || 10, 20);
    const type = (req.query.type || '').toLowerCase();
    const featured = req.query.featured === '1' || req.query.featured === 'true';
    const feat = featured ? ' AND is_featured = 1' : '';
    let sql;
    if (type === 'movie') {
      sql = `SELECT id, title, short_intro, thumbnail_url, banner_url, age_rating, release_year, country_code, rating, 'movie' AS type
        FROM movies WHERE rating IS NOT NULL AND rating > 0${feat} ORDER BY rating DESC, id DESC LIMIT ?`;
    } else if (type === 'series') {
      sql = `SELECT id, title, NULL AS short_intro, thumbnail_url, banner_url, age_rating, release_year, country_code, rating, 'series' AS type
        FROM series WHERE rating IS NOT NULL AND rating > 0${feat} ORDER BY rating DESC, id DESC LIMIT ?`;
    } else {
      sql = `(SELECT id, title, short_intro, thumbnail_url, banner_url, age_rating, release_year, country_code, rating, 'movie' AS type
        FROM movies WHERE rating IS NOT NULL AND rating > 0${feat})
       UNION ALL
       (SELECT id, title, NULL AS short_intro, thumbnail_url, banner_url, age_rating, release_year, country_code, rating, 'series' AS type
        FROM series WHERE rating IS NOT NULL AND rating > 0${feat})
       ORDER BY rating DESC, id DESC LIMIT ?`;
    }
    const [rows] = await pool.query(sql, [limit]);
    res.json(rows || []);
  } catch (err) {
    console.error('listTopRatingMovies error:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
}

/** Phim mới / trending. Query: type=movie|series, featured=1 */
async function listTrendingMovies(req, res) {
  try {
    const limit = Math.min(Number(req.query.limit) || 20, 50);
    const type = (req.query.type || '').toLowerCase();
    const featured = req.query.featured === '1' || req.query.featured === 'true';
    const feat = featured ? ' AND is_featured = 1' : '';
    let sql;
    if (type === 'movie') {
      sql = `SELECT id, title, short_intro, thumbnail_url, banner_url, age_rating, release_year, country_code, rating, 'movie' AS type FROM movies WHERE 1=1${feat} ORDER BY id DESC LIMIT ?`;
    } else if (type === 'series') {
      sql = `SELECT id, title, NULL AS short_intro, thumbnail_url, banner_url, age_rating, release_year, country_code, rating, 'series' AS type FROM series WHERE 1=1${feat} ORDER BY id DESC LIMIT ?`;
    } else {
      sql = `(SELECT id, title, short_intro, thumbnail_url, banner_url, age_rating, release_year, country_code, rating, 'movie' AS type FROM movies WHERE 1=1${feat})
       UNION ALL
       (SELECT id, title, NULL AS short_intro, thumbnail_url, banner_url, age_rating, release_year, country_code, rating, 'series' AS type FROM series WHERE 1=1${feat})
       ORDER BY id DESC LIMIT ?`;
    }
    const [rows] = await pool.query(sql, [limit]);
    res.json(rows || []);
  } catch (err) {
    console.error('listTrendingMovies error:', err);
    res.status(500).json({
      message: 'Internal server error',
      error: process.env.NODE_ENV !== 'production' ? err.message : undefined,
    });
  }
}

async function searchMovies(req, res) {
  const raw = (req.query.q ?? '').trim();
  if (!raw) {
    return res.json([]);
  }
  const normalized = normalize(raw);
  if (!normalized) {
    return res.json([]);
  }
  try {
    const likeNorm = `%${escapeLike(normalized)}%`;
    const likeRaw = `%${escapeLike(raw)}%`;
    const [rows] = await pool.query(
      `SELECT id, title, short_intro, description, thumbnail_url, banner_url, age_rating
       FROM movies
       WHERE (title_normalized IS NOT NULL AND title_normalized LIKE ?)
          OR (title_normalized IS NULL AND title LIKE ?)
       ORDER BY id DESC LIMIT 50`,
      [likeNorm, likeRaw]
    );
    res.json(rows || []);
  } catch (err) {
    console.error('searchMovies error:', err);
    res.status(500).json({
      message: 'Internal server error',
      error: process.env.NODE_ENV !== 'production' ? err.message : undefined,
    });
  }
}

async function createMovie(req, res) {
  const {
    title,
    short_intro,
    description,
    release_year,
    duration_minutes,
    thumbnail_url,
    banner_url,
    trailer_url,
    trailer_youtube_url,
    video_url,
    rating,
    age_rating,
    country_code,
    is_featured,
  } = req.body;

  if (!title) {
    return res.status(400).json({ message: 'title là bắt buộc' });
  }

  try {
    const movie = await prisma.movies.create({
      data: {
        title,
        short_intro: short_intro || null,
        description: description || null,
        release_year: release_year ? Number(release_year) : null,
        duration_minutes: duration_minutes ? Number(duration_minutes) : null,
        thumbnail_url: thumbnail_url || null,
        banner_url: banner_url || null,
        trailer_url: trailer_url || null,
        trailer_youtube_url: trailer_youtube_url || null,
        video_url: video_url || null,
        rating: rating != null ? Number(rating) : null,
        age_rating: age_rating || null,
        country_code: country_code || null,
        is_featured: !!is_featured,
      },
    });
    await pool.query('UPDATE movies SET title_normalized = ? WHERE id = ?', [normalize(title), movie.id]).catch(() => {});

    res.status(201).json(movie);
  } catch (err) {
    console.error('createMovie error:', err);
    res.status(500).json({
      message: 'Internal server error',
      error: process.env.NODE_ENV !== 'production' ? err.message : undefined,
    });
  }
}

async function updateMovie(req, res) {
  const { id } = req.params;
  const {
    title,
    short_intro,
    description,
    release_year,
    duration_minutes,
    thumbnail_url,
    banner_url,
    trailer_url,
    trailer_youtube_url,
    video_url,
    rating,
    age_rating,
    country_code,
    is_featured,
  } = req.body;

  try {
    const movieId = Number(id);
    const existing = await prisma.movies.findUnique({
      where: { id: movieId },
      select: { id: true },
    });
    if (!existing) {
      return res.status(404).json({ message: 'Movie not found' });
    }

    const updated = await prisma.movies.update({
      where: { id: movieId },
      data: {
        title: title ?? undefined,
        short_intro: short_intro ?? undefined,
        description: description ?? undefined,
        release_year: release_year != null ? Number(release_year) : undefined,
        duration_minutes:
          duration_minutes != null ? Number(duration_minutes) : undefined,
        thumbnail_url: thumbnail_url ?? undefined,
        banner_url: banner_url ?? undefined,
        trailer_url: trailer_url ?? undefined,
        trailer_youtube_url: trailer_youtube_url ?? undefined,
        video_url: video_url ?? undefined,
        rating: rating != null ? Number(rating) : undefined,
        age_rating: age_rating ?? undefined,
        country_code: country_code ?? undefined,
        is_featured:
          typeof is_featured === 'boolean' ? !!is_featured : undefined,
      },
    });
    if (title != null && title !== undefined) {
      await pool.query('UPDATE movies SET title_normalized = ? WHERE id = ?', [normalize(title), movieId]).catch(() => {});
    }

    res.json(updated);
  } catch (err) {
    console.error('updateMovie error:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
}

async function deleteMovie(req, res) {
  const { id } = req.params;
  try {
    const movieId = Number(id);
    const existing = await prisma.movies.findUnique({
      where: { id: movieId },
      select: { id: true },
    });
    if (!existing) {
      return res.status(404).json({ message: 'Movie not found' });
    }

    await prisma.$transaction([
      prisma.movie_genres.deleteMany({ where: { movie_id: movieId } }),
      prisma.cast.deleteMany({ where: { movie_id: movieId } }),
      prisma.watchlist.deleteMany({ where: { movie_id: movieId } }),
      prisma.watch_history.deleteMany({ where: { movie_id: movieId } }),
      prisma.reviews.deleteMany({ where: { movie_id: movieId } }),
      prisma.movies.delete({ where: { id: movieId } }),
    ]);

    res.json({ message: 'Đã xoá phim và dữ liệu liên quan' });
  } catch (err) {
    console.error('deleteMovie error:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
}

// Like phim: mỗi profile chỉ like 1 lần (dùng content_likes)
async function likeMovie(req, res) {
  const { id } = req.params;
  const movieId = Number(id);
  const profileId = req.body?.profile_id != null ? Number(req.body.profile_id) : null;
  if (!Number.isInteger(movieId) || movieId <= 0) {
    return res.status(400).json({ message: 'movieId không hợp lệ' });
  }
  if (!profileId) {
    return res.status(400).json({ message: 'profile_id là bắt buộc' });
  }
  try {
    const [existing] = await pool.query(
      'SELECT 1 FROM content_likes WHERE profile_id = ? AND content_type = ? AND content_id = ?',
      [profileId, 'movie', movieId]
    );
    if (existing && existing.length > 0) {
      const [row] = await pool.query('SELECT id, like_count FROM movies WHERE id = ?', [movieId]);
      return res.json({
        id: movieId,
        like_count: Number(row[0]?.like_count) || 0,
        user_has_liked: true,
      });
    }
    await pool.query(
      'INSERT IGNORE INTO content_likes (profile_id, content_type, content_id) VALUES (?, ?, ?)',
      [profileId, 'movie', movieId]
    );
    const [inserted] = await pool.query('SELECT 1 FROM content_likes WHERE profile_id = ? AND content_type = ? AND content_id = ?', [profileId, 'movie', movieId]);
    if (inserted && inserted.length > 0) {
      await pool.query('UPDATE movies SET like_count = IFNULL(like_count, 0) + 1 WHERE id = ?', [movieId]);
    }
    const [rows] = await pool.query('SELECT id, like_count FROM movies WHERE id = ?', [movieId]);
    res.json({
      id: rows[0]?.id ?? movieId,
      like_count: Number(rows[0]?.like_count) || 0,
      user_has_liked: true,
    });
  } catch (err) {
    console.error('likeMovie error:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
}

// Bỏ like phim (toggle off)
async function unlikeMovie(req, res) {
  const movieId = Number(req.params.id);
  const profileId = req.query.profile_id != null ? Number(req.query.profile_id) : null;
  if (!Number.isInteger(movieId) || movieId <= 0) {
    return res.status(400).json({ message: 'movieId không hợp lệ' });
  }
  if (!profileId) {
    return res.status(400).json({ message: 'profile_id là bắt buộc' });
  }
  try {
    const [deleted] = await pool.query(
      'DELETE FROM content_likes WHERE profile_id = ? AND content_type = ? AND content_id = ?',
      [profileId, 'movie', movieId]
    );
    if (deleted && deleted.affectedRows > 0) {
      await pool.query('UPDATE movies SET like_count = GREATEST(IFNULL(like_count, 0) - 1, 0) WHERE id = ?', [movieId]);
    }
    const [rows] = await pool.query('SELECT id, like_count FROM movies WHERE id = ?', [movieId]);
    res.json({
      id: rows[0]?.id ?? movieId,
      like_count: Number(rows[0]?.like_count) || 0,
      user_has_liked: false,
    });
  } catch (err) {
    console.error('unlikeMovie error:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
}

// Trạng thái like phim cho profile (để disable nút sau khi đã like)
async function getMovieLikeStatus(req, res) {
  const movieId = Number(req.params.id);
  const profileId = req.query.profile_id != null ? Number(req.query.profile_id) : null;
  if (!Number.isInteger(movieId) || movieId <= 0) {
    return res.status(400).json({ message: 'movie id không hợp lệ' });
  }
  try {
    const [movie] = await pool.query('SELECT like_count FROM movies WHERE id = ?', [movieId]);
    const likeCount = movie.length ? Number(movie[0].like_count) || 0 : 0;
    let userHasLiked = false;
    if (profileId) {
      const [liked] = await pool.query(
        'SELECT 1 FROM content_likes WHERE profile_id = ? AND content_type = ? AND content_id = ?',
        [profileId, 'movie', movieId]
      );
      userHasLiked = liked && liked.length > 0;
    }
    res.json({ like_count: likeCount, user_has_liked: userHasLiked });
  } catch (err) {
    console.error('getMovieLikeStatus error:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
}

// Gán genres cho movie (1 phim có thể có nhiều thể loại)
async function setMovieGenres(req, res) {
  const { id } = req.params;
  let { genre_ids } = req.body;

  // Hỗ trợ cả mảng hoặc chuỗi "1,2,3"
  if (!Array.isArray(genre_ids)) {
    if (typeof genre_ids === 'string') {
      genre_ids = genre_ids.split(',').map((s) => s.trim()).filter(Boolean);
    } else {
      return res.status(400).json({ message: 'genre_ids phải là một mảng id (ví dụ: [1, 2, 3])' });
    }
  }

  const validIds = [...new Set(genre_ids.map((g) => Number(g)).filter((g) => g > 0 && Number.isInteger(g)))];

  try {
    const movieId = Number(id);
    if (!movieId || !Number.isInteger(movieId)) {
      return res.status(400).json({ message: 'Movie ID không hợp lệ' });
    }

    const existing = await prisma.movies.findUnique({
      where: { id: movieId },
      select: { id: true },
    });
    if (!existing) {
      return res.status(404).json({ message: 'Movie not found' });
    }

    await prisma.movie_genres.deleteMany({
      where: { movie_id: movieId },
    });

    if (validIds.length > 0) {
      const data = validIds.map((genre_id) => ({
        movie_id: movieId,
        genre_id,
      }));
      await prisma.movie_genres.createMany({ data, skipDuplicates: true });
    }

    res.json({ message: 'Đã cập nhật thể loại cho phim' });
  } catch (err) {
    console.error('setMovieGenres error:', err);
    res.status(500).json({ message: err.message || 'Internal server error' });
  }
}

/**
 * Trả về 1 phim ngẫu nhiên có trailer local (đã upload vào /uploads/videos/...).
 * -> Chỉ những phim mà admin upload file (mp4/mp3...) mới được dùng làm banner.
 */
async function randomMovieWithTrailer(req, res) {
  try {
    // ORDER BY RAND() LIMIT 1 — chọn ngẫu nhiên trực tiếp trong DB (không cache danh sách).
    const rows = await prisma.$queryRaw`
      SELECT id, title, short_intro, thumbnail_url, banner_url, trailer_url, description, age_rating
      FROM movies
      WHERE trailer_url IS NOT NULL
        AND trailer_url != ''
        AND trailer_url LIKE '/uploads/%'
      ORDER BY RAND()
      LIMIT 1
    `;

    const pick = Array.isArray(rows) && rows[0];
    if (!pick) {
      return res.status(404).json({ message: 'Chưa có phim nào có trailer' });
    }

    // Tránh cache banner — mỗi lần gọi là một phim ngẫu nhiên khác có thể
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');
    res.json(pick);
  } catch (err) {
    console.error('randomMovieWithTrailer error:', err);
    res.status(500).json({
      message: 'Internal server error',
      error: process.env.NODE_ENV !== 'production' ? err.message : undefined,
    });
  }
}

async function getMovieCast(req, res) {
  const { id } = req.params;
  try {
    const movieId = Number(id);
    const cast = await prisma.cast.findMany({
      where: { movie_id: movieId },
      select: {
        person_id: true,
        role: true,
        person: { select: { id: true, name: true, avatar_url: true } },
      },
    });
    res.json(cast.map((c) => ({ ...c.person, role: c.role })));
  } catch (err) {
    console.error('getMovieCast error:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
}

async function addMovieCast(req, res) {
  const { id } = req.params;
  const { person_id, role } = req.body;
  if (!person_id) {
    return res.status(400).json({ message: 'person_id là bắt buộc' });
  }
  try {
    const movieId = Number(id);
    await prisma.cast.create({
      data: {
        movie_id: movieId,
        episode_id: null,
        person_id: Number(person_id),
        role: role || 'actor',
      },
    });
    res.status(201).json({ message: 'Đã gán cast cho phim' });
  } catch (err) {
    console.error('addMovieCast error:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
}

async function removeMovieCast(req, res) {
  const { movieId, personId } = req.params;
  try {
    await prisma.cast.deleteMany({
      where: {
        movie_id: Number(movieId),
        person_id: Number(personId),
        episode_id: null,
      },
    });
    res.json({ message: 'Đã xoá cast khỏi phim' });
  } catch (err) {
    console.error('removeMovieCast error:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
}

async function getMovieGenres(req, res) {
  const { id } = req.params;
  try {
    const movieId = Number(id);
    if (!Number.isInteger(movieId) || movieId <= 0) {
      return res.status(400).json({ message: 'movie id không hợp lệ' });
    }
    const rows = await prisma.movie_genres.findMany({
      where: { movie_id: movieId },
      select: {
        genre: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    res.json(rows.map((r) => r.genre));
  } catch (err) {
    console.error('getMovieGenres error:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
}

/** Gợi ý: phim + series trùng bất kỳ thể loại nào của phim; nếu không đủ thì bổ sung nội dung khác (fallback). */
async function getSuggestions(req, res) {
  const { id } = req.params;
  const limit = Math.min(Number(req.query.limit) || 10, 20);
  try {
    const movieId = Number(id);
    const genreRows = await prisma.movie_genres.findMany({
      where: { movie_id: movieId },
      select: { genre_id: true },
    });
    const genreIds = genreRows.map((r) => r.genre_id);
    const placeholders = genreIds.length ? genreIds.map(() => '?').join(',') : null;
    let combined = [];

    if (placeholders) {
      const [movieRows] = await pool.query(
        `SELECT DISTINCT m.id, m.title, m.thumbnail_url, m.banner_url, m.age_rating, m.rating, m.release_year, m.country_code
         FROM movies m
         INNER JOIN movie_genres mg ON mg.movie_id = m.id AND mg.genre_id IN (${placeholders})
         WHERE m.id != ?
         ORDER BY m.id DESC
         LIMIT ?`,
        [...genreIds, movieId, limit]
      );
      const [seriesRows] = await pool.query(
        `SELECT DISTINCT s.id, s.title, s.thumbnail_url, s.banner_url, s.age_rating, s.rating, s.release_year, s.country_code
         FROM series s
         INNER JOIN series_genres sg ON sg.series_id = s.id AND sg.genre_id IN (${placeholders})
         ORDER BY s.id DESC
         LIMIT ?`,
        [...genreIds, limit]
      );
      const withType = (arr, type) => (arr || []).map((r) => ({ ...r, type }));
      combined = [...withType(movieRows || [], 'movie'), ...withType(seriesRows || [], 'series')]
        .sort((a, b) => (b.id - a.id))
        .slice(0, limit);
    }

    if (combined.length < limit) {
      const haveIds = new Set(combined.map((c) => `${c.type}-${c.id}`));
      const need = limit - combined.length;
      const [moreMovies] = await pool.query(
        `SELECT id, title, thumbnail_url, banner_url, age_rating, rating, release_year, country_code
         FROM movies WHERE id != ? ORDER BY id DESC LIMIT ?`,
        [movieId, need * 2]
      );
      const [moreSeries] = await pool.query(
        `SELECT id, title, thumbnail_url, banner_url, age_rating, rating, release_year, country_code
         FROM series ORDER BY id DESC LIMIT ?`,
        [need * 2]
      );
      const more = [
        ...(moreMovies || []).map((r) => ({ ...r, type: 'movie' })),
        ...(moreSeries || []).map((r) => ({ ...r, type: 'series' })),
      ]
        .sort((a, b) => b.id - a.id)
        .filter((r) => !haveIds.has(`${r.type}-${r.id}`))
        .slice(0, need);
      combined = [...combined, ...more];
    }
    res.json(combined);
  } catch (err) {
    console.error('getSuggestions error:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
}

module.exports = {
  listMovies,
  getMovieById,
  listTopRatingMovies,
  listTrendingMovies,
  randomMovieWithTrailer,
  searchMovies,
  createMovie,
  updateMovie,
  deleteMovie,
  likeMovie,
  unlikeMovie,
  getMovieLikeStatus,
  setMovieGenres,
  getMovieGenres,
  getMovieCast,
  addMovieCast,
  removeMovieCast,
  getSuggestions,
};


