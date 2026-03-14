const express = require('express');
const authMiddleware = require('../middleware/auth.middleware');
const {
  getEpisodeCast,
  addEpisodeCast,
  removeEpisodeCast,
} = require('../controllers/episodes.controller');

const router = express.Router();

// PUBLIC: lấy cast của một tập
// GET /api/episodes/:id/cast
router.get('/:id/cast', getEpisodeCast);

// ADMIN: gán / xoá cast cho tập
router.use(authMiddleware);

function requireAdmin(req, res, next) {
  if (!req.user?.isAdmin) {
    return res.status(403).json({ message: 'Chỉ admin mới được phép thao tác' });
  }
  next();
}

// POST /api/episodes/:id/cast
router.post('/:id/cast', requireAdmin, addEpisodeCast);

// DELETE /api/episodes/:episodeId/cast/:personId
router.delete('/:episodeId/cast/:personId', requireAdmin, removeEpisodeCast);

module.exports = router;

