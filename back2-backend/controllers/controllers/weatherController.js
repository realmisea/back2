const { getWeatherByCity } = require('../services/openWeatherMapService');

const fetchWeather = async (req, res) => {
  try {
    const { city } = req.query;
    if (!city) {
      return res.status(400).json({ error: 'City parameter is required' });
    }
    const weatherData = await getWeatherByCity(city);
    res.json(weatherData);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = {
  fetchWeather
};
