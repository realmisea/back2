// controllers/routes/routeRoutes.js
const express = require('express');
const router = express.Router();
const { getRouteInfo } = require('../controllers/routeController');  // getRouteInfo 함수 불러오기

// '/route-info' 경로로 POST 요청 처리
router.post('/route-info', getRouteInfo);  // POST 요청을 getRouteInfo 함수로 처리

module.exports = router;
