const express = require('express');
const {
  listGenres,
  createGenre,
  updateGenre,
  deleteGenre,
} = require('../controllers/genres.controller');

const router = express.Router();

// PUBLIC
router.get('/', listGenres);

// Tạm thời mở CRUD thể loại cho mọi user (sẽ thêm auth sau)
router.post('/', createGenre);
router.put('/:id', updateGenre);
router.delete('/:id', deleteGenre);

module.exports = router;
