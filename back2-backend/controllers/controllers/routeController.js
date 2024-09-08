const { getRoute } = require('../services/googleMapsService');

const fetchRoute = async (req, res) => {
  try {
    const { origin, destination, waypoints } = req.query;
    if (!origin || !destination) {
      return res.status(400).json({ error: 'Origin and destination parameters are required' });
    }
    const routeData = await getRoute(origin, destination, waypoints);
    res.json(routeData);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = {
  fetchRoute
};