const express = require('express');
const { getSimpleWeather, getDetailedWeather } = require('../controllers/weatherController');

const router = express.Router();

router.get('/simple/:location', getSimpleWeather);
router.get('/detailed/:location', getDetailedWeather);

module.exports = router;
