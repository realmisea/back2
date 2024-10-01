const express = require('express');
const { getSimpleWeather, getDetailedWeather } = require('../controllers/weatherController');
const router = express.Router();

// 간단한 날씨 정보 (초기 화면)
router.get('/simple/:location', getSimpleWeather);

// 상세 날씨 정보 (날씨 상세 보기 버튼 클릭 시)
router.get('/details/:location', getDetailedWeather);

module.exports = router;
