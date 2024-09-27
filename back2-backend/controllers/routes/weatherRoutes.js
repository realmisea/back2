const express = require('express');
const { getWeatherFromKMA, getAirQuality } = require('../controllers/weatherController');
const router = express.Router();

// 날씨 정보 API
router.get('/weather/:location', getWeatherFromKMA);

// 공기질 정보 API
router.get('/air-quality/:location', getAirQuality);

module.exports = router;