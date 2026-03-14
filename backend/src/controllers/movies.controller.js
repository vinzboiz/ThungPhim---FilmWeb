const { prisma } = require('../config/prisma');

async function listMovies(req, res) {
  const { genre_id, profile_id } = req.query;
  try {
    const where = {};

    if (genre_id) {
      where.movie_genres = {
        some: { genre_id: Number(genre_id) },
      };
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

    const movies = await prisma.movies.findMany({
      where,
      orderBy: { id: 'desc' },
      take: 50,
      select: {
        id: true,
        title: true,
        short_intro: true,
        description: true,
        thumbnail_url: true,
        banner_url: true,
        age_rating: true,
        is_featured: true,
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
    const movie = await prisma.movies.findUnique({
      where: { id: movieId },
    });

    if (!movie) {
      return res.status(404).json({ message: 'Movie not found' });
    }

    const cast = await prisma.cast.findMany({
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
    });

    const movieWithCast = {
      ...movie,
      cast: cast.map((c) => ({
        id: c.person.id,
        name: c.person.name,
        avatar_url: c.person.avatar_url,
        role: c.role,
      })),
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

async function listTrendingMovies(req, res) {
  const { profile_id } = req.query;
  try {
    const where = {};

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

    const movies = await prisma.movies.findMany({
      where,
      orderBy: { id: 'desc' },
      take: 20,
      select: {
        id: true,
        title: true,
        short_intro: true,
        thumbnail_url: true,
        banner_url: true,
        age_rating: true,
      },
    });

    res.json(movies);
  } catch (err) {
    console.error('listTrendingMovies error:', err);
    res.status(500).json({
      message: 'Internal server error',
      error: process.env.NODE_ENV !== 'production' ? err.message : undefined,
    });
  }
}

async function searchMovies(req, res) {
  const { q } = req.query;
  if (!q) {
    return res.status(400).json({ message: 'Missing query parameter q' });
  }
  try {
    const movies = await prisma.movies.findMany({
      where: {
        title: {
          contains: q,
          mode: 'insensitive',
        },
      },
      orderBy: { id: 'desc' },
      take: 50,
      select: {
        id: true,
        title: true,
        short_intro: true,
        description: true,
        thumbnail_url: true,
        banner_url: true,
        age_rating: true,
      },
    });
    res.json(movies);
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
        video_url: video_url || null,
        rating: rating != null ? Number(rating) : null,
        age_rating: age_rating || null,
        country_code: country_code || null,
        is_featured: !!is_featured,
      },
    });

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
        video_url: video_url ?? undefined,
        rating: rating != null ? Number(rating) : undefined,
        age_rating: age_rating ?? undefined,
        country_code: country_code ?? undefined,
        is_featured:
          typeof is_featured === 'boolean' ? !!is_featured : undefined,
      },
    });

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

// Tăng lượt like cho phim (dùng cho popup banner / trang chi tiết)
async function likeMovie(req, res) {
  const { id } = req.params;
  const movieId = Number(id);
  if (!Number.isInteger(movieId) || movieId <= 0) {
    return res.status(400).json({ message: 'movieId không hợp lệ' });
  }
  try {
    const updated = await prisma.movies.update({
      where: { id: movieId },
      data: {
        like_count: {
          increment: 1,
        },
      },
      select: {
        id: true,
        like_count: true,
      },
    });
    res.json(updated);
  } catch (err) {
    console.error('likeMovie error:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
}

// Gán genres cho movie
async function setMovieGenres(req, res) {
  const { id } = req.params;
  const { genre_ids } = req.body; // mảng id

  if (!Array.isArray(genre_ids)) {
    return res.status(400).json({ message: 'genre_ids phải là một mảng id' });
  }

  try {
    const movieId = Number(id);
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

    if (genre_ids.length > 0) {
      const data = genre_ids.map((gid) => ({
        movie_id: movieId,
        genre_id: Number(gid),
      }));
      await prisma.movie_genres.createMany({ data, skipDuplicates: true });
    }

    res.json({ message: 'Đã cập nhật thể loại cho phim' });
  } catch (err) {
    console.error('setMovieGenres error:', err);
    res.status(500).json({ message: 'Internal server error' });
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

module.exports = {
  listMovies,
  getMovieById,
  listTrendingMovies,
  randomMovieWithTrailer,
  searchMovies,
  createMovie,
  updateMovie,
  deleteMovie,
  likeMovie,
  setMovieGenres,
  getMovieGenres,
  getMovieCast,
  addMovieCast,
  removeMovieCast,
};


