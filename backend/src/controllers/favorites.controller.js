const { pool } = require('../config/db');
const { createNotification } = require('./notifications.controller');

async function listFavorites(req, res) {
  const { profile_id } = req.query;
  if (!profile_id) {
    return res.status(400).json({ message: 'profile_id là bắt buộc' });
  }
  try {
    const [rows] = await pool.query(
      `SELECT f.id, f.movie_id, f.added_at, m.title, m.thumbnail_url, m.banner_url, m.age_rating
       FROM favorites f
       JOIN movies m ON m.id = f.movie_id
       WHERE f.profile_id = ?
       ORDER BY f.added_at DESC`,
      [profile_id]
    );
    res.json(rows);
  } catch (err) {
    console.error('listFavorites error:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
}

async function addFavorite(req, res) {
  const userId = req.user?.id;
  const { profile_id, movie_id } = req.body;
  if (!profile_id || !movie_id) {
    return res.status(400).json({ message: 'profile_id và movie_id là bắt buộc' });
  }
  try {
    await pool.query(
      'INSERT IGNORE INTO favorites (profile_id, movie_id) VALUES (?, ?)',
      [profile_id, movie_id]
    );
    if (userId) {
      createNotification(userId, 'favorite_add', 'Bạn đã thêm một phim vào danh sách yêu thích.').catch(() => {});
    }
    res.status(201).json({ message: 'Đã thêm vào yêu thích' });
  } catch (err) {
    console.error('addFavorite error:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
}

async function removeFavorite(req, res) {
  const { movieId } = req.params;
  const { profile_id } = req.query;
  if (!profile_id) {
    return res.status(400).json({ message: 'profile_id là bắt buộc' });
  }
  try {
    const [r] = await pool.query(
      'DELETE FROM favorites WHERE profile_id = ? AND movie_id = ?',
      [profile_id, movieId]
    );
    res.json({ message: 'Đã bỏ khỏi yêu thích' });
  } catch (err) {
    console.error('removeFavorite error:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
}

async function checkFavorite(req, res) {
  const { profile_id, movie_id } = req.query;
  if (!profile_id || !movie_id) {
    return res.status(400).json({ message: 'profile_id và movie_id là bắt buộc' });
  }
  try {
    const [rows] = await pool.query(
      'SELECT id FROM favorites WHERE profile_id = ? AND movie_id = ?',
      [profile_id, movie_id]
    );
    res.json({ is_favorite: rows.length > 0 });
  } catch (err) {
    console.error('checkFavorite error:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
}

module.exports = {
  listFavorites,
  addFavorite,
  removeFavorite,
  checkFavorite,
};
