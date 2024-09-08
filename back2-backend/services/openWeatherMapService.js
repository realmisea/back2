const axios = require('axios');
const { openWeatherMapApiKey } = require('../config/apiKeys');

const getWeatherByCity = async (city) => {
  const url = `https://api.openweathermap.org/data/2.5/weather`;
  try {
    const response = await axios.get(url, {
      params: {
        q: city,
        appid: openWeatherMapApiKey
      }
    });
    return response.data;
  } catch (error) {
    throw new Error('Error fetching weather data');
  }
};

module.exports = {
  getWeatherByCity
};
