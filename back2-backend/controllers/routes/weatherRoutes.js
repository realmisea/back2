const express = require('express');
const { fetchWeather } = require('../controllers/weatherController');

const router = express.Router();

// 날씨 정보를 요청하는 엔드포인트
router.get('/weather', fetchWeather);

module.exports = router;