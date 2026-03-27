const { pool } = require('../config/db');

/** Top N thể loại; kèm danh sách phim + series mỗi thể loại. Query: type=movie|series, featured=1 */
async function listTopGenresWithMovies(req, res) {
  const genreLimit = Math.min(Number(req.query.limit) || 5, 10);
  const moviesPerGenre = Math.min(Number(req.query.movies_per_genre) || 10, 20);
  const type = (req.query.type || '').toLowerCase();
  const featured = req.query.featured === '1' || req.query.featured === 'true';
  const featWhere = featured ? ' AND m.is_featured = 1' : '';
  const featWhereS = featured ? ' AND s.is_featured = 1' : '';
  try {
    const [topGenres] = await pool.query(
      `SELECT g.id, g.name,
              COUNT(u.content_id) AS cnt,
              COALESCE(AVG(u.rating), 0) AS avg_rating,
              COALESCE(SUM(u.view_count), 0) AS total_views
       FROM genres g
       LEFT JOIN (
         SELECT mg.genre_id, m.id AS content_id, m.rating, m.view_count
         FROM movie_genres mg
         INNER JOIN movies m ON m.id = mg.movie_id
         UNION ALL
         SELECT sg.genre_id, s.id AS content_id, s.rating, s.view_count
         FROM series_genres sg
         INNER JOIN series s ON s.id = sg.series_id
       ) u ON u.genre_id = g.id
       GROUP BY g.id, g.name
       ORDER BY cnt DESC, avg_rating DESC, total_views DESC
       LIMIT ?`,
      [genreLimit]
    );
    const result = [];
    for (const row of topGenres || []) {
      let combined = [];
      if (type !== 'series') {
        const [movieRows] = await pool.query(
          `SELECT m.id, m.title, m.thumbnail_url, m.banner_url, m.age_rating, m.release_year, m.country_code, m.rating
           FROM movies m
           INNER JOIN movie_genres mg ON mg.movie_id = m.id AND mg.genre_id = ?
           WHERE 1=1${featWhere}
           ORDER BY m.id DESC
           LIMIT ?`,
          [row.id, moviesPerGenre]
        );
        combined = (movieRows || []).map((m) => ({ ...m, type: 'movie' }));
      }
      if (type !== 'movie') {
        const [seriesRows] = await pool.query(
          `SELECT s.id, s.title, s.thumbnail_url, s.banner_url, s.age_rating, s.release_year, s.country_code, s.rating
           FROM series s
           INNER JOIN series_genres sg ON sg.series_id = s.id AND sg.genre_id = ?
           WHERE 1=1${featWhereS}
           ORDER BY s.id DESC
           LIMIT ?`,
          [row.id, moviesPerGenre]
        );
        combined = [...combined, ...(seriesRows || []).map((s) => ({ ...s, type: 'series' }))];
      }
      combined = combined.sort((a, b) => b.id - a.id).slice(0, moviesPerGenre);
      result.push({ genre: { id: row.id, name: row.name }, movies: combined });
    }
    res.json(result);
  } catch (err) {
    console.error('listTopGenresWithMovies error:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
}

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
  listTopGenresWithMovies,
  listGenres,
  createGenre,
  updateGenre,
  deleteGenre,
};
