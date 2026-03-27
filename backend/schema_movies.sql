-- Chạy trong MySQL (HeidiSQL) nếu bảng movies chưa đúng cấu trúc.
-- Kiểm tra bảng hiện tại: DESCRIBE movies;

-- Nếu chưa có bảng movies, tạo mới:
CREATE TABLE IF NOT EXISTS movies (
  id INT AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  release_year INT,
  duration_minutes INT,
  thumbnail_url VARCHAR(500),
  trailer_url VARCHAR(500),
  video_url VARCHAR(500),
  rating DECIMAL(3,1),
  age_rating VARCHAR(10),
  is_featured TINYINT(1) DEFAULT 0,
  view_count INT DEFAULT 0,
  like_count INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Nếu bảng đã có nhưng thiếu cột, có thể thêm (chạy từng dòng nếu báo lỗi "column exists"):
-- ALTER TABLE movies ADD COLUMN video_url VARCHAR(500);
-- ALTER TABLE movies ADD COLUMN created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
-- ALTER TABLE movies ADD COLUMN updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP;
