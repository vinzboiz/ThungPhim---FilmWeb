const mysql = require('mysql2/promise');
const dotenv = require('dotenv');

dotenv.config();

const pool = mysql.createPool({
  host: process.env.DB_HOST || '127.0.0.1',
  port: process.env.DB_PORT || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'thungphim',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

async function testConnection() {
  try {
    const [rows] = await pool.query('SELECT 1 AS result');
    console.log('MySQL connected, test query result:', rows[0].result);
    await pool.query(`
      CREATE TABLE IF NOT EXISTS series_cast (
        id INT AUTO_INCREMENT PRIMARY KEY,
        series_id INT NOT NULL,
        person_id INT NOT NULL,
        role VARCHAR(20) NOT NULL,
        UNIQUE KEY uniq_series_cast (series_id, person_id, role),
        KEY idx_series_cast_series (series_id)
      )
    `).catch((e) => console.warn('series_cast table init:', e.message));
    await pool.query('ALTER TABLE series ADD COLUMN trailer_url VARCHAR(255) NULL').catch((e) => {
      if (!/Duplicate column/.test(e.message)) console.warn('series trailer_url:', e.message);
    });
    await pool.query('ALTER TABLE series ADD COLUMN rating DECIMAL(3,1) NULL').catch((e) => {
      if (!/Duplicate column/.test(e.message)) console.warn('series rating:', e.message);
    });
    await pool.query('ALTER TABLE series ADD COLUMN like_count INT NOT NULL DEFAULT 0').catch((e) => {
      if (!/Duplicate column/.test(e.message)) console.warn('series like_count:', e.message);
    });
    await pool.query('ALTER TABLE series ADD COLUMN release_year INT NULL').catch((e) => {
      if (!/Duplicate column/.test(e.message)) console.warn('series release_year:', e.message);
    });
    await pool.query('ALTER TABLE reviews ADD COLUMN series_id INT NULL').catch((e) => {
      if (!/Duplicate column/.test(e.message)) console.warn('reviews series_id:', e.message);
    });
    // Đánh giá theo account: cho phép profile_id NULL
    await pool.query('ALTER TABLE reviews MODIFY COLUMN profile_id INT NULL').catch((e) => {
      console.warn('reviews profile_id NULL:', e.message);
    });
    // Ràng buộc đánh giá theo account (user), không theo profile
    await pool.query('ALTER TABLE reviews DROP INDEX uniq_review_profile_movie').catch((e) => {
      if (!/check that column|Unknown key/.test(e.message)) console.warn('drop uniq_review_profile_movie:', e.message);
    });
    await pool.query('ALTER TABLE reviews DROP INDEX uniq_review_profile_episode').catch((e) => {
      if (!/check that column|Unknown key/.test(e.message)) console.warn('drop uniq_review_profile_episode:', e.message);
    });
    await pool.query('ALTER TABLE reviews DROP INDEX uniq_review_profile_series').catch((e) => {
      if (!/check that column|Unknown key/.test(e.message)) console.warn('drop uniq_review_profile_series:', e.message);
    });
    // Cho phép 1 account comment nhiều lần (giới hạn 2/30p ở controller)
    await pool.query('ALTER TABLE reviews DROP INDEX uniq_review_user_movie').catch((e) => {
      if (!/check that column|Unknown key/.test(e.message)) console.warn('drop uniq_review_user_movie:', e.message);
    });
    await pool.query('ALTER TABLE reviews DROP INDEX uniq_review_user_episode').catch((e) => {
      if (!/check that column|Unknown key/.test(e.message)) console.warn('drop uniq_review_user_episode:', e.message);
    });
    await pool.query('ALTER TABLE reviews DROP INDEX uniq_review_user_series').catch((e) => {
      if (!/check that column|Unknown key/.test(e.message)) console.warn('drop uniq_review_user_series:', e.message);
    });
  } catch (err) {
    console.error('MySQL connection error:', err.message);
  }
}

module.exports = {
  pool,
  testConnection,
};

