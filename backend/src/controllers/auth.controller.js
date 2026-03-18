const { pool } = require('../config/db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { createNotification } = require('./notifications.controller');

const JWT_SECRET = process.env.JWT_SECRET || 'dev_secret_key';

async function register(req, res) {
  const { email, password, full_name } = req.body;
  if (!email || !password || !full_name) {
    return res.status(400).json({ message: 'email, password, full_name là bắt buộc' });
  }

  try {
    const [existing] = await pool.query('SELECT id FROM users WHERE email = ?', [email]);
    if (existing.length > 0) {
      return res.status(409).json({ message: 'Email đã tồn tại' });
    }

    const hash = await bcrypt.hash(password, 10);
    const [result] = await pool.query(
      `INSERT INTO users (email, password_hash, full_name, created_at, updated_at)
       VALUES (?, ?, ?, NOW(), NOW())`,
      [email, hash, full_name]
    );

    res.status(201).json({ id: result.insertId, email, full_name });
  } catch (err) {
    console.error('register error:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
}

async function login(req, res) {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ message: 'email và password là bắt buộc' });
  }

  try {
    const [rows] = await pool.query('SELECT * FROM users WHERE email = ?', [email]);
    if (rows.length === 0) {
      return res.status(401).json({ message: 'Sai email hoặc mật khẩu' });
    }

    const user = rows[0];
    const ok = await bcrypt.compare(password, user.password_hash);
    if (!ok) {
      return res.status(401).json({ message: 'Sai email hoặc mật khẩu' });
    }

    const token = jwt.sign(
      { userId: user.id, email: user.email, isAdmin: !!user.is_admin },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    // Ghi lại thông báo đăng nhập (best-effort, không chặn login nếu lỗi)
    createNotification(user.id, 'login', 'Bạn đã đăng nhập vào ThungPhim.').catch(() => {});

    res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        full_name: user.full_name,
        is_admin: !!user.is_admin,
      },
    });
  } catch (err) {
    console.error('login error:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
}

async function logout(req, res) {
  // Với JWT không lưu server-side, logout phía client chỉ cần xoá token.
  res.json({ message: 'Logged out' });
}

async function getMe(req, res) {
  const userId = req.user?.id;
  if (!userId) {
    return res.status(401).json({ message: 'Thiếu thông tin user' });
  }
  try {
    const [rows] = await pool.query(
      'SELECT id, email, full_name, is_admin FROM users WHERE id = ?',
      [userId]
    );
    if (rows.length === 0) {
      return res.status(404).json({ message: 'User không tồn tại' });
    }
    const u = rows[0];
    res.json({
      id: u.id,
      email: u.email,
      full_name: u.full_name,
      is_admin: !!u.is_admin,
    });
  } catch (err) {
    console.error('getMe error:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
}

// Đơn giản hoá forgot/reset password cho môi trường local:
// - forgot: kiểm tra email tồn tại, trả message (không gửi mail thật).
// - reset: cho phép đặt lại mật khẩu mới nếu biết email (hoặc sau khi đã "xác thực" ngoài hệ thống).

async function forgotPassword(req, res) {
  const { email } = req.body;
  if (!email) {
    return res.status(400).json({ message: 'email là bắt buộc' });
  }

  try {
    const [rows] = await pool.query('SELECT id FROM users WHERE email = ?', [email]);
    if (rows.length === 0) {
      // Tránh lộ thông tin, vẫn trả message chung
      return res.json({ message: 'Nếu email tồn tại, link reset sẽ được gửi (demo: không gửi thật).' });
    }

    // Ở môi trường thật: tạo token reset, lưu DB + gửi email.
    res.json({ message: 'Demo: yêu cầu reset mật khẩu đã được ghi nhận (không gửi email thật).' });
  } catch (err) {
    console.error('forgotPassword error:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
}

async function resetPassword(req, res) {
  const { email, new_password } = req.body;
  if (!email || !new_password) {
    return res.status(400).json({ message: 'email và new_password là bắt buộc' });
  }

  try {
    const [rows] = await pool.query('SELECT id FROM users WHERE email = ?', [email]);
    if (rows.length === 0) {
      return res.status(404).json({ message: 'User không tồn tại' });
    }

    const hash = await bcrypt.hash(new_password, 10);
    await pool.query('UPDATE users SET password_hash = ? WHERE email = ?', [hash, email]);

    res.json({ message: 'Đã đặt lại mật khẩu' });
  } catch (err) {
    console.error('resetPassword error:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
}

module.exports = {
  register,
  login,
  logout,
  getMe,
  forgotPassword,
  resetPassword,
};

