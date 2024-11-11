// controllers/routes/routeRoutes.js
const express = require('express');
const router = express.Router();
const { getRouteInfo } = require('../routeController');  // 경로 수정 확인

// POST 요청 처리
router.post('/route-info', getRouteInfo);

module.exports = router;
