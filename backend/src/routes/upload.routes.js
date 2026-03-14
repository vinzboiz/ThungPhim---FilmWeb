const express = require('express');
const multer = require('multer');
const path = require('path');
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

// POST /api/upload/video
router.post('/video', uploadVideo.single('video'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: 'Không có file nào được upload' });
  }
  const video_url = `/uploads/videos/${req.file.filename}`;
  res.json({ video_url });
});

// POST /api/upload/image – upload ảnh (poster / thumbnail) dùng chung cho movie / series / genres
router.post('/image', uploadImage.single('image'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: 'Không có file nào được upload' });
  }
  const image_url = `/uploads/images/${req.file.filename}`;
  res.json({ image_url });
});

// POST /api/upload/episode-video/:episodeId – upload và gán video_url cho episode
router.post(
  '/episode-video/:episodeId',
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

module.exports = router;

