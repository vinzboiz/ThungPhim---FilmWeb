const { pool } = require('../config/db');

// Lấy tiến độ xem đã lưu (để phát tiếp từ vị trí cũ)
async function getProgress(req, res) {
  const userId = req.user?.id;
  const { profile_id, movie_id, episode_id } = req.query;

  if (!userId) {
    return res.status(401).json({ message: 'Chưa đăng nhập' });
  }
  if (!profile_id || (!movie_id && !episode_id)) {
    return res.status(400).json({ message: 'profile_id và movie_id hoặc episode_id là bắt buộc' });
  }

  try {
    let rows;
    if (movie_id) {
      [rows] = await pool.query(
        `SELECT progress_seconds FROM watch_history
         WHERE profile_id = ? AND movie_id = ? AND episode_id IS NULL
         ORDER BY watched_at DESC LIMIT 1`,
        [profile_id, movie_id]
      );
    } else {
      [rows] = await pool.query(
        `SELECT progress_seconds FROM watch_history
         WHERE profile_id = ? AND episode_id = ?
         ORDER BY watched_at DESC LIMIT 1`,
        [profile_id, episode_id]
      );
    }
    const progress_seconds = rows.length > 0 ? rows[0].progress_seconds : 0;
    res.json({ progress_seconds: Number(progress_seconds) || 0 });
  } catch (err) {
    console.error('getProgress error:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
}

// Lưu tiến độ xem (đè bản ghi cũ: mỗi phim/tập chỉ 1 lịch sử cho mỗi profile)
async function saveProgress(req, res) {
  const userId = req.user?.id;
  const { profile_id, movie_id, episode_id, progress_seconds } = req.body;

  if (!userId) {
    return res.status(401).json({ message: 'Chưa đăng nhập' });
  }
  if (!profile_id || (!movie_id && !episode_id)) {
    return res.status(400).json({ message: 'profile_id và movie_id hoặc episode_id là bắt buộc' });
  }

  const pid = parseInt(profile_id, 10);
  const sec = Number(progress_seconds) || 0;

  try {
    if (movie_id) {
      const mid = parseInt(movie_id, 10);
      const [result] = await pool.query(
        `UPDATE watch_history
         SET progress_seconds = ?, watched_at = NOW()
         WHERE profile_id = ? AND movie_id = ? AND episode_id IS NULL`,
        [sec, pid, mid]
      );
      if (!result.affectedRows || result.affectedRows === 0) {
        await pool.query(
          `INSERT INTO watch_history (profile_id, movie_id, episode_id, progress_seconds, watched_at)
           VALUES (?, ?, NULL, ?, NOW())`,
          [pid, mid, sec]
        );
        // 1 view = 1 tài khoản xem lần đầu (chưa có profile nào của user này từng xem phim này)
        const [existing] = await pool.query(
          `SELECT 1 FROM watch_history wh
           JOIN profiles p ON p.id = wh.profile_id
           WHERE wh.movie_id = ? AND wh.episode_id IS NULL AND p.user_id = ?
           LIMIT 2`,
          [mid, userId]
        );
        if (existing.length === 1) {
          await pool.query('UPDATE movies SET view_count = IFNULL(view_count, 0) + 1 WHERE id = ?', [mid]);
        }
      }
    } else {
      const eid = parseInt(episode_id, 10);
      const [result] = await pool.query(
        `UPDATE watch_history
         SET progress_seconds = ?, watched_at = NOW()
         WHERE profile_id = ? AND episode_id = ?`,
        [sec, pid, eid]
      );
      if (!result.affectedRows || result.affectedRows === 0) {
        await pool.query(
          `INSERT INTO watch_history (profile_id, movie_id, episode_id, progress_seconds, watched_at)
           VALUES (?, NULL, ?, ?, NOW())`,
          [pid, eid, sec]
        );
        const [existing] = await pool.query(
          `SELECT 1 FROM watch_history wh
           JOIN profiles p ON p.id = wh.profile_id
           WHERE wh.episode_id = ? AND p.user_id = ?
           LIMIT 2`,
          [eid, userId]
        );
        if (existing.length === 1) {
          await pool.query('UPDATE episodes SET view_count = IFNULL(view_count, 0) + 1 WHERE id = ?', [eid]);
        }
      }
    }
    res.json({ message: 'Đã lưu tiến độ xem' });
  } catch (err) {
    console.error('saveProgress error:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
}

// Danh sách "Tiếp tục xem" đơn giản (theo phim lẻ)
async function listContinueWatching(req, res) {
  const userId = req.user?.id;
  const { profile_id } = req.query;

  if (!userId) {
    return res.status(401).json({ message: 'Chưa đăng nhập' });
  }
  if (!profile_id) {
    return res.status(400).json({ message: 'profile_id là bắt buộc' });
  }

  try {
    const [movies] = await pool.query(
      `SELECT wh.movie_id AS id, m.title, m.thumbnail_url, MAX(wh.progress_seconds) AS progress_seconds, 'movie' AS type
       FROM watch_history wh
       JOIN movies m ON m.id = wh.movie_id
       WHERE wh.profile_id = ? AND wh.movie_id IS NOT NULL
       GROUP BY wh.movie_id
       ORDER BY MAX(wh.watched_at) DESC
       LIMIT 15`,
      [profile_id]
    );
    const [episodes] = await pool.query(
      `SELECT wh.episode_id AS id, e.title, e.thumbnail_url, e.series_id, MAX(wh.progress_seconds) AS progress_seconds, 'episode' AS type
       FROM watch_history wh
       JOIN episodes e ON e.id = wh.episode_id
       WHERE wh.profile_id = ? AND wh.episode_id IS NOT NULL
       GROUP BY wh.episode_id
       ORDER BY MAX(wh.watched_at) DESC
       LIMIT 15`,
      [profile_id]
    );
    res.json({ movies, episodes });
  } catch (err) {
    console.error('listContinueWatching error:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
}

// Lịch sử xem (theo profile) – danh sách gần đây
async function listWatchHistory(req, res) {
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
      `(SELECT wh.id, wh.movie_id AS content_id, wh.episode_id, wh.progress_seconds, wh.watched_at,
          m.title, m.thumbnail_url, 'movie' AS type, NULL AS series_id
        FROM watch_history wh
        LEFT JOIN movies m ON m.id = wh.movie_id
        WHERE wh.profile_id = ? AND wh.movie_id IS NOT NULL)
       UNION ALL
       (SELECT wh.id, wh.episode_id AS content_id, wh.episode_id, wh.progress_seconds, wh.watched_at,
          e.title, e.thumbnail_url, 'episode' AS type, e.series_id
        FROM watch_history wh
        LEFT JOIN episodes e ON e.id = wh.episode_id
        WHERE wh.profile_id = ? AND wh.episode_id IS NOT NULL)
       ORDER BY watched_at DESC
       LIMIT 50`,
      [profile_id, profile_id]
    );
    res.json(rows);
  } catch (err) {
    console.error('listWatchHistory error:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
}

module.exports = {
  getProgress,
  saveProgress,
  listContinueWatching,
  listWatchHistory,
};

