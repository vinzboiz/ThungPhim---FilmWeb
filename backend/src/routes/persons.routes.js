const express = require('express');
const {
  listPersons,
  getPersonById,
  getPersonMovies,
  createPerson,
  updatePerson,
  deletePerson,
} = require('../controllers/persons.controller');

const router = express.Router();

// GET /api/persons – danh sách (có ?q= để tìm kiếm)
router.get('/', listPersons);

// POST /api/persons
router.post('/', createPerson);

// Các route có :id phải đặt /:id/movies trước /:id
router.get('/:id/movies', getPersonMovies);
router.get('/:id', getPersonById);
router.put('/:id', updatePerson);
router.delete('/:id', deletePerson);

module.exports = router;


