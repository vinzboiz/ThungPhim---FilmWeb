const express = require('express');
const { listCountries } = require('../controllers/countries.controller');

const router = express.Router();
router.get('/', listCountries);
module.exports = router;
