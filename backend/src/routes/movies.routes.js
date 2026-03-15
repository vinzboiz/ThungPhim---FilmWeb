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
const router = express.Router();

// GET /api/movies
router.get('/', listMovies);

// POST /api/movies
router.post('/', createMovie);

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
router.put('/:id', updateMovie);

// DELETE /api/movies/:id
router.delete('/:id', deleteMovie);

// POST /api/movies/:id/genres – set list genres
router.post('/:id/genres', setMovieGenres);

// Cast
router.get('/:id/cast', getMovieCast);
router.post('/:id/cast', addMovieCast);
router.delete('/:movieId/cast/:personId', removeMovieCast);

module.exports = router;


