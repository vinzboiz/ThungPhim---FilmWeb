const express = require('express');
const authMiddleware = require('../middleware/auth.middleware');
const {
  listProfiles,
  createProfile,
  updateProfile,
  deleteProfile,
  verifyProfilePin,
} = require('../controllers/profiles.controller');

const router = express.Router();

// Tất cả routes profile yêu cầu đăng nhập
router.use(authMiddleware);

// GET /api/profiles
router.get('/', listProfiles);

// POST /api/profiles
router.post('/', createProfile);

// PUT /api/profiles/:id
router.put('/:id', updateProfile);

// DELETE /api/profiles/:id
router.delete('/:id', deleteProfile);

// POST /api/profiles/:id/verify-pin
router.post('/:id/verify-pin', verifyProfilePin);

module.exports = router;


