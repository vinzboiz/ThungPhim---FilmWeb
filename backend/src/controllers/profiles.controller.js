const { pool } = require('../config/db');

// Lấy tất cả profiles của user hiện tại
async function listProfiles(req, res) {
  const userId = req.user?.id;
  if (!userId) {
    return res.status(401).json({ message: 'Chưa đăng nhập' });
  }

  try {
    const [rows] = await pool.query('SELECT * FROM profiles WHERE user_id = ?', [userId]);
    res.json(rows);
  } catch (err) {
    console.error('listProfiles error:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
}

// Tạo profile mới
async function createProfile(req, res) {
  const userId = req.user?.id;
  if (!userId) {
    return res.status(401).json({ message: 'Chưa đăng nhập' });
  }

  const { name, avatar, is_kids, max_maturity_rating, pin_code } = req.body;
  if (!name) {
    return res.status(400).json({ message: 'name là bắt buộc' });
  }

  try {
    const [result] = await pool.query(
      'INSERT INTO profiles (user_id, name, avatar, is_kids, max_maturity_rating, pin_code) VALUES (?, ?, ?, ?, ?, ?)',
      [userId, name, avatar || null, is_kids ? 1 : 0, max_maturity_rating || '18+', pin_code || null]
    );

    const [rows] = await pool.query('SELECT * FROM profiles WHERE id = ?', [result.insertId]);
    res.status(201).json(rows[0]);
  } catch (err) {
    console.error('createProfile error:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
}

// Cập nhật profile
async function updateProfile(req, res) {
  const userId = req.user?.id;
  const { id } = req.params;
  const { name, avatar, is_kids, max_maturity_rating, pin_code } = req.body;

  if (!userId) {
    return res.status(401).json({ message: 'Chưa đăng nhập' });
  }

  try {
    const [rows] = await pool.query('SELECT * FROM profiles WHERE id = ? AND user_id = ?', [id, userId]);
    if (rows.length === 0) {
      return res.status(404).json({ message: 'Profile không tồn tại' });
    }

    await pool.query(
      `UPDATE profiles 
       SET name = COALESCE(?, name),
           avatar = COALESCE(?, avatar),
           is_kids = COALESCE(?, is_kids),
           max_maturity_rating = COALESCE(?, max_maturity_rating),
           pin_code = COALESCE(?, pin_code)
       WHERE id = ? AND user_id = ?`,
      [
        name || null,
        avatar || null,
        typeof is_kids === 'boolean' ? (is_kids ? 1 : 0) : null,
        max_maturity_rating || null,
        pin_code || null,
        id,
        userId,
      ]
    );

    const [updated] = await pool.query('SELECT * FROM profiles WHERE id = ?', [id]);
    res.json(updated[0]);
  } catch (err) {
    console.error('updateProfile error:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
}

// Xoá profile
async function deleteProfile(req, res) {
  const userId = req.user?.id;
  const { id } = req.params;

  if (!userId) {
    return res.status(401).json({ message: 'Chưa đăng nhập' });
  }

  try {
    const [rows] = await pool.query('SELECT id FROM profiles WHERE id = ? AND user_id = ?', [id, userId]);
    if (rows.length === 0) {
      return res.status(404).json({ message: 'Profile không tồn tại' });
    }

    await pool.query('DELETE FROM profiles WHERE id = ? AND user_id = ?', [id, userId]);
    res.json({ message: 'Đã xoá profile' });
  } catch (err) {
    console.error('deleteProfile error:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
}

// Xác thực PIN cho profile (kids mode)
async function verifyProfilePin(req, res) {
  const userId = req.user?.id;
  const { id } = req.params;
  const { pin_code } = req.body;

  if (!userId) {
    return res.status(401).json({ message: 'Chưa đăng nhập' });
  }
  if (!pin_code) {
    return res.status(400).json({ message: 'pin_code là bắt buộc' });
  }

  try {
    const [rows] = await pool.query(
      'SELECT pin_code FROM profiles WHERE id = ? AND user_id = ?',
      [id, userId]
    );
    if (rows.length === 0) {
      return res.status(404).json({ message: 'Profile không tồn tại' });
    }
    const currentPin = rows[0].pin_code;
    if (!currentPin) {
      return res.status(400).json({ message: 'Profile này chưa thiết lập PIN' });
    }
    if (String(currentPin) !== String(pin_code)) {
      return res.status(403).json({ message: 'PIN không đúng' });
    }
    res.json({ message: 'PIN hợp lệ' });
  } catch (err) {
    console.error('verifyProfilePin error:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
}

module.exports = {
  listProfiles,
  createProfile,
  updateProfile,
  deleteProfile,
  verifyProfilePin,
};

