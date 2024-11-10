// routeRoutes.js
const express = require('express');
const { getSimpleWeather, getDetailedWeather } = require('../controllers/weatherController');
const router = express.Router();

// 간단한 날씨 정보 (초기 화면)
router.get('/simple/:location', (req, res, next) => {
    console.log(`Received request for /simple/${req.params.location}`);
    next();
}, getSimpleWeather);

// 상세 날씨 정보 (날씨 상세 보기 버튼 클릭 시)
router.get('/details/:location', (req, res, next) => {
    console.log(`Received request for /details/${req.params.location}`);
    next();
}, getDetailedWeather);

module.exports = router;
