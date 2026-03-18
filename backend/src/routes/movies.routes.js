const express = require('express');
const {
  listMovies,
  getMovieById,
  listTopRatingMovies,
  listTrendingMovies,
  randomMovieWithTrailer,
  searchMovies,
  createMovie,
  updateMovie,
  deleteMovie,
  likeMovie,
  unlikeMovie,
  getMovieLikeStatus,
  setMovieGenres,
  getMovieGenres,
  getMovieCast,
  addMovieCast,
  removeMovieCast,
  getSuggestions,
} = require('../controllers/movies.controller');
const authMiddleware = require('../middleware/auth.middleware');
const router = express.Router();

function requireAdmin(req, res, next) {
  if (!req.user?.isAdmin) {
    return res.status(403).json({ message: 'Chỉ admin mới được phép thao tác' });
  }
  next();
}

// GET /api/movies
router.get('/', listMovies);

// POST /api/movies
router.post('/', authMiddleware, requireAdmin, createMovie);

// GET /api/movies/top-rating?limit=10
router.get('/top-rating', listTopRatingMovies);

// GET /api/movies/trending
router.get('/trending', listTrendingMovies);

// GET /api/movies/random-with-trailer — phải đặt trước /:id
router.get('/random-with-trailer', randomMovieWithTrailer);

// GET /api/movies/search
router.get('/search', searchMovies);

// GET /api/movies/:id/suggestions — gợi ý phim cùng thể loại
router.get('/:id/suggestions', getSuggestions);

// GET /api/movies/:id/like-status?profile_id= — trạng thái like (đã like chưa)
router.get('/:id/like-status', getMovieLikeStatus);

// GET /api/movies/:id/genres — danh sách thể loại của phim
router.get('/:id/genres', getMovieGenres);

// GET /api/movies/:id
router.get('/:id', getMovieById);

// Tạm thời mở các API admin cho mọi user (sẽ thêm auth sau)

// POST /api/movies/:id/like — like (body: profile_id)
router.post('/:id/like', likeMovie);
// DELETE /api/movies/:id/like?profile_id= — bỏ like
router.delete('/:id/like', unlikeMovie);

// PUT /api/movies/:id
router.put('/:id', authMiddleware, requireAdmin, updateMovie);

// DELETE /api/movies/:id
router.delete('/:id', authMiddleware, requireAdmin, deleteMovie);

// POST /api/movies/:id/genres – set list genres
router.post('/:id/genres', authMiddleware, requireAdmin, setMovieGenres);

// Cast
router.get('/:id/cast', getMovieCast);
router.post('/:id/cast', authMiddleware, requireAdmin, addMovieCast);
router.delete('/:movieId/cast/:personId', authMiddleware, requireAdmin, removeMovieCast);

module.exports = router;


