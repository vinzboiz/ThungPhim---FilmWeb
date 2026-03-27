const express = require('express');
const { listNotifications, markAllRead } = require('../controllers/notifications.controller');
const authMiddleware = require('../middleware/auth.middleware');

const router = express.Router();

router.get('/', authMiddleware, listNotifications);
router.patch('/mark-all-read', authMiddleware, markAllRead);

module.exports = router;


