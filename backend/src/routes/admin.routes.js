const express = require('express');
const authMiddleware = require('../middleware/auth.middleware');
const { listUsers, updateUser } = require('../controllers/admin.controller');

const router = express.Router();

router.use(authMiddleware);

function requireAdmin(req, res, next) {
  if (!req.user?.isAdmin) {
    return res.status(403).json({ message: 'Chỉ admin mới được phép thao tác' });
  }
  next();
}

// GET /api/admin/users
router.get('/users', requireAdmin, listUsers);

// PATCH /api/admin/users/:id
router.patch('/users/:id', requireAdmin, updateUser);

module.exports = router;

