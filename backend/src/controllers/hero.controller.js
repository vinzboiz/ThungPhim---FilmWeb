const { pool } = require('../config/db');

/**
 * Trả về 1 item ngẫu nhiên (phim hoặc series) có trailer local (/uploads/...)
 * Dùng cho Hero banner trang chủ — random chung giữa movie và series.
 */
async function randomHeroItem(req, res) {
  try {
    const [rows] = await pool.query(
      `(SELECT id, title, short_intro, description, thumbnail_url, banner_url, trailer_url, age_rating, like_count, release_year, 'movie' AS type
        FROM movies
        WHERE trailer_url IS NOT NULL AND trailer_url != '' AND trailer_url LIKE '/uploads/%')
       UNION ALL
       (SELECT id, title, NULL AS short_intro, description, thumbnail_url, banner_url, trailer_url, age_rating, like_count, release_year, 'series' AS type
        FROM series
        WHERE trailer_url IS NOT NULL AND trailer_url != '' AND trailer_url LIKE '/uploads/%')
       ORDER BY RAND()
       LIMIT 1`
    );
    const pick = Array.isArray(rows) && rows[0];
    if (!pick) {
      return res.status(404).json({ message: 'Chưa có phim hoặc series nào có trailer' });
    }
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');
    res.json(pick);
  } catch (err) {
    console.error('randomHeroItem error:', err);
    res.status(500).json({
      message: 'Internal server error',
      error: process.env.NODE_ENV !== 'production' ? err.message : undefined,
    });
  }
}

module.exports = { randomHeroItem };
