const { pool } = require('../config/db');

const TRAILER_WHERE = "trailer_url IS NOT NULL AND trailer_url != '' AND trailer_url LIKE '/uploads/%'";

/**
 * Trả về 1 item ngẫu nhiên (phim hoặc series) có trailer local.
 * Query: ?type=movie | series | featured
 * - movie: chỉ phim có trailer
 * - series: chỉ series có trailer
 * - featured: chỉ nội dung is_featured có trailer (movie + series)
 * - không truyền: cả phim và series có trailer
 */
async function randomHeroItem(req, res) {
  try {
    const type = (req.query.type || '').toLowerCase();
    let sql;
    const params = [];

    if (type === 'movie') {
      sql = `SELECT id, title, short_intro, description, thumbnail_url, banner_url, trailer_url, age_rating, like_count, release_year, 'movie' AS type
        FROM movies WHERE ${TRAILER_WHERE} ORDER BY RAND() LIMIT 1`;
    } else if (type === 'series') {
      sql = `SELECT id, title, NULL AS short_intro, description, thumbnail_url, banner_url, trailer_url, age_rating, like_count, release_year, 'series' AS type
        FROM series WHERE ${TRAILER_WHERE} ORDER BY RAND() LIMIT 1`;
    } else if (type === 'featured') {
      sql = `(SELECT id, title, short_intro, description, thumbnail_url, banner_url, trailer_url, age_rating, like_count, release_year, 'movie' AS type
        FROM movies WHERE ${TRAILER_WHERE} AND is_featured = 1)
       UNION ALL
       (SELECT id, title, NULL AS short_intro, description, thumbnail_url, banner_url, trailer_url, age_rating, like_count, release_year, 'series' AS type
        FROM series WHERE ${TRAILER_WHERE} AND is_featured = 1)
       ORDER BY RAND() LIMIT 1`;
    } else {
      sql = `(SELECT id, title, short_intro, description, thumbnail_url, banner_url, trailer_url, age_rating, like_count, release_year, 'movie' AS type
        FROM movies WHERE ${TRAILER_WHERE})
       UNION ALL
       (SELECT id, title, NULL AS short_intro, description, thumbnail_url, banner_url, trailer_url, age_rating, like_count, release_year, 'series' AS type
        FROM series WHERE ${TRAILER_WHERE})
       ORDER BY RAND() LIMIT 1`;
    }

    const [rows] = await pool.query(sql, params);
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
