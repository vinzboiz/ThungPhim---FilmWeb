const { pool } = require('../config/db');

async function listPersons(req, res) {
  const { q, type } = req.query;
  try {
    let sql = 'SELECT id, name, avatar_url, biography, person_type FROM persons';
    const params = [];
    const conditions = [];
    if (q && String(q).trim()) {
      conditions.push('name LIKE ?');
      params.push(`%${String(q).trim()}%`);
    }
    if (type === 'actor' || type === 'director') {
      if (type === 'actor') {
        conditions.push('(person_type = ? OR person_type IS NULL)');
        params.push('actor');
      } else {
        conditions.push('person_type = ?');
        params.push('director');
      }
    }
    if (conditions.length) sql += ' WHERE ' + conditions.join(' AND ');
    sql += ' ORDER BY name ASC';
    const [rows] = await pool.query(sql, params);
    res.json(rows);
  } catch (err) {
    console.error('listPersons error:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
}

async function getPersonById(req, res) {
  const { id } = req.params;
  try {
    const [rows] = await pool.query('SELECT * FROM persons WHERE id = ?', [id]);
    if (rows.length === 0) {
      return res.status(404).json({ message: 'Person not found' });
    }
    res.json(rows[0]);
  } catch (err) {
    console.error('getPersonById error:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
}

async function getPersonMovies(req, res) {
  const { id } = req.params;
  try {
    const [movies] = await pool.query(
      `SELECT m.id, m.title, m.thumbnail_url, m.age_rating, c.role
       FROM cast c
       JOIN movies m ON m.id = c.movie_id
       WHERE c.person_id = ? AND c.movie_id IS NOT NULL`,
      [id]
    );

    const [episodes] = await pool.query(
      `SELECT e.id, e.title, e.thumbnail_url, e.series_id, c.role
       FROM cast c
       JOIN episodes e ON e.id = c.episode_id
       WHERE c.person_id = ? AND c.episode_id IS NOT NULL`,
      [id]
    );

    res.json({ movies, episodes });
  } catch (err) {
    console.error('getPersonMovies error:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
}

async function createPerson(req, res) {
  const { name, avatar_url, biography, person_type } = req.body;
  if (!name || !String(name).trim()) {
    return res.status(400).json({ message: 'Tên là bắt buộc' });
  }
  const type = person_type === 'director' ? 'director' : 'actor';
  try {
    const [result] = await pool.query(
      'INSERT INTO persons (name, avatar_url, biography, person_type) VALUES (?, ?, ?, ?)',
      [String(name).trim(), avatar_url || null, biography || null, type]
    );
    const [rows] = await pool.query('SELECT * FROM persons WHERE id = ?', [result.insertId]);
    res.status(201).json(rows[0]);
  } catch (err) {
    console.error('createPerson error:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
}

async function updatePerson(req, res) {
  const { id } = req.params;
  const { name, avatar_url, biography, person_type } = req.body;
  if (!name || !String(name).trim()) {
    return res.status(400).json({ message: 'Tên là bắt buộc' });
  }
  const type = person_type === 'director' ? 'director' : 'actor';
  try {
    const [rows] = await pool.query('SELECT id FROM persons WHERE id = ?', [id]);
    if (rows.length === 0) {
      return res.status(404).json({ message: 'Person not found' });
    }
    await pool.query(
      'UPDATE persons SET name = ?, avatar_url = ?, biography = ?, person_type = ? WHERE id = ?',
      [String(name).trim(), avatar_url ?? null, biography ?? null, type, id]
    );
    const [updated] = await pool.query('SELECT * FROM persons WHERE id = ?', [id]);
    res.json(updated[0]);
  } catch (err) {
    console.error('updatePerson error:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
}

async function deletePerson(req, res) {
  const { id } = req.params;
  try {
    const [rows] = await pool.query('SELECT id FROM persons WHERE id = ?', [id]);
    if (rows.length === 0) {
      return res.status(404).json({ message: 'Person not found' });
    }
    await pool.query('DELETE FROM cast WHERE person_id = ?', [id]);
    await pool.query('DELETE FROM persons WHERE id = ?', [id]);
    res.json({ message: 'Đã xoá diễn viên' });
  } catch (err) {
    console.error('deletePerson error:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
}

module.exports = {
  listPersons,
  getPersonById,
  getPersonMovies,
  createPerson,
  updatePerson,
  deletePerson,
};

