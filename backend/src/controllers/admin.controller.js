const { pool } = require('../config/db');

async function listUsers(req, res) {
  try {
    const [rows] = await pool.query(
      'SELECT id, email, full_name, is_admin, created_at FROM users ORDER BY id DESC'
    );
    res.json(rows);
  } catch (err) {
    console.error('listUsers error:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
}

async function updateUser(req, res) {
  const { id } = req.params;
  const { is_admin, locked } = req.body;

  try {
    const [rows] = await pool.query('SELECT id FROM users WHERE id = ?', [id]);
    if (rows.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    await pool.query(
      `UPDATE users
       SET is_admin = COALESCE(?, is_admin),
           locked = COALESCE(?, locked)
       WHERE id = ?`,
      [
        typeof is_admin === 'boolean' ? (is_admin ? 1 : 0) : null,
        typeof locked === 'boolean' ? (locked ? 1 : 0) : null,
        id,
      ]
    );

    const [updated] = await pool.query(
      'SELECT id, email, full_name, is_admin, locked, created_at FROM users WHERE id = ?',
      [id]
    );
    res.json(updated[0]);
  } catch (err) {
    console.error('updateUser error:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
}

module.exports = {
  listUsers,
  updateUser,
};

