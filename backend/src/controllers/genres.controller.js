const { pool } = require('../config/db');

async function listGenres(req, res) {
  try {
    const [rows] = await pool.query(
      'SELECT id, name, description, thumbnail_url FROM genres ORDER BY name'
    );
    res.json(rows);
  } catch (err) {
    console.error('listGenres error:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
}

async function createGenre(req, res) {
  const { name, description, thumbnail_url } = req.body;
  if (!name) {
    return res.status(400).json({ message: 'name là bắt buộc' });
  }

  try {
    const [existing] = await pool.query('SELECT id FROM genres WHERE name = ?', [name]);
    if (existing.length > 0) {
      return res.status(409).json({ message: 'Genre đã tồn tại' });
    }

    const [result] = await pool.query(
      'INSERT INTO genres (name, description, thumbnail_url) VALUES (?, ?, ?)',
      [name, description || null, thumbnail_url || null]
    );
    const [rows] = await pool.query('SELECT * FROM genres WHERE id = ?', [result.insertId]);
    res.status(201).json(rows[0]);
  } catch (err) {
    console.error('createGenre error:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
}

async function updateGenre(req, res) {
  const { id } = req.params;
  const { name, description, thumbnail_url } = req.body;

  if (!name) {
    return res.status(400).json({ message: 'name là bắt buộc' });
  }

  try {
    const [rows] = await pool.query('SELECT id FROM genres WHERE id = ?', [id]);
    if (rows.length === 0) {
      return res.status(404).json({ message: 'Genre not found' });
    }

    await pool.query(
      'UPDATE genres SET name = ?, description = ?, thumbnail_url = ? WHERE id = ?',
      [name, description || null, thumbnail_url || null, id]
    );
    const [updated] = await pool.query('SELECT * FROM genres WHERE id = ?', [id]);
    res.json(updated[0]);
  } catch (err) {
    console.error('updateGenre error:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
}

async function deleteGenre(req, res) {
  const { id } = req.params;
  try {
    const [rows] = await pool.query('SELECT id FROM genres WHERE id = ?', [id]);
    if (rows.length === 0) {
      return res.status(404).json({ message: 'Genre not found' });
    }

    await pool.query('DELETE FROM movie_genres WHERE genre_id = ?', [id]).catch(() => {});
    await pool.query('DELETE FROM genres WHERE id = ?', [id]);

    res.json({ message: 'Đã xoá genre' });
  } catch (err) {
    console.error('deleteGenre error:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
}

module.exports = {
  listGenres,
  createGenre,
  updateGenre,
  deleteGenre,
};
