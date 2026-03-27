const { pool } = require('../config/db');

async function listNotifications(req, res) {
  const userId = req.user?.id;
  const onlyUnread = req.query.only_unread === '1' || req.query.only_unread === 'true';

  if (!userId) {
    return res.status(401).json({ message: 'Chưa đăng nhập' });
  }

  try {
    const where = onlyUnread ? 'AND is_read = 0' : '';
    const [rows] = await pool.query(
      `SELECT id, type, message, is_read, created_at
       FROM notifications
       WHERE user_id = ?
       ${where}
       ORDER BY created_at DESC
       LIMIT 50`,
      [userId],
    );
    res.json(rows || []);
  } catch (err) {
    console.error('listNotifications error:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
}

async function markAllRead(req, res) {
  const userId = req.user?.id;
  if (!userId) {
    return res.status(401).json({ message: 'Chưa đăng nhập' });
  }

  try {
    await pool.query(
      'UPDATE notifications SET is_read = 1 WHERE user_id = ? AND is_read = 0',
      [userId],
    );
    res.json({ message: 'Đã đánh dấu tất cả thông báo là đã đọc' });
  } catch (err) {
    console.error('markAllRead error:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
}

async function createNotification(userId, type, message) {
  if (!userId) return;
  try {
    await pool.query(
      'INSERT INTO notifications (user_id, type, message, is_read, created_at) VALUES (?, ?, ?, 0, NOW())',
      [userId, type, message],
    );
  } catch (err) {
    console.error('createNotification error:', err.message);
  }
}

module.exports = {
  listNotifications,
  markAllRead,
  createNotification,
};

