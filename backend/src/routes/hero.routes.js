const express = require('express');
const { randomHeroItem } = require('../controllers/hero.controller');

const router = express.Router();

// GET /api/hero/random — random 1 movie hoặc series có trailer (cho banner trang chủ)
router.get('/random', randomHeroItem);

module.exports = router;
