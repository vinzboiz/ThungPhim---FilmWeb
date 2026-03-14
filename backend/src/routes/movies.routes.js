const express = require('express');
const {
  listMovies,
  getMovieById,
  listTrendingMovies,
  randomMovieWithTrailer,
  searchMovies,
  createMovie,
  updateMovie,
  deleteMovie,
  likeMovie,
  setMovieGenres,
  getMovieGenres,
  getMovieCast,
  addMovieCast,
  removeMovieCast,
} = require('../controllers/movies.controller');
const router = express.Router();

// GET /api/movies
router.get('/', listMovies);

// POST /api/movies
router.post('/', createMovie);

// GET /api/movies/trending
router.get('/trending', listTrendingMovies);

// GET /api/movies/random-with-trailer — phải đặt trước /:id
router.get('/random-with-trailer', randomMovieWithTrailer);

// GET /api/movies/search
router.get('/search', searchMovies);

// GET /api/movies/:id
router.get('/:id', getMovieById);

// Tạm thời mở các API admin cho mọi user (sẽ thêm auth sau)

// POST /api/movies/:id/like – tăng lượt like
router.post('/:id/like', likeMovie);

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


