const express = require('express');
const {
  listSeries,
  searchSeries,
  getSeriesById,
  listEpisodesOfSeries,
  getEpisodeById,
  getSeriesSuggestions,
  createSeries,
  updateSeries,
  deleteSeries,
  likeSeries,
  unlikeSeries,
  getSeriesLikeStatus,
  createEpisode,
  updateEpisode,
  deleteEpisode,
  createSeason,
  updateSeason,
  deleteSeason,
  getSeriesCast,
  addSeriesCast,
  removeSeriesCast,
  setSeriesGenres,
} = require('../controllers/series.controller');
const router = express.Router();

// PUBLIC
// GET /api/series
router.get('/', listSeries);

// GET /api/series/search?q= — tìm series theo tên
router.get('/search', searchSeries);

// GET /api/series/episode/:episodeId (phải đặt trước /:id)
router.get('/episode/:episodeId', getEpisodeById);

// GET /api/series/:id/suggestions?limit= — gợi ý theo thể loại + fallback
router.get('/:id/suggestions', getSeriesSuggestions);

// GET /api/series/:id/like-status?profile_id= — trạng thái like
router.get('/:id/like-status', getSeriesLikeStatus);

// GET /api/series/:id
router.get('/:id', getSeriesById);

// POST /api/series/:id/like — like (body: profile_id)
router.post('/:id/like', likeSeries);
// DELETE /api/series/:id/like?profile_id= — bỏ like
router.delete('/:id/like', unlikeSeries);

// GET /api/series/:id/episodes
router.get('/:id/episodes', listEpisodesOfSeries);

// GET /api/series/:id/cast
router.get('/:id/cast', getSeriesCast);
router.post('/:id/cast', addSeriesCast);
router.delete('/:id/cast/:personId', removeSeriesCast);

router.post('/:id/genres', setSeriesGenres);

// Tạm thời mở các API admin cho mọi user (sẽ thêm auth sau)

// POST /api/series
router.post('/', createSeries);

// PUT /api/series/:id
router.put('/:id', updateSeries);

// DELETE /api/series/:id
router.delete('/:id', deleteSeries);

// POST /api/series/episodes
router.post('/episodes', createEpisode);

// PUT /api/series/episodes/:episodeId
router.put('/episodes/:episodeId', updateEpisode);

// DELETE /api/series/episodes/:episodeId
router.delete('/episodes/:episodeId', deleteEpisode);

// POST /api/series/:id/seasons
router.post('/:id/seasons', createSeason);

// PUT /api/series/:id/seasons/:seasonId
router.put('/:id/seasons/:seasonId', updateSeason);

// DELETE /api/series/:id/seasons/:seasonId
router.delete('/:id/seasons/:seasonId', deleteSeason);

module.exports = router;


