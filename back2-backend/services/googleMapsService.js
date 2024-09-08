const axios = require('axios');
const { googleMapsApiKey } = require('../config/apiKeys');

const getRoute = async (origin, destination, waypoints) => {
  const url = `https://maps.googleapis.com/maps/api/directions/json`;
  try {
    const response = await axios.get(url, {
      params: {
        origin,
        destination,
        waypoints,
        key: googleMapsApiKey
      }
    });
    return response.data;
  } catch (error) {
    throw new Error('Error fetching route data');
  }
};

module.exports = {
  getRoute
};
