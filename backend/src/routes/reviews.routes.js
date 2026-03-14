const express = require('express');
const authMiddleware = require('../middleware/auth.middleware');
const {
  upsertReview,
  listMovieReviews,
  listEpisodeReviews,
  listSeriesReviews,
} = require('../controllers/reviews.controller');

const router = express.Router();

// PUBLIC: xem danh sách đánh giá
router.get('/movies/:id', listMovieReviews);
router.get('/episodes/:id', listEpisodeReviews);
router.get('/series/:id', listSeriesReviews);

// Bảo vệ: chỉ user đăng nhập mới được viết review
router.use(authMiddleware);

// POST /api/reviews
router.post('/', upsertReview);

module.exports = router;

