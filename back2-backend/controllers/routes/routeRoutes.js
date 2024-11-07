const express = require('express');
const router = express.Router();
const { getRouteInfo } = require('../controllers/routeController');

// POST 요청 처리
router.post('/route-info', getRouteInfo);

module.exports = router;
