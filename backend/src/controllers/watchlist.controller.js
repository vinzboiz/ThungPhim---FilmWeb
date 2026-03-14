const { pool } = require('../config/db');

async function listWatchlist(req, res) {
  const userId = req.user?.id;
  const { profile_id } = req.query;

  if (!userId) {
    return res.status(401).json({ message: 'Chưa đăng nhập' });
  }
  if (!profile_id) {
    return res.status(400).json({ message: 'profile_id là bắt buộc' });
  }

  try {
    const [rows] = await pool.query(
      // movie
      `(SELECT 'movie' AS type, w.movie_id AS content_id, NULL AS series_id,
               m.title, m.thumbnail_url, m.age_rating, w.added_at
        FROM watchlist w
        JOIN movies m ON m.id = w.movie_id
        WHERE w.profile_id = ? AND w.movie_id IS NOT NULL)
       UNION ALL
       -- series
       (SELECT 'series' AS type, w.series_id AS content_id, NULL AS series_id,
               s.title, s.thumbnail_url, s.age_rating, w.added_at
        FROM watchlist w
        JOIN series s ON s.id = w.series_id
        WHERE w.profile_id = ? AND w.series_id IS NOT NULL)
       UNION ALL
       -- episode
       (SELECT 'episode' AS type, w.episode_id AS content_id, e.series_id AS series_id,
               e.title, e.thumbnail_url, NULL AS age_rating, w.added_at
        FROM watchlist w
        JOIN episodes e ON e.id = w.episode_id
        WHERE w.profile_id = ? AND w.episode_id IS NOT NULL)
       ORDER BY added_at DESC`,
      [profile_id, profile_id, profile_id]
    );
    res.json(rows);
  } catch (err) {
    console.error('listWatchlist error:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
}

async function addToWatchlist(req, res) {
  const userId = req.user?.id;
  const { profile_id, movie_id, series_id, episode_id } = req.body;

  if (!userId) {
    return res.status(401).json({ message: 'Chưa đăng nhập' });
  }
  if (!profile_id || (!movie_id && !series_id && !episode_id)) {
    return res.status(400).json({ message: 'profile_id và một trong movie_id/series_id/episode_id là bắt buộc' });
  }

  try {
    const mid = movie_id || null;
    const sid = series_id || null;
    const eid = episode_id || null;
    await pool.query(
      'INSERT IGNORE INTO watchlist (profile_id, movie_id, series_id, episode_id, added_at) VALUES (?, ?, ?, ?, NOW())',
      [profile_id, mid, sid, eid]
    );
    res.status(201).json({ message: 'Đã thêm vào watchlist' });
  } catch (err) {
    console.error('addToWatchlist error:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
}

async function removeFromWatchlist(req, res) {
  const userId = req.user?.id;
  const { movieId } = req.params;
  const { profile_id, type } = req.query;

  if (!userId) {
    return res.status(401).json({ message: 'Chưa đăng nhập' });
  }
  if (!profile_id) {
    return res.status(400).json({ message: 'profile_id là bắt buộc' });
  }

  try {
    if (type === 'series') {
      await pool.query(
        'DELETE FROM watchlist WHERE profile_id = ? AND series_id = ?',
        [profile_id, movieId]
      );
    } else if (type === 'episode') {
      await pool.query(
        'DELETE FROM watchlist WHERE profile_id = ? AND episode_id = ?',
        [profile_id, movieId]
      );
    } else {
      await pool.query(
        'DELETE FROM watchlist WHERE profile_id = ? AND movie_id = ?',
        [profile_id, movieId]
      );
    }
    res.json({ message: 'Đã xoá khỏi watchlist' });
  } catch (err) {
    console.error('removeFromWatchlist error:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
}

module.exports = {
  listWatchlist,
  addToWatchlist,
  removeFromWatchlist,
};

