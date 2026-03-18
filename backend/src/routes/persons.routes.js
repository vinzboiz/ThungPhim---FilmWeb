const express = require('express');
const {
  listPersons,
  getPersonById,
  getPersonMovies,
  createPerson,
  updatePerson,
  deletePerson,
} = require('../controllers/persons.controller');
const authMiddleware = require('../middleware/auth.middleware');

const router = express.Router();

// GET /api/persons – danh sách (có ?q= để tìm kiếm)
router.get('/', listPersons);

// ADMIN CRUD
function requireAdmin(req, res, next) {
  if (!req.user?.isAdmin) {
    return res.status(403).json({ message: 'Chỉ admin mới được phép thao tác' });
  }
  next();
}

// POST /api/persons
router.post('/', authMiddleware, requireAdmin, createPerson);

// Các route có :id phải đặt /:id/movies trước /:id
router.get('/:id/movies', getPersonMovies);
router.get('/:id', getPersonById);
router.put('/:id', authMiddleware, requireAdmin, updatePerson);
router.delete('/:id', authMiddleware, requireAdmin, deletePerson);

module.exports = router;


