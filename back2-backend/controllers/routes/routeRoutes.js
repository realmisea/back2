const express = require('express');
const { fetchRoute } = require('../controllers/routeController');

const router = express.Router();

// 경로 정보를 요청하는 엔드포인트
router.get('/route', fetchRoute);

module.exports = router;