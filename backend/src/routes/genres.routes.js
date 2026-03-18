const express = require('express');
const {
  listTopGenresWithMovies,
  listGenres,
  createGenre,
  updateGenre,
  deleteGenre,
} = require('../controllers/genres.controller');
const authMiddleware = require('../middleware/auth.middleware');

const router = express.Router();

// PUBLIC
router.get('/', listGenres);
router.get('/top-with-movies', listTopGenresWithMovies);

// ADMIN
function requireAdmin(req, res, next) {
  if (!req.user?.isAdmin) {
    return res.status(403).json({ message: 'Chỉ admin mới được phép thao tác' });
  }
  next();
}

router.post('/', authMiddleware, requireAdmin, createGenre);
router.put('/:id', authMiddleware, requireAdmin, updateGenre);
router.delete('/:id', authMiddleware, requireAdmin, deleteGenre);

module.exports = router;
