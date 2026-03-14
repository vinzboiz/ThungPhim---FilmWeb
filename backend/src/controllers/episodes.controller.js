const { pool } = require('../config/db');

// Episode_Cast – quản lý cast theo từng tập

async function getEpisodeCast(req, res) {
  const { id } = req.params;
  try {
    const [rows] = await pool.query(
      `SELECT c.episode_id, c.person_id, c.role, p.name, p.avatar_url
       FROM cast c
       JOIN persons p ON p.id = c.person_id
       WHERE c.episode_id = ?`,
      [id]
    );
    res.json(rows);
  } catch (err) {
    console.error('getEpisodeCast error:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
}

async function addEpisodeCast(req, res) {
  const { id } = req.params;
  const { person_id, role } = req.body;

  if (!person_id) {
    return res.status(400).json({ message: 'person_id là bắt buộc' });
  }

  try {
    await pool.query(
      'INSERT IGNORE INTO cast (episode_id, person_id, role) VALUES (?, ?, ?)',
      [id, person_id, role || null]
    );
    res.status(201).json({ message: 'Đã gán cast cho episode' });
  } catch (err) {
    console.error('addEpisodeCast error:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
}

async function removeEpisodeCast(req, res) {
  const { episodeId, personId } = req.params;
  try {
    await pool.query(
      'DELETE FROM cast WHERE episode_id = ? AND person_id = ?',
      [episodeId, personId]
    );
    res.json({ message: 'Đã xoá cast khỏi episode' });
  } catch (err) {
    console.error('removeEpisodeCast error:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
}

module.exports = {
  getEpisodeCast,
  addEpisodeCast,
  removeEpisodeCast,
};

