const express = require('express');
const multer = require('multer');
const path = require('path');
const { spawn } = require('child_process');
const { pool } = require('../config/db');
const authMiddleware = require('../middleware/auth.middleware');

const router = express.Router();

const uploadsRoot = path.join(__dirname, '..', '..', 'uploads');
const videosDir = path.join(uploadsRoot, 'videos');
const imagesDir = path.join(uploadsRoot, 'images');

const videoStorage = multer.diskStorage({
  destination: videosDir,
  filename: (req, file, cb) => {
    const unique = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, unique + path.extname(file.originalname));
  },
});

const imageStorage = multer.diskStorage({
  destination: imagesDir,
  filename: (req, file, cb) => {
    const unique = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, unique + path.extname(file.originalname));
  },
});

const uploadVideo = multer({ storage: videoStorage });
const uploadImage = multer({ storage: imageStorage });

function requireAdmin(req, res, next) {
  if (!req.user?.isAdmin) {
    return res.status(403).json({ message: 'Chỉ admin mới được phép thao tác' });
  }
  next();
}

// POST /api/upload/video
router.post('/video', authMiddleware, requireAdmin, uploadVideo.single('video'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: 'Không có file nào được upload' });
  }
  const video_url = `/uploads/videos/${req.file.filename}`;
  res.json({ video_url });
});

// POST /api/upload/image – upload ảnh (poster / thumbnail) dùng chung cho movie / series / genres
router.post('/image', authMiddleware, requireAdmin, uploadImage.single('image'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: 'Không có file nào được upload' });
  }
  const image_url = `/uploads/images/${req.file.filename}`;
  res.json({ image_url });
});

// POST /api/upload/episode-video/:episodeId – upload và gán video_url cho episode
router.post(
  '/episode-video/:episodeId',
  authMiddleware,
  requireAdmin,
  uploadVideo.single('video'),
  async (req, res) => {
    if (!req.file) {
      return res.status(400).json({ message: 'Không có file nào được upload' });
    }
    const { episodeId } = req.params;
    const video_url = `/uploads/videos/${req.file.filename}`;

    try {
      const [rows] = await pool.query('SELECT id FROM episodes WHERE id = ?', [episodeId]);
      if (rows.length === 0) {
        return res.status(404).json({ message: 'Episode not found' });
      }

      await pool.query('UPDATE episodes SET video_url = ? WHERE id = ?', [video_url, episodeId]);

      res.json({ episode_id: Number(episodeId), video_url });
    } catch (err) {
      console.error('upload episode video error:', err);
      res.status(500).json({ message: 'Internal server error' });
    }
  }
);

// POST /api/upload/episode-thumbnail-from-video/:episodeId
// Cắt ngẫu nhiên 1 frame từ video của tập để làm ảnh bìa
router.post(
  '/episode-thumbnail-from-video/:episodeId',
  authMiddleware,
  requireAdmin,
  async (req, res) => {
    const { episodeId } = req.params;
    try {
      const [rows] = await pool.query('SELECT video_url FROM episodes WHERE id = ?', [episodeId]);
      if (!rows || rows.length === 0) {
        return res.status(404).json({ message: 'Episode not found' });
      }
      const videoUrl = rows[0].video_url;
      if (!videoUrl) {
        return res.status(400).json({ message: 'Tập này chưa có video để cắt ảnh bìa' });
      }

      const isAbsolute = videoUrl.startsWith('http://') || videoUrl.startsWith('https://');
      if (isAbsolute) {
        return res.status(400).json({ message: 'Chỉ hỗ trợ video lưu local trong thư mục uploads' });
      }

      // Đường dẫn tuyệt đối tới file video
      const relativeVideoPath = videoUrl.startsWith('/') ? videoUrl.slice(1) : videoUrl;
      const videoPath = path.join(__dirname, '..', '..', relativeVideoPath);

      // Đường dẫn file ảnh output
      const fileName = `ep-${episodeId}-${Date.now()}-${Math.round(Math.random() * 1e6)}.jpg`;
      const outputPath = path.join(imagesDir, fileName);
      const imageUrl = `/uploads/images/${fileName}`;

      // Chọn thời điểm ngẫu nhiên khoảng 5–25 giây (đủ cho hầu hết video demo)
      const randomSeconds = 5 + Math.floor(Math.random() * 20);
      const ssArg = String(randomSeconds);

      await new Promise((resolve, reject) => {
        const ff = spawn('ffmpeg', [
          '-ss',
          ssArg,
          '-i',
          videoPath,
          '-frames:v',
          '1',
          '-q:v',
          '2',
          outputPath,
        ]);

        ff.on('error', (err) => reject(err));
        ff.on('close', (code) => {
          if (code === 0) resolve();
          else reject(new Error(`ffmpeg exited with code ${code}`));
        });
      });

      await pool.query('UPDATE episodes SET thumbnail_url = ? WHERE id = ?', [imageUrl, episodeId]);

      res.json({ episode_id: Number(episodeId), image_url: imageUrl });
    } catch (err) {
      console.error('auto thumbnail from video error:', err);
      res.status(500).json({ message: 'Không tạo được ảnh bìa từ video' });
    }
  }
);

module.exports = router;

