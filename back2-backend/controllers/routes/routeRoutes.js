const express = require('express');
const { getRouteWeather } = require('../controllers/routeController');
const router = express.Router();

router.get('/route-weather', getRouteWeather);

module.exports = router;