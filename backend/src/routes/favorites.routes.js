const express = require('express');
const authMiddleware = require('../middleware/auth.middleware');
const {
  listFavorites,
  addFavorite,
  removeFavorite,
  checkFavorite,
} = require('../controllers/favorites.controller');

const router = express.Router();

router.use(authMiddleware);

router.get('/', listFavorites);
router.get('/check', checkFavorite);
router.post('/', addFavorite);
router.delete('/:movieId', removeFavorite);

module.exports = router;
