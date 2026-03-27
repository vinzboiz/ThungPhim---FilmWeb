const express = require('express');
const authMiddleware = require('../middleware/auth.middleware');
const { getProgress, saveProgress, listContinueWatching, listWatchHistory } = require('../controllers/watch.controller');

const router = express.Router();

router.use(authMiddleware);

// GET /api/watch/progress?profile_id=&movie_id= hoặc &episode_id=
router.get('/progress', getProgress);

// POST /api/watch/progress
router.post('/progress', saveProgress);

// GET /api/watch/continue
router.get('/continue', listContinueWatching);

// GET /api/watch/history
router.get('/history', listWatchHistory);

module.exports = router;


