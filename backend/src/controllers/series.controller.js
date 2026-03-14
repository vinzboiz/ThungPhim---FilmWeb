const { pool } = require('../config/db');

// PUBLIC QUERIES

async function listSeries(req, res) {
  const { profile_id } = req.query;
  try {
    let sql =
      'SELECT id, title, description, thumbnail_url, banner_url, age_rating, is_featured FROM series';
    const params = [];

    if (profile_id) {
      sql +=
        ' WHERE age_rating IS NULL OR age_rating <= (SELECT max_maturity_rating FROM profiles WHERE id = ?)';
      params.push(profile_id);
    }

    sql += ' ORDER BY id DESC LIMIT 50';

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

async function getSeriesById(req, res) {
  const { id } = req.params;
  try {
    const [rows] = await pool.query('SELECT * FROM series WHERE id = ?', [id]);
    if (rows.length === 0) {
      return res.status(404).json({ message: 'Series not found' });
    }

    let seasons = [];
    try {
      const [s] = await pool.query('SELECT * FROM seasons WHERE series_id = ? ORDER BY season_number', [id]);
      seasons = s || [];
    } catch (_) {}

    let cast = [];
    try {
      const [c] = await pool.query(
        `SELECT sc.person_id, sc.role, p.name, p.avatar_url FROM series_cast sc JOIN persons p ON p.id = sc.person_id WHERE sc.series_id = ?`,
        [id]
      );
      cast = (c || []).map((r) => ({ id: r.person_id, name: r.name, avatar_url: r.avatar_url, role: r.role }));
    } catch (_) {}

    res.json({ ...rows[0], seasons, cast });
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
  const { title, description, thumbnail_url, banner_url, trailer_url, age_rating, is_featured, release_year } = req.body;

  if (!title) {
    return res.status(400).json({ message: 'title là bắt buộc' });
  }

  try {
    const [result] = await pool.query(
      `INSERT INTO series (title, description, thumbnail_url, banner_url, trailer_url, age_rating, is_featured, release_year, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
      [
        title,
        description || null,
        thumbnail_url || null,
        banner_url || null,
        trailer_url || null,
        age_rating || null,
        is_featured ? 1 : 0,
        release_year != null ? Number(release_year) : null,
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
  const { title, description, thumbnail_url, banner_url, trailer_url, age_rating, is_featured, release_year } = req.body;

  try {
    const [rows] = await pool.query('SELECT id FROM series WHERE id = ?', [id]);
    if (rows.length === 0) {
      return res.status(404).json({ message: 'Series not found' });
    }

    await pool.query(
      `UPDATE series
       SET title = COALESCE(?, title),
           description = COALESCE(?, description),
           thumbnail_url = COALESCE(?, thumbnail_url),
           banner_url = COALESCE(?, banner_url),
           trailer_url = COALESCE(?, trailer_url),
           age_rating = COALESCE(?, age_rating),
           is_featured = COALESCE(?, is_featured),
           release_year = COALESCE(?, release_year)
       WHERE id = ?`,
      [
        title || null,
        description || null,
        thumbnail_url || null,
        banner_url || null,
        trailer_url ?? null,
        age_rating || null,
        typeof is_featured === 'boolean' ? (is_featured ? 1 : 0) : null,
        (release_year !== undefined && release_year !== '' && release_year != null) ? Number(release_year) : null,
        id,
      ]
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

async function deleteSeries(req, res) {
  const { id } = req.params;
  try {
    const [rows] = await pool.query('SELECT id FROM series WHERE id = ?', [id]);
    if (rows.length === 0) {
      return res.status(404).json({ message: 'Series not found' });
    }

    await pool.query('DELETE FROM series_cast WHERE series_id = ?', [id]).catch(() => {});
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
  if (!Number.isInteger(seriesId) || seriesId <= 0) {
    return res.status(400).json({ message: 'series id không hợp lệ' });
  }
  try {
    await pool.query('UPDATE series SET like_count = IFNULL(like_count, 0) + 1 WHERE id = ?', [seriesId]);
    const [rows] = await pool.query('SELECT id, like_count FROM series WHERE id = ?', [seriesId]);
    if (rows.length === 0) return res.status(404).json({ message: 'Series not found' });
    res.json({ id: rows[0].id, like_count: Number(rows[0].like_count) || 0 });
  } catch (err) {
    console.error('likeSeries error:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
}

module.exports = {
  listSeries,
  getSeriesById,
  listEpisodesOfSeries,
  getEpisodeById,
  createSeries,
  updateSeries,
  deleteSeries,
  likeSeries,
  createEpisode,
  updateEpisode,
  deleteEpisode,
  createSeason,
  updateSeason,
  deleteSeason,
  getSeriesCast,
  addSeriesCast,
  removeSeriesCast,
};

