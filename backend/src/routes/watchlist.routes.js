const express = require('express');
const authMiddleware = require('../middleware/auth.middleware');
const {
  listWatchlist,
  addToWatchlist,
  removeFromWatchlist,
} = require('../controllers/watchlist.controller');

const router = express.Router();

router.use(authMiddleware);

// GET /api/watchlist
router.get('/', listWatchlist);

// POST /api/watchlist
router.post('/', addToWatchlist);

// DELETE /api/watchlist/:movieId
router.delete('/:movieId', removeFromWatchlist);

module.exports = router;


