const { pool } = require('../config/db');

// Trung bình rating chỉ lấy rating mới nhất của mỗi user (tương thích MySQL 5.7+)
async function getAvgRatingLatestPerUser(field, id) {
  const col = field === 'movie_id' ? 'movie_id' : field === 'series_id' ? 'series_id' : 'episode_id';
  const [rows] = await pool.query(
    `SELECT AVG(r.rating) AS avg_rating FROM reviews r
     WHERE r.${col} = ? AND r.created_at = (
       SELECT MAX(r2.created_at) FROM reviews r2
       WHERE r2.${col} = r.${col} AND r2.user_id = r.user_id
     )`,
    [id]
  );
  return rows[0]?.avg_rating ?? null;
}

// 1 account comment nhiều lần, giới hạn 2 lần / 30 phút. Rating chỉ dùng mới nhất để tính trung bình.
async function upsertReview(req, res) {
  const userId = req.user?.id;
  const { movie_id, episode_id, series_id, rating, comment } = req.body;

  if (!userId) {
    return res.status(401).json({ message: 'Chưa đăng nhập' });
  }
  const hasTarget = !!(movie_id || episode_id || series_id);
  if (!hasTarget || [movie_id, episode_id, series_id].filter(Boolean).length > 1) {
    return res.status(400).json({ message: 'Chỉ được gửi một trong: movie_id, episode_id, series_id' });
  }
  const rate = Number(rating);
  if (!rate || rate < 1 || rate > 5) {
    return res.status(400).json({ message: 'rating phải từ 1 đến 5' });
  }

  try {
    let whereClause = 'user_id = ? AND created_at >= DATE_SUB(NOW(), INTERVAL 30 MINUTE) AND ';
    let params = [userId];
    if (movie_id) {
      whereClause += 'movie_id = ?';
      params.push(movie_id);
    } else if (series_id) {
      whereClause += 'series_id = ?';
      params.push(series_id);
    } else {
      whereClause += 'episode_id = ?';
      params.push(episode_id);
    }
    const [countRows] = await pool.query(
      `SELECT COUNT(*) AS cnt FROM reviews WHERE ${whereClause}`,
      params
    );
    if (Number(countRows[0]?.cnt || 0) >= 2) {
      return res.status(400).json({ message: 'Trong 30 phút chỉ được gửi tối đa 2 bình luận.' });
    }

    if (movie_id) {
      await pool.query(
        `INSERT INTO reviews (user_id, profile_id, movie_id, episode_id, series_id, rating, comment, created_at)
         VALUES (?, NULL, ?, NULL, NULL, ?, ?, NOW())`,
        [userId, movie_id, rate, comment || null]
      );
      const avg = await getAvgRatingLatestPerUser('movie_id', movie_id);
      await pool.query('UPDATE movies SET rating = ? WHERE id = ?', [avg, movie_id]);
    } else if (series_id) {
      await pool.query(
        `INSERT INTO reviews (user_id, profile_id, movie_id, episode_id, series_id, rating, comment, created_at)
         VALUES (?, NULL, NULL, NULL, ?, ?, ?, NOW())`,
        [userId, series_id, rate, comment || null]
      );
      const avg = await getAvgRatingLatestPerUser('series_id', series_id);
      await pool.query('UPDATE series SET rating = ? WHERE id = ?', [avg, series_id]);
    } else {
      await pool.query(
        `INSERT INTO reviews (user_id, profile_id, movie_id, episode_id, series_id, rating, comment, created_at)
         VALUES (?, NULL, NULL, ?, NULL, ?, ?, NOW())`,
        [userId, episode_id, rate, comment || null]
      );
      const avg = await getAvgRatingLatestPerUser('episode_id', episode_id);
      await pool.query('UPDATE episodes SET rating = ? WHERE id = ?', [avg, episode_id]);
    }

    res.json({ message: 'Đã lưu đánh giá' });
  } catch (err) {
    console.error('upsertReview error:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
}

async function listMovieReviews(req, res) {
  const { id } = req.params;
  try {
    const [rows] = await pool.query(
      `SELECT r.id, r.rating, r.comment, r.created_at, r.user_id,
              COALESCE(u.full_name, 'Thành viên') AS profile_name
       FROM reviews r
       LEFT JOIN users u ON u.id = r.user_id
       WHERE r.movie_id = ?
       ORDER BY r.created_at DESC`,
      [id]
    );
    const avgRating = await getAvgRatingLatestPerUser('movie_id', id);
    res.json({ reviews: rows, avg_rating: avgRating, total: rows.length });
  } catch (err) {
    console.error('listMovieReviews error:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
}

async function listEpisodeReviews(req, res) {
  const { id } = req.params;
  try {
    const [rows] = await pool.query(
      `SELECT r.id, r.rating, r.comment, r.created_at, r.user_id,
              COALESCE(u.full_name, 'Thành viên') AS profile_name
       FROM reviews r
       LEFT JOIN users u ON u.id = r.user_id
       WHERE r.episode_id = ?
       ORDER BY r.created_at DESC`,
      [id]
    );
    const avgRating = await getAvgRatingLatestPerUser('episode_id', id);
    res.json({ reviews: rows, avg_rating: avgRating, total: rows.length });
  } catch (err) {
    console.error('listEpisodeReviews error:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
}

async function listSeriesReviews(req, res) {
  const { id } = req.params;
  try {
    const [rows] = await pool.query(
      `SELECT r.id, r.rating, r.comment, r.created_at, r.user_id,
              COALESCE(u.full_name, 'Thành viên') AS profile_name
       FROM reviews r
       LEFT JOIN users u ON u.id = r.user_id
       WHERE r.series_id = ?
       ORDER BY r.created_at DESC`,
      [id]
    );
    const avgRating = await getAvgRatingLatestPerUser('series_id', id);
    res.json({ reviews: rows, avg_rating: avgRating, total: rows.length });
  } catch (err) {
    console.error('listSeriesReviews error:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
}

module.exports = {
  upsertReview,
  listMovieReviews,
  listEpisodeReviews,
  listSeriesReviews,
};

