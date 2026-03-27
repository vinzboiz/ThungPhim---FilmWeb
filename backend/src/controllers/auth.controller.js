const { pool } = require('../config/db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { createNotification } = require('./notifications.controller');

const JWT_SECRET = process.env.JWT_SECRET || 'dev_secret_key';
/** Giống Spring: tài khoản chỉ đăng nhập Google, không dùng mật khẩu email */
const OAUTH_PLACEHOLDER = 'OAUTH_GOOGLE';

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
    if (user.password_hash === OAUTH_PLACEHOLDER) {
      return res.status(401).json({
        message: 'Tài khoản này dùng Google. Vui lòng chọn Đăng nhập bằng Google.',
      });
    }
    if (user.locked === 1 || user.locked === true) {
      return res.status(403).json({ message: 'Tài khoản đã bị khóa. Liên hệ quản trị viên.' });
    }
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
    const [rows] = await pool.query('SELECT * FROM users WHERE id = ?', [userId]);
    if (rows.length === 0) {
      return res.status(404).json({ message: 'User không tồn tại' });
    }
    const u = rows[0];
    if (u.locked === 1 || u.locked === true) {
      return res.status(403).json({ message: 'Tài khoản đã bị khóa. Liên hệ quản trị viên.' });
    }
    res.json({
      id: u.id,
      email: u.email,
      full_name: u.full_name,
      is_admin: !!u.is_admin,
      avatar_url: u.avatar_url || null,
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
    const [rows] = await pool.query('SELECT id, password_hash FROM users WHERE email = ?', [email]);
    if (rows.length === 0) {
      return res.status(404).json({ message: 'User không tồn tại' });
    }
    if (rows[0].password_hash === OAUTH_PLACEHOLDER) {
      return res.status(400).json({ message: 'Tài khoản Google không dùng mật khẩu.' });
    }

    const hash = await bcrypt.hash(new_password, 10);
    await pool.query('UPDATE users SET password_hash = ? WHERE email = ?', [hash, email]);

    res.json({ message: 'Đã đặt lại mật khẩu' });
  } catch (err) {
    console.error('resetPassword error:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
}

/**
 * Xác thực bằng máy chủ: nhận id_token từ Google Identity Services, verify qua tokeninfo API.
 * Kiểm tra aud = GOOGLE_CLIENT_ID (cùng Client ID với frontend VITE_GOOGLE_CLIENT_ID).
 */
async function loginWithGoogle(req, res) {
  const { id_token } = req.body;
  const googleClientId = (process.env.GOOGLE_CLIENT_ID || '').trim();

  if (!id_token) {
    return res.status(400).json({ message: 'id_token là bắt buộc' });
  }
  if (!googleClientId) {
    return res.status(503).json({
      message: 'Google đăng nhập chưa cấu hình. Thêm GOOGLE_CLIENT_ID vào file .env.',
    });
  }

  try {
    const tokenUrl = `https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(id_token)}`;
    const gRes = await fetch(tokenUrl);
    if (!gRes.ok) {
      return res.status(401).json({ message: 'Token Google không hợp lệ' });
    }
    const data = await gRes.json();
    if (data.aud !== googleClientId) {
      return res.status(401).json({ message: 'Token không khớp ứng dụng' });
    }
    const email = data.email ? String(data.email).trim() : null;
    if (!email) {
      return res.status(400).json({ message: 'Google không trả về email' });
    }
    const nameFromToken = data.name && String(data.name).trim() ? String(data.name).trim() : null;
    const picture = data.picture ? String(data.picture).trim() : null;
    const displayName = nameFromToken || email;

    const [rows] = await pool.query('SELECT * FROM users WHERE email = ?', [email]);
    let user;

    if (rows.length === 0) {
      const [result] = await pool.query(
        `INSERT INTO users (email, password_hash, full_name, avatar_url, created_at, updated_at)
         VALUES (?, ?, ?, ?, NOW(3), NOW(3))`,
        [email, OAUTH_PLACEHOLDER, displayName, picture]
      );
      user = {
        id: result.insertId,
        email,
        full_name: displayName,
        is_admin: 0,
      };
    } else {
      user = rows[0];
      if (user.locked === 1 || user.locked === true) {
        return res.status(403).json({
          message: 'Tài khoản đã bị khóa. Liên hệ quản trị viên.',
        });
      }
      await pool.query(
        `UPDATE users SET full_name = ?, avatar_url = ?, last_login_at = NOW(3), updated_at = NOW(3) WHERE id = ?`,
        [nameFromToken || user.full_name, picture || user.avatar_url, user.id]
      );
      user = {
        id: user.id,
        email: user.email,
        full_name: nameFromToken || user.full_name,
        is_admin: user.is_admin,
      };
    }

    const token = jwt.sign(
      { userId: user.id, email: user.email, isAdmin: !!user.is_admin },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    createNotification(user.id, 'login', 'Bạn đã đăng nhập vào ThungPhim (Google).').catch(() => {});

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
    console.error('loginWithGoogle error:', err);
    res.status(401).json({ message: 'Xác thực Google thất bại' });
  }
}

module.exports = {
  register,
  login,
  logout,
  getMe,
  forgotPassword,
  resetPassword,
  loginWithGoogle,
};

