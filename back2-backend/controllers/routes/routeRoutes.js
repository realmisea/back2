const express = require('express');
const { getRoute, getRestStops } = require('../controllers/routeController');
const router = express.Router();

// 경로 계산 API
router.post('/route', getRoute);

// 휴게소 정보 API
router.get('/rest-stops/:highwayCode', getRestStops);

module.exports = router;