-- Bảng reviews cho phim / tập
-- Chạy trong MySQL (HeidiSQL) sau khi tạo database thungphim

CREATE TABLE IF NOT EXISTS reviews (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  profile_id INT NOT NULL,
  movie_id INT NULL,
  episode_id INT NULL,
  rating TINYINT NOT NULL,          -- 1..5
  comment TEXT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  CONSTRAINT uniq_review_per_profile_movie
    UNIQUE KEY (profile_id, movie_id),
  CONSTRAINT uniq_review_per_profile_episode
    UNIQUE KEY (profile_id, episode_id)
);

