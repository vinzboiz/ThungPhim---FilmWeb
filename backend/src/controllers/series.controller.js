const { pool } = require('../config/db');
const { normalize, escapeLike } = require('../utils/normalize');

// PUBLIC QUERIES

async function listSeries(req, res) {
  const { profile_id, genre_id, year_from, year_to, country_code, limit } = req.query;
  try {
    let sql = 'SELECT s.id, s.title, s.description, s.thumbnail_url, s.banner_url, s.age_rating, s.is_featured, s.release_year, s.rating FROM series s';
    const conditions = [];
    const params = [];

    if (genre_id) {
      conditions.push('EXISTS (SELECT 1 FROM series_genres sg WHERE sg.series_id = s.id AND sg.genre_id = ?)');
      params.push(Number(genre_id));
    }
    const yFrom = year_from != null && year_from !== '' ? Number(year_from) : null;
    const yTo = year_to != null && year_to !== '' ? Number(year_to) : null;
    if (yFrom != null && !Number.isNaN(yFrom)) {
      conditions.push('s.release_year >= ?');
      params.push(yFrom);
    }
    if (yTo != null && !Number.isNaN(yTo)) {
      conditions.push('s.release_year <= ?');
      params.push(yTo);
    }
    if (country_code != null && String(country_code).trim() !== '') {
      conditions.push('s.country_code = ?');
      params.push(String(country_code).trim());
    }
    if (profile_id) {
      conditions.push('(s.age_rating IS NULL OR s.age_rating <= (SELECT max_maturity_rating FROM profiles WHERE id = ?))');
      params.push(profile_id);
    }

    if (conditions.length) sql += ' WHERE ' + conditions.join(' AND ');
    sql += ' ORDER BY s.id DESC LIMIT ?';
    params.push(Math.min(Number(limit) || 50, 100));

    const [rows] = await pool.query(sql, params);
    res.json(rows);
  } catch (err) {
    console.error('listSeries error:', err);
    res.status(500).json({
      message: 'Internal server error',
      error: process.env.NODE_ENV !== 'production' ? err.message : undefined,
    });
  }
}

async function searchSeries(req, res) {
  const raw = (req.query.q ?? '').trim();
  if (!raw) return res.json([]);
  const normalized = normalize(raw);
  if (!normalized) return res.json([]);
  try {
    const likeNorm = `%${escapeLike(normalized)}%`;
    const likeRaw = `%${escapeLike(raw)}%`;
    const [rows] = await pool.query(
      `SELECT id, title, description, thumbnail_url, banner_url, age_rating, release_year
       FROM series
       WHERE (title_normalized IS NOT NULL AND title_normalized LIKE ?)
          OR (title_normalized IS NULL AND title LIKE ?)
       ORDER BY id DESC LIMIT 50`,
      [likeNorm, likeRaw]
    );
    res.json(rows || []);
  } catch (err) {
    console.error('searchSeries error:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
}

async function getSeriesById(req, res) {
  const { id } = req.params;
  try {
    const [rows] = await pool.query('SELECT * FROM series WHERE id = ?', [id]);
    if (rows.length === 0) {
      return res.status(404).json({ message: 'Series not found' });
    }

    let seasons = [];
    let cast = [];
    let reviewCount = 0;
    try {
      const [s] = await pool.query('SELECT * FROM seasons WHERE series_id = ? ORDER BY season_number', [id]);
      seasons = s || [];
    } catch (_) {}
    try {
      const [c] = await pool.query(
        `SELECT sc.person_id, sc.role, p.name, p.avatar_url FROM series_cast sc JOIN persons p ON p.id = sc.person_id WHERE sc.series_id = ?`,
        [id]
      );
      cast = (c || []).map((r) => ({ id: r.person_id, name: r.name, avatar_url: r.avatar_url, role: r.role }));
    } catch (_) {}
    try {
      const [countRows] = await pool.query('SELECT COUNT(*) AS cnt FROM reviews WHERE series_id = ?', [id]);
      reviewCount = Number(countRows[0]?.cnt ?? 0);
    } catch (_) {}

    let genres = [];
    try {
      const [gRows] = await pool.query(
        'SELECT g.id, g.name FROM series_genres sg JOIN genres g ON g.id = sg.genre_id WHERE sg.series_id = ? ORDER BY g.name',
        [id]
      );
      genres = gRows || [];
    } catch (_) {}

    res.json({ ...rows[0], seasons, cast, genres, review_count: reviewCount });
  } catch (err) {
    console.error('getSeriesById error:', err);
    res.status(500).json({
      message: 'Internal server error',
      error: process.env.NODE_ENV !== 'production' ? err.message : undefined,
    });
  }
}

async function listEpisodesOfSeries(req, res) {
  const { id } = req.params;
  const { season_id } = req.query;
  try {
    let sql = 'SELECT * FROM episodes WHERE series_id = ?';
    const params = [id];
    if (season_id) {
      sql += ' AND season_id = ?';
      params.push(season_id);
    }
    sql += ' ORDER BY episode_number';
    const [rows] = await pool.query(sql, params);
    res.json(rows);
  } catch (err) {
    console.error('listEpisodesOfSeries error:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
}

async function getEpisodeById(req, res) {
  const { episodeId } = req.params;
  try {
    const [rows] = await pool.query('SELECT * FROM episodes WHERE id = ?', [episodeId]);
    if (rows.length === 0) {
      return res.status(404).json({ message: 'Episode not found' });
    }
    const episode = rows[0];

    // Tăng view_count cho episode và series liên quan
    try {
      await pool.query(
        'UPDATE episodes SET view_count = COALESCE(view_count, 0) + 1 WHERE id = ?',
        [episodeId]
      );
      if (episode.series_id) {
        await pool.query(
          'UPDATE series SET view_count = COALESCE(view_count, 0) + 1 WHERE id = ?',
          [episode.series_id]
        );
      }
    } catch (incErr) {
      console.error('increment episode/series view_count error:', incErr.message);
    }

    res.json(episode);
  } catch (err) {
    console.error('getEpisodeById error:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
}

// ADMIN – CRUD SERIES

async function createSeries(req, res) {
  const { title, description, thumbnail_url, banner_url, trailer_url, age_rating, is_featured, release_year, country_code, duration_minutes } = req.body;

  if (!title) {
    return res.status(400).json({ message: 'title là bắt buộc' });
  }

  try {
    const [result] = await pool.query(
      `INSERT INTO series (title, description, thumbnail_url, banner_url, trailer_url, age_rating, is_featured, release_year, country_code, duration_minutes, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
      [
        title,
        description || null,
        thumbnail_url || null,
        banner_url || null,
        trailer_url || null,
        age_rating || null,
        is_featured ? 1 : 0,
        release_year != null ? Number(release_year) : null,
        country_code || null,
        duration_minutes != null && duration_minutes !== '' ? Number(duration_minutes) : null,
      ]
    );
    const [rows] = await pool.query('SELECT * FROM series WHERE id = ?', [result.insertId]);
    res.status(201).json(rows[0]);
  } catch (err) {
    console.error('createSeries error:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
}

async function updateSeries(req, res) {
  const { id } = req.params;
  const { title, description, thumbnail_url, banner_url, trailer_url, age_rating, is_featured, release_year, country_code, duration_minutes } = req.body;

  try {
    const [rows] = await pool.query('SELECT id FROM series WHERE id = ?', [id]);
    if (rows.length === 0) {
      return res.status(404).json({ message: 'Series not found' });
    }

    const updates = [
      title || null,
      title != null ? normalize(title) : null,
      description || null,
      thumbnail_url || null,
      banner_url || null,
      trailer_url ?? null,
      age_rating || null,
      typeof is_featured === 'boolean' ? (is_featured ? 1 : 0) : null,
      (release_year !== undefined && release_year !== '' && release_year != null) ? Number(release_year) : null,
      country_code || null,
      (duration_minutes !== undefined && duration_minutes !== '' && duration_minutes != null) ? Number(duration_minutes) : null,
      id,
    ];
    await pool.query(
      `UPDATE series
       SET title = COALESCE(?, title),
           title_normalized = COALESCE(?, title_normalized),
           description = COALESCE(?, description),
           thumbnail_url = COALESCE(?, thumbnail_url),
           banner_url = COALESCE(?, banner_url),
           trailer_url = COALESCE(?, trailer_url),
           age_rating = COALESCE(?, age_rating),
           is_featured = COALESCE(?, is_featured),
           release_year = COALESCE(?, release_year),
           country_code = COALESCE(?, country_code),
           duration_minutes = COALESCE(?, duration_minutes)
       WHERE id = ?`,
      updates
    );

    const [updated] = await pool.query('SELECT * FROM series WHERE id = ?', [id]);
    res.json(updated[0]);
  } catch (err) {
    console.error('updateSeries error:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
}

async function getSeriesCast(req, res) {
  const { id } = req.params;
  try {
    const [rows] = await pool.query(
      `SELECT sc.person_id AS id, sc.role, p.name, p.avatar_url FROM series_cast sc JOIN persons p ON p.id = sc.person_id WHERE sc.series_id = ?`,
      [id]
    );
    res.json(rows.map((r) => ({ id: r.id, name: r.name, avatar_url: r.avatar_url, role: r.role })));
  } catch (err) {
    console.error('getSeriesCast error:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
}

async function addSeriesCast(req, res) {
  const { id } = req.params;
  const { person_id, role } = req.body;
  if (!person_id) return res.status(400).json({ message: 'person_id là bắt buộc' });
  const r = role === 'director' ? 'director' : 'actor';
  try {
    const [s] = await pool.query('SELECT id FROM series WHERE id = ?', [id]);
    if (s.length === 0) return res.status(404).json({ message: 'Series not found' });
    await pool.query('INSERT IGNORE INTO series_cast (series_id, person_id, role) VALUES (?, ?, ?)', [id, person_id, r]);
    res.status(201).json({ message: 'Đã gán cast cho series' });
  } catch (err) {
    console.error('addSeriesCast error:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
}

async function removeSeriesCast(req, res) {
  const { id, personId } = req.params;
  try {
    await pool.query('DELETE FROM series_cast WHERE series_id = ? AND person_id = ?', [id, personId]);
    res.json({ message: 'Đã xoá cast khỏi series' });
  } catch (err) {
    console.error('removeSeriesCast error:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
}

async function setSeriesGenres(req, res) {
  const { id } = req.params;
  const { genre_ids } = req.body;
  if (!Array.isArray(genre_ids)) {
    return res.status(400).json({ message: 'genre_ids phải là một mảng id' });
  }
  try {
    const seriesId = Number(id);
    const [exists] = await pool.query('SELECT id FROM series WHERE id = ?', [seriesId]);
    if (!exists || exists.length === 0) {
      return res.status(404).json({ message: 'Series not found' });
    }
    await pool.query('DELETE FROM series_genres WHERE series_id = ?', [seriesId]);
    if (genre_ids.length > 0) {
      const values = genre_ids.map((gid) => [seriesId, Number(gid)]);
      for (const [sid, gid] of values) {
        await pool.query('INSERT IGNORE INTO series_genres (series_id, genre_id) VALUES (?, ?)', [sid, gid]);
      }
    }
    res.json({ message: 'Đã cập nhật thể loại cho series' });
  } catch (err) {
    console.error('setSeriesGenres error:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
}

async function deleteSeries(req, res) {
  const { id } = req.params;
  try {
    const [rows] = await pool.query('SELECT id FROM series WHERE id = ?', [id]);
    if (rows.length === 0) {
      return res.status(404).json({ message: 'Series not found' });
    }

    await pool.query('DELETE FROM series_cast WHERE series_id = ?', [id]).catch(() => {});
    await pool.query('DELETE FROM series_genres WHERE series_id = ?', [id]).catch(() => {});
    await pool.query('DELETE FROM episodes WHERE series_id = ?', [id]);
    await pool.query('DELETE FROM seasons WHERE series_id = ?', [id]).catch(() => {});
    await pool.query('DELETE FROM series WHERE id = ?', [id]);

    res.json({ message: 'Đã xoá series và các tập liên quan' });
  } catch (err) {
    console.error('deleteSeries error:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
}

// ADMIN – CRUD EPISODES

async function createEpisode(req, res) {
  const {
    series_id,
    season_id,
    episode_number,
    title,
    description,
    duration_minutes,
    thumbnail_url,
    video_url,
    release_date,
  } = req.body;

  if (!series_id || !title) {
    return res.status(400).json({ message: 'series_id và title là bắt buộc' });
  }

  try {
    const [result] = await pool.query(
      `INSERT INTO episodes
       (series_id, season_id, episode_number, title, description, duration_minutes, thumbnail_url, video_url, release_date, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
      [
        series_id,
        season_id || null,
        episode_number || null,
        title,
        description || null,
        duration_minutes || null,
        thumbnail_url || null,
        video_url || null,
        release_date || null,
      ]
    );
    const [rows] = await pool.query('SELECT * FROM episodes WHERE id = ?', [result.insertId]);
    res.status(201).json(rows[0]);
  } catch (err) {
    console.error('createEpisode error:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
}

async function updateEpisode(req, res) {
  const { episodeId } = req.params;
  const {
    season_id,
    episode_number,
    title,
    description,
    duration_minutes,
    thumbnail_url,
    video_url,
    release_date,
  } = req.body;

  try {
    const [rows] = await pool.query('SELECT id FROM episodes WHERE id = ?', [episodeId]);
    if (rows.length === 0) {
      return res.status(404).json({ message: 'Episode not found' });
    }

    await pool.query(
      `UPDATE episodes
       SET season_id = COALESCE(?, season_id),
           episode_number = COALESCE(?, episode_number),
           title = COALESCE(?, title),
           description = COALESCE(?, description),
           duration_minutes = COALESCE(?, duration_minutes),
           thumbnail_url = COALESCE(?, thumbnail_url),
           video_url = COALESCE(?, video_url),
           release_date = COALESCE(?, release_date)
       WHERE id = ?`,
      [
        season_id || null,
        episode_number || null,
        title || null,
        description || null,
        duration_minutes || null,
        thumbnail_url || null,
        video_url || null,
        release_date || null,
        episodeId,
      ]
    );

    const [updated] = await pool.query('SELECT * FROM episodes WHERE id = ?', [episodeId]);
    res.json(updated[0]);
  } catch (err) {
    console.error('updateEpisode error:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
}

async function deleteEpisode(req, res) {
  const { episodeId } = req.params;
  try {
    const [rows] = await pool.query('SELECT id FROM episodes WHERE id = ?', [episodeId]);
    if (rows.length === 0) {
      return res.status(404).json({ message: 'Episode not found' });
    }

    await pool.query('DELETE FROM cast WHERE episode_id = ?', [episodeId]).catch(() => {});
    await pool.query('DELETE FROM episodes WHERE id = ?', [episodeId]);

    res.json({ message: 'Đã xoá episode' });
  } catch (err) {
    console.error('deleteEpisode error:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
}

// ADMIN – CRUD SEASONS (tuỳ chọn)

async function createSeason(req, res) {
  const { id: seriesId } = req.params;
  const { season_number, title, description } = req.body;

  if (!season_number) {
    return res.status(400).json({ message: 'season_number là bắt buộc' });
  }

  try {
    const [seriesRows] = await pool.query('SELECT id FROM series WHERE id = ?', [seriesId]);
    if (seriesRows.length === 0) {
      return res.status(404).json({ message: 'Series not found' });
    }

    const [result] = await pool.query(
      `INSERT INTO seasons (series_id, season_number, title, description)
       VALUES (?, ?, ?, ?)`,
      [seriesId, season_number, title || null, description || null]
    );
    const [rows] = await pool.query('SELECT * FROM seasons WHERE id = ?', [result.insertId]);
    res.status(201).json(rows[0]);
  } catch (err) {
    console.error('createSeason error:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
}

async function updateSeason(req, res) {
  const { id: seriesId, seasonId } = req.params;
  const { season_number, title, description } = req.body;

  try {
    const [rows] = await pool.query(
      'SELECT id FROM seasons WHERE id = ? AND series_id = ?',
      [seasonId, seriesId]
    );
    if (rows.length === 0) {
      return res.status(404).json({ message: 'Season not found' });
    }

    await pool.query(
      `UPDATE seasons
       SET season_number = COALESCE(?, season_number),
           title = COALESCE(?, title),
           description = COALESCE(?, description)
       WHERE id = ? AND series_id = ?`,
      [season_number || null, title || null, description || null, seasonId, seriesId]
    );

    const [updated] = await pool.query('SELECT * FROM seasons WHERE id = ?', [seasonId]);
    res.json(updated[0]);
  } catch (err) {
    console.error('updateSeason error:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
}

async function deleteSeason(req, res) {
  const { id: seriesId, seasonId } = req.params;
  try {
    const [rows] = await pool.query(
      'SELECT id FROM seasons WHERE id = ? AND series_id = ?',
      [seasonId, seriesId]
    );
    if (rows.length === 0) {
      return res.status(404).json({ message: 'Season not found' });
    }

    // có thể cần xoá episodes thuộc season đó
    await pool.query('DELETE FROM episodes WHERE season_id = ?', [seasonId]).catch(() => {});
    await pool.query('DELETE FROM seasons WHERE id = ? AND series_id = ?', [seasonId, seriesId]);

    res.json({ message: 'Đã xoá season và các tập liên quan (nếu có)' });
  } catch (err) {
    console.error('deleteSeason error:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
}

async function likeSeries(req, res) {
  const { id } = req.params;
  const seriesId = Number(id);
  const profileId = req.body?.profile_id != null ? Number(req.body.profile_id) : null;
  if (!Number.isInteger(seriesId) || seriesId <= 0) {
    return res.status(400).json({ message: 'series id không hợp lệ' });
  }
  if (!profileId) {
    return res.status(400).json({ message: 'profile_id là bắt buộc' });
  }
  try {
    const [existing] = await pool.query(
      'SELECT 1 FROM content_likes WHERE profile_id = ? AND content_type = ? AND content_id = ?',
      [profileId, 'series', seriesId]
    );
    if (existing && existing.length > 0) {
      const [row] = await pool.query('SELECT id, like_count FROM series WHERE id = ?', [seriesId]);
      return res.json({
        id: seriesId,
        like_count: Number(row[0]?.like_count) || 0,
        user_has_liked: true,
      });
    }
    await pool.query(
      'INSERT IGNORE INTO content_likes (profile_id, content_type, content_id) VALUES (?, ?, ?)',
      [profileId, 'series', seriesId]
    );
    const [inserted] = await pool.query('SELECT 1 FROM content_likes WHERE profile_id = ? AND content_type = ? AND content_id = ?', [profileId, 'series', seriesId]);
    if (inserted && inserted.length > 0) {
      await pool.query('UPDATE series SET like_count = IFNULL(like_count, 0) + 1 WHERE id = ?', [seriesId]);
    }
    const [rows] = await pool.query('SELECT id, like_count FROM series WHERE id = ?', [seriesId]);
    if (rows.length === 0) return res.status(404).json({ message: 'Series not found' });
    res.json({
      id: rows[0].id,
      like_count: Number(rows[0].like_count) || 0,
      user_has_liked: true,
    });
  } catch (err) {
    console.error('likeSeries error:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
}

async function unlikeSeries(req, res) {
  const seriesId = Number(req.params.id);
  const profileId = req.query.profile_id != null ? Number(req.query.profile_id) : null;
  if (!Number.isInteger(seriesId) || seriesId <= 0) {
    return res.status(400).json({ message: 'series id không hợp lệ' });
  }
  if (!profileId) {
    return res.status(400).json({ message: 'profile_id là bắt buộc' });
  }
  try {
    const [deleted] = await pool.query(
      'DELETE FROM content_likes WHERE profile_id = ? AND content_type = ? AND content_id = ?',
      [profileId, 'series', seriesId]
    );
    if (deleted && deleted.affectedRows > 0) {
      await pool.query('UPDATE series SET like_count = GREATEST(IFNULL(like_count, 0) - 1, 0) WHERE id = ?', [seriesId]);
    }
    const [rows] = await pool.query('SELECT id, like_count FROM series WHERE id = ?', [seriesId]);
    if (rows.length === 0) return res.status(404).json({ message: 'Series not found' });
    res.json({
      id: rows[0].id,
      like_count: Number(rows[0].like_count) || 0,
      user_has_liked: false,
    });
  } catch (err) {
    console.error('unlikeSeries error:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
}

/** Gợi ý: phim + series trùng bất kỳ thể loại nào của series; nếu không đủ thì bổ sung nội dung khác (fallback). */
async function getSeriesSuggestions(req, res) {
  const seriesId = Number(req.params.id);
  const limit = Math.min(Number(req.query.limit) || 10, 20);
  try {
    const [genreRows] = await pool.query('SELECT genre_id FROM series_genres WHERE series_id = ?', [seriesId]);
    const genreIds = (genreRows || []).map((r) => r.genre_id);
    const placeholders = genreIds.length ? genreIds.map(() => '?').join(',') : null;
    let combined = [];

    if (placeholders) {
      const [movieRows] = await pool.query(
        `SELECT DISTINCT m.id, m.title, m.thumbnail_url, m.banner_url, m.age_rating, m.rating, m.release_year, m.country_code
         FROM movies m
         INNER JOIN movie_genres mg ON mg.movie_id = m.id AND mg.genre_id IN (${placeholders})
         ORDER BY m.id DESC LIMIT ?`,
        [...genreIds, limit]
      );
      const [seriesRows] = await pool.query(
        `SELECT DISTINCT s.id, s.title, s.thumbnail_url, s.banner_url, s.age_rating, s.rating, s.release_year, s.country_code
         FROM series s
         INNER JOIN series_genres sg ON sg.series_id = s.id AND sg.genre_id IN (${placeholders})
         WHERE s.id != ?
         ORDER BY s.id DESC LIMIT ?`,
        [...genreIds, seriesId, limit]
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
         FROM movies ORDER BY id DESC LIMIT ?`,
        [need * 2]
      );
      const [moreSeries] = await pool.query(
        `SELECT id, title, thumbnail_url, banner_url, age_rating, rating, release_year, country_code
         FROM series WHERE id != ? ORDER BY id DESC LIMIT ?`,
        [seriesId, need * 2]
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
    console.error('getSeriesSuggestions error:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
}

async function getSeriesLikeStatus(req, res) {
  const seriesId = Number(req.params.id);
  const profileId = req.query.profile_id != null ? Number(req.query.profile_id) : null;
  if (!Number.isInteger(seriesId) || seriesId <= 0) {
    return res.status(400).json({ message: 'series id không hợp lệ' });
  }
  try {
    const [series] = await pool.query('SELECT like_count FROM series WHERE id = ?', [seriesId]);
    const likeCount = series.length ? Number(series[0].like_count) || 0 : 0;
    let userHasLiked = false;
    if (profileId) {
      const [liked] = await pool.query(
        'SELECT 1 FROM content_likes WHERE profile_id = ? AND content_type = ? AND content_id = ?',
        [profileId, 'series', seriesId]
      );
      userHasLiked = liked && liked.length > 0;
    }
    res.json({ like_count: likeCount, user_has_liked: userHasLiked });
  } catch (err) {
    console.error('getSeriesLikeStatus error:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
}

module.exports = {
  listSeries,
  searchSeries,
  getSeriesById,
  listEpisodesOfSeries,
  getEpisodeById,
  getSeriesSuggestions,
  createSeries,
  updateSeries,
  deleteSeries,
  likeSeries,
  unlikeSeries,
  getSeriesLikeStatus,
  createEpisode,
  updateEpisode,
  deleteEpisode,
  createSeason,
  updateSeason,
  deleteSeason,
  getSeriesCast,
  addSeriesCast,
  removeSeriesCast,
  setSeriesGenres,
};

